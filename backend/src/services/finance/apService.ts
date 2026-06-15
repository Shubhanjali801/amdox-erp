/**
 * Accounts Payable (AP) Service — M3 / F-03
 * Vendor invoices: create, list, approve, pay-status.
 * All AP invoices have type = 'AP'.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';

export interface InvoiceLineInput {
  description: string;
  quantity:    number;
  unitPrice:   number;
  taxRate?:    number;
  accountId?:  string;
}

export interface CreateApInput {
  tenantId:        string;
  invoiceNumber:   string;
  vendorId?:       string;
  purchaseOrderId?: string;
  currency?:       string;
  issueDate:       string;
  dueDate:         string;
  notes?:          string;
  lineItems:       InvoiceLineInput[];
}

export interface ListApParams {
  tenantId:  string;
  page?:     number;
  limit?:    number;
  status?:   string;
  vendorId?: string;
  search?:   string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const apService = {

  // ── List AP invoices (tenant-scoped, paginated) ──────────
  async list(params: ListApParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 20);
    const skip  = (page - 1) * limit;

    const where: any = { tenantId: params.tenantId, type: 'AP', deletedAt: null };
    if (params.status)   where.status   = params.status;
    if (params.vendorId) where.vendorId = params.vendorId;
    if (params.search)   where.invoiceNumber = { contains: params.search, mode: 'insensitive' };

    const [data, total] = await Promise.all([
      prisma.invoice.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { vendor: { select: { name: true, code: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    return { data, total, page, limit };
  },

  // ── Get one (with line items + payments) ─────────────────
  async getById(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({
      where:   { id, tenantId, type: 'AP' },
      include: { lineItems: true, payments: true, vendor: true },
    });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    return invoice;
  },

  // ── Create AP invoice (computes totals from line items) ──
  async create(input: CreateApInput) {
    const existing = await prisma.invoice.findFirst({
      where: { tenantId: input.tenantId, invoiceNumber: input.invoiceNumber },
    });
    if (existing) throw new Error('INVOICE_NUMBER_TAKEN');

    if (input.vendorId) {
      const vendor = await prisma.vendor.findFirst({
        where: { id: input.vendorId, tenantId: input.tenantId },
      });
      if (!vendor) throw new Error('VENDOR_NOT_FOUND');
    }

    if (!input.lineItems?.length) throw new Error('NO_LINE_ITEMS');

    // Compute totals from line items
    let amount = 0;
    let taxAmount = 0;
    const lines = input.lineItems.map((li) => {
      const lineTotal = round2(li.quantity * li.unitPrice);
      const lineTax   = round2(lineTotal * ((li.taxRate || 0) / 100));
      amount    += lineTotal;
      taxAmount += lineTax;
      return {
        description: li.description,
        quantity:    li.quantity,
        unitPrice:   li.unitPrice,
        totalPrice:  lineTotal,
        taxRate:     li.taxRate || 0,
        accountId:   li.accountId,
      };
    });
    amount      = round2(amount);
    taxAmount   = round2(taxAmount);
    const total = round2(amount + taxAmount);

    const invoice = await prisma.invoice.create({
      data: {
        tenantId:        input.tenantId,
        type:            'AP',
        invoiceNumber:   input.invoiceNumber,
        vendorId:        input.vendorId,
        purchaseOrderId: input.purchaseOrderId,
        amount,
        taxAmount,
        totalAmount:     total,
        currency:        input.currency || 'INR',
        issueDate:       new Date(input.issueDate),
        dueDate:         new Date(input.dueDate),
        status:          'DRAFT',
        notes:           input.notes,
        lineItems:       { create: lines },
      },
      include: { lineItems: true },
    });

    logger.info(`AP invoice created: ${invoice.invoiceNumber} (total ${total})`);
    return invoice;
  },

  // ── Approve an invoice ───────────────────────────────────
  async approve(tenantId: string, id: string, approvedBy: string) {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId, type: 'AP' } });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status !== 'DRAFT' && invoice.status !== 'PENDING')
      throw new Error('INVALID_STATUS_FOR_APPROVAL');

    const updated = await prisma.invoice.update({
      where: { id },
      data:  { status: 'APPROVED', approvedBy, approvedAt: new Date() },
    });
    logger.info(`AP invoice approved: ${updated.invoiceNumber}`);
    return updated;
  },

  // ── Update (notes, dueDate, status) ──────────────────────
  async update(tenantId: string, id: string, data: any) {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId, type: 'AP' } });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        notes:   data.notes   ?? undefined,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        status:  data.status  ?? undefined,
      },
    });
    return updated;
  },

  // ── Soft delete ──────────────────────────────────────────
  async remove(tenantId: string, id: string) {
    const invoice = await prisma.invoice.findFirst({ where: { id, tenantId, type: 'AP' } });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status === 'PAID') throw new Error('CANNOT_DELETE_PAID');

    await prisma.invoice.update({ where: { id }, data: { deletedAt: new Date() } });
    logger.info(`AP invoice deleted: ${invoice.invoiceNumber}`);
  },
};
