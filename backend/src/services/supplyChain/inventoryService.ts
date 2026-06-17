/**
 * Inventory Service — M5 / F-05
 * Inventory items + stock movements (IN/OUT/ADJUSTMENT) that keep
 * quantityOnHand in sync. Tenant-scoped.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface ItemListParams { tenantId: string; category?: string; lowStock?: boolean; search?: string; page?: number; limit?: number; }

const num = (v: any) => Number(v);

export const inventoryService = {
  async list(p: ItemListParams) {
    const page = Math.max(1, p.page || 1);
    const limit = Math.min(100, p.limit || 20);
    const where: any = { tenantId: p.tenantId };
    if (p.category) where.category = p.category;
    if (p.search) where.OR = [
      { name: { contains: p.search, mode: 'insensitive' } },
      { sku: { contains: p.search, mode: 'insensitive' } },
    ];
    let [data, total] = await Promise.all([
      prisma.inventoryItem.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { name: 'asc' } }),
      prisma.inventoryItem.count({ where }),
    ]);
    // lowStock filter applied in-memory (Decimal comparison)
    if (p.lowStock) data = data.filter((i) => num(i.quantityOnHand) <= num(i.reorderPoint));
    return { data, total, page, limit };
  },

  async getById(tenantId: string, id: string) {
    const item = await prisma.inventoryItem.findFirst({
      where: { id, tenantId },
      include: { preferredVendor: { select: { id: true, name: true, code: true } } },
    });
    if (!item) throw new Error('ITEM_NOT_FOUND');
    return item;
  },

  async create(tenantId: string, input: any) {
    const dup = await prisma.inventoryItem.findFirst({ where: { tenantId, sku: input.sku } });
    if (dup) throw new Error('SKU_EXISTS');
    const { quantityOnHand = 0, ...rest } = input;
    const item = await prisma.inventoryItem.create({ data: { tenantId, quantityOnHand, ...rest } });
    // Opening stock → initial IN movement
    if (num(quantityOnHand) > 0) {
      await prisma.stockMovement.create({
        data: { inventoryItemId: item.id, type: 'IN', quantity: quantityOnHand, unitCost: item.unitCost, reference: 'OPENING_STOCK' },
      });
    }
    logger.info(`Inventory item created: ${item.sku} (${item.id})`);
    return item;
  },

  async update(tenantId: string, id: string, input: any) {
    await this.getById(tenantId, id);
    return prisma.inventoryItem.update({ where: { id }, data: input });
  },

  async remove(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.inventoryItem.update({ where: { id }, data: { isActive: false } });
    logger.info(`Inventory item deactivated: ${id}`);
  },

  // ── Record a stock movement + update quantityOnHand ──────
  async recordMovement(tenantId: string, id: string, input: any) {
    const item = await this.getById(tenantId, id);
    const qty = num(input.quantity);
    const onHand = num(item.quantityOnHand);

    let delta = 0;
    if (input.type === 'IN') delta = qty;
    else if (input.type === 'OUT' || input.type === 'TRANSFER') delta = -qty;
    else if (input.type === 'ADJUSTMENT') delta = qty; // signed handled by sending +/- via two calls; ADJUSTMENT adds

    const newQty = onHand + delta;
    if (newQty < 0) throw new Error('INSUFFICIENT_STOCK');

    const result = await prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          inventoryItemId: id, type: input.type, quantity: qty,
          unitCost: input.unitCost, reference: input.reference, notes: input.notes,
        },
      });
      const updated = await tx.inventoryItem.update({ where: { id }, data: { quantityOnHand: newQty } });
      return { movement, quantityOnHand: updated.quantityOnHand };
    });
    logger.info(`Stock ${input.type} ${qty} for item ${item.sku} → onHand ${newQty}`);
    return result;
  },

  async movements(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    return prisma.stockMovement.findMany({ where: { inventoryItemId: id }, orderBy: { createdAt: 'desc' }, take: 100 });
  },
};
