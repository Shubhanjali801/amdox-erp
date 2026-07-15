/**
 * Payment Service — M3 / F-03
 * Records payments against invoices (AP or AR) and auto-updates
 * the invoice status to PARTIALLY_PAID / PAID based on total paid.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';
import { notificationService } from '../notification/notificationService';

export interface CreatePaymentInput {
  tenantId:    string;
  invoiceId:   string;
  amount:      number;
  method:      string;   // BANK_TRANSFER | CHEQUE | CARD | CASH | CRYPTO
  reference?:  string;
  paymentDate?: string;
}

export interface ListPaymentParams {
  tenantId:  string;
  invoiceId?: string;
  page?:     number;
  limit?:    number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export const paymentService = {

  // ── List payments (tenant-scoped) ────────────────────────
  async list(params: ListPaymentParams) {
    const page  = Math.max(1, params.page  || 1);
    const limit = Math.min(100, params.limit || 20);
    const skip  = (page - 1) * limit;

    const where: any = { tenantId: params.tenantId };
    if (params.invoiceId) where.invoiceId = params.invoiceId;

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where, skip, take: limit,
        orderBy: { paymentDate: 'desc' },
        include: { invoice: { select: { invoiceNumber: true, type: true, totalAmount: true } } },
      }),
      prisma.payment.count({ where }),
    ]);
    return { data, total, page, limit };
  },

  // ── Get one ──────────────────────────────────────────────
  async getById(tenantId: string, id: string) {
    const payment = await prisma.payment.findFirst({
      where: { id, tenantId },
      include: { invoice: true },
    });
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    return payment;
  },

  // ── Record a payment + auto-update invoice status ────────
  async create(input: CreatePaymentInput) {
    // Invoice must exist, belong to tenant, and be approved
    const invoice = await prisma.invoice.findFirst({
      where: { id: input.invoiceId, tenantId: input.tenantId, deletedAt: null },
    });
    if (!invoice) throw new Error('INVOICE_NOT_FOUND');
    if (invoice.status === 'DRAFT' || invoice.status === 'PENDING')
      throw new Error('INVOICE_NOT_APPROVED');
    if (invoice.status === 'CANCELLED') throw new Error('INVOICE_CANCELLED');
    if (input.amount <= 0) throw new Error('INVALID_AMOUNT');

    // How much already paid?
    const agg = await prisma.payment.aggregate({
      where: { invoiceId: invoice.id, status: 'COMPLETED' },
      _sum: { amount: true },
    });
    const alreadyPaid = Number(agg._sum.amount || 0);
    const invoiceTotal = Number(invoice.totalAmount);
    const newTotalPaid = round2(alreadyPaid + input.amount);

    if (newTotalPaid > invoiceTotal + 0.01) throw new Error('OVERPAYMENT');

    // Create payment + update invoice status in one transaction
    const result = await prisma.$transaction(async (tx) => {
      // Re-check overpayment INSIDE the transaction. The aggregate above ran
      // before the transaction opened, so two concurrent payments could each
      // see the old total, both pass, and overpay the invoice.
      const freshAgg = await tx.payment.aggregate({
        where: { invoiceId: invoice.id, status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const freshPaid = round2(Number(freshAgg._sum.amount || 0) + input.amount);
      if (freshPaid > invoiceTotal + 0.01) throw new Error('OVERPAYMENT');

      const payment = await tx.payment.create({
        data: {
          tenantId:    input.tenantId,
          invoiceId:   input.invoiceId,
          amount:      input.amount,
          currency:    invoice.currency,
          method:      input.method as any,
          reference:   input.reference,
          paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
          status:      'COMPLETED',
        },
      });

      // Determine new invoice status from the FRESH total, not the pre-transaction one
      const fullyPaid = freshPaid >= invoiceTotal - 0.01;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: fullyPaid ? 'PAID' : 'PARTIALLY_PAID',
          paidAt: fullyPaid ? new Date() : null,
        },
      });

      return { payment, newStatus: fullyPaid ? 'PAID' : 'PARTIALLY_PAID', totalPaid: freshPaid, invoiceTotal };
    });

    logger.info(
      `Payment ${input.amount} recorded for invoice ${invoice.invoiceNumber} → ${result.newStatus}`
    );

    await notificationService.notifyTenant(input.tenantId, {
      title: `Payment recorded — ${invoice.invoiceNumber}`,
      message: `${invoice.currency} ${input.amount} received against invoice ${invoice.invoiceNumber}. Status is now ${result.newStatus}.`,
      type: result.newStatus === 'PAID' ? 'SUCCESS' : 'INFO',
      event: 'finance.payment.recorded',
      resourceId: result.payment.id,
    });

    return result;
  },

  // ── Refund / delete a payment (reverts invoice status) ───
  async remove(tenantId: string, id: string) {
    const payment = await prisma.payment.findFirst({ where: { id, tenantId } });
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');

    await prisma.$transaction(async (tx) => {
      await tx.payment.delete({ where: { id } });

      // Recompute invoice status
      const agg = await tx.payment.aggregate({
        where: { invoiceId: payment.invoiceId, status: 'COMPLETED' },
        _sum: { amount: true },
      });
      const paid = Number(agg._sum.amount || 0);
      const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } });
      if (invoice) {
        const total = Number(invoice.totalAmount);
        const status = paid <= 0 ? 'APPROVED' : paid >= total - 0.01 ? 'PAID' : 'PARTIALLY_PAID';
        await tx.invoice.update({
          where: { id: invoice.id },
          data: { status, paidAt: status === 'PAID' ? new Date() : null },
        });
      }
    });

    logger.info(`Payment deleted: ${id}`);
  },
};
