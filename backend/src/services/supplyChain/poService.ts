/**
 * Purchase Order Service — M5 / F-05
 * PO lifecycle: DRAFT → SENT → (PARTIALLY_)RECEIVED. Receiving goods
 * creates a GoodsReceipt, bumps stock IN, and updates inventory.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

const round2 = (n: number) => Math.round(n * 100) / 100;
const num = (v: any) => Number(v);

export interface POListParams { tenantId: string; status?: string; vendorId?: string; page?: number; limit?: number; }

export const poService = {
  async list(p: POListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(100, p.limit || 20);
    const where: any = { tenantId: p.tenantId };
    if (p.status) where.status = p.status;
    if (p.vendorId) where.vendorId = p.vendorId;
    const [data, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { name: true, code: true } }, _count: { select: { lineItems: true } } },
      }),
      prisma.purchaseOrder.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, tenantId },
      include: { vendor: true, lineItems: true, goodsReceipts: { include: { lineItems: true } } },
    });
    if (!po) throw new Error('PO_NOT_FOUND');
    return po;
  },

  async create(tenantId: string, userId: string | undefined, input: any) {
    // Vendor must belong to tenant
    const vendor = await prisma.vendor.findFirst({ where: { id: input.vendorId, tenantId, deletedAt: null } });
    if (!vendor) throw new Error('VENDOR_NOT_FOUND');

    const dup = await prisma.purchaseOrder.findFirst({ where: { tenantId, poNumber: input.poNumber } });
    if (dup) throw new Error('PO_NUMBER_EXISTS');

    const lines = input.lineItems.map((l: any) => {
      const totalPrice = round2(num(l.quantity) * num(l.unitPrice));
      return {
        inventoryItemId: l.inventoryItemId || null,
        description: l.description, quantity: l.quantity, unitPrice: l.unitPrice, totalPrice,
      };
    });
    const subtotal = round2(lines.reduce((s: number, l: any) => s + l.totalPrice, 0));
    const taxAmount = round2(subtotal * (num(input.taxRate || 0) / 100));
    const totalAmount = round2(subtotal + taxAmount);

    const po = await prisma.purchaseOrder.create({
      data: {
        tenantId, poNumber: input.poNumber, vendorId: input.vendorId, requestedBy: userId,
        currency: input.currency || vendor.currency, subtotal, taxAmount, totalAmount,
        expectedDelivery: input.expectedDelivery ? new Date(input.expectedDelivery) : null,
        notes: input.notes, status: 'DRAFT',
        lineItems: { create: lines },
      },
      include: { lineItems: true, vendor: { select: { name: true, code: true } } },
    });
    logger.info(`PO created: ${po.poNumber} (${po.id}) total ${totalAmount}`);
    return po;
  },

  // Move DRAFT → SENT (i.e. issue the PO to the vendor)
  async send(tenantId: string, userId: string | undefined, id: string) {
    const po = await this.getById(tenantId, id);
    if (po.status !== 'DRAFT') throw new Error('PO_NOT_DRAFT');
    return prisma.purchaseOrder.update({ where: { id }, data: { status: 'SENT', approvedBy: userId } });
  },

  async cancel(tenantId: string, id: string) {
    const po = await this.getById(tenantId, id);
    if (po.status === 'RECEIVED') throw new Error('PO_ALREADY_RECEIVED');
    return prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  },

  // ── Receive goods → GRN + stock IN + inventory update ────
  async receive(tenantId: string, userId: string | undefined, id: string, input: any) {
    const po = await this.getById(tenantId, id);
    if (po.status === 'DRAFT')     throw new Error('PO_NOT_SENT');
    if (po.status === 'CANCELLED') throw new Error('PO_CANCELLED');
    if (po.status === 'RECEIVED')  throw new Error('PO_ALREADY_RECEIVED');

    const lineMap = new Map(po.lineItems.map((l) => [l.id, l]));
    // Validate received lines
    for (const r of input.lines) {
      const line = lineMap.get(r.lineItemId);
      if (!line) throw new Error('LINE_NOT_FOUND');
      const remaining = num(line.quantity) - num(line.receivedQty);
      if (num(r.receivedQty) > remaining + 0.001) throw new Error('OVER_RECEIPT');
    }

    const result = await prisma.$transaction(async (tx) => {
      const grn = await tx.goodsReceipt.create({
        data: {
          purchaseOrderId: id, receivedBy: userId,
          receiptDate: input.receiptDate ? new Date(input.receiptDate) : new Date(),
          notes: input.notes,
          lineItems: {
            create: input.lines.map((r: any) => {
              const line = lineMap.get(r.lineItemId)!;
              return { inventoryItemId: line.inventoryItemId, description: line.description, orderedQty: line.quantity, receivedQty: r.receivedQty };
            }),
          },
        },
        include: { lineItems: true },
      });

      // Update each PO line receivedQty + stock IN + inventory qty
      for (const r of input.lines) {
        const line = lineMap.get(r.lineItemId)!;
        await tx.pOLineItem.update({ where: { id: line.id }, data: { receivedQty: num(line.receivedQty) + num(r.receivedQty) } });
        if (line.inventoryItemId) {
          await tx.stockMovement.create({
            data: { inventoryItemId: line.inventoryItemId, type: 'IN', quantity: r.receivedQty, unitCost: line.unitPrice, reference: `PO-${po.poNumber}` },
          });
          const item = await tx.inventoryItem.findUnique({ where: { id: line.inventoryItemId } });
          if (item) await tx.inventoryItem.update({ where: { id: item.id }, data: { quantityOnHand: num(item.quantityOnHand) + num(r.receivedQty) } });
        }
      }

      // Recompute PO status: fully vs partially received
      const freshLines = await tx.pOLineItem.findMany({ where: { purchaseOrderId: id } });
      const allReceived = freshLines.every((l) => num(l.receivedQty) >= num(l.quantity) - 0.001);
      const status = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: { status, deliveredAt: allReceived ? new Date() : null },
      });
      return { grn, status: updatedPo.status };
    });

    logger.info(`PO ${po.poNumber} received → ${result.status}`);
    return result;
  },
};
