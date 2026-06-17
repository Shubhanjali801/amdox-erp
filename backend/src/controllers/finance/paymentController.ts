import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../../services/finance/paymentService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /finance/payments ────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, page, limit } = req.query;
    const result = await paymentService.list({
      tenantId:  tenantOf(req),
      invoiceId: invoiceId as string | undefined,
      page:  page  ? parseInt(page as string)  : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

// ─── GET /finance/payments/:id ────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payment = await paymentService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, payment, 'Payment fetched');
  } catch (err: any) {
    if (err.message === 'PAYMENT_NOT_FOUND') return sendError(res, 'Payment not found', 404);
    next(err);
  }
};

// ─── POST /finance/payments ───────────────────────────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { invoiceId, amount, method, reference, paymentDate } = req.body;
    const result = await paymentService.create({
      tenantId: tenantOf(req),
      invoiceId, amount, method, reference, paymentDate,
    });
    return sendSuccess(res, result, `Payment recorded — invoice is now ${result.newStatus}`, 201);
  } catch (err: any) {
    if (err.message === 'INVOICE_NOT_FOUND')    return sendError(res, 'Invoice not found', 404);
    if (err.message === 'INVOICE_NOT_APPROVED') return sendError(res, 'Invoice must be approved before payment', 400);
    if (err.message === 'INVOICE_CANCELLED')    return sendError(res, 'Cannot pay a cancelled invoice', 400);
    if (err.message === 'INVALID_AMOUNT')       return sendError(res, 'Payment amount must be positive', 400);
    if (err.message === 'OVERPAYMENT')          return sendError(res, 'Payment exceeds the invoice balance', 400);
    next(err);
  }
};

// ─── DELETE /finance/payments/:id ─────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await paymentService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Payment deleted (invoice status reverted)');
  } catch (err: any) {
    if (err.message === 'PAYMENT_NOT_FOUND') return sendError(res, 'Payment not found', 404);
    next(err);
  }
};
