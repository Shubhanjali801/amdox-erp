import { Request, Response, NextFunction } from 'express';
import { apService } from '../../services/finance/apService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userOf   = (req: Request) => (req as any).user?.userId as string;

// ─── GET /finance/ap ──────────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, vendorId, search } = req.query;
    const result = await apService.list({
      tenantId: tenantOf(req),
      page:     page  ? parseInt(page as string)  : undefined,
      limit:    limit ? parseInt(limit as string) : undefined,
      status:   status as string | undefined,
      vendorId: vendorId as string | undefined,
      search:   search as string | undefined,
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

// ─── GET /finance/ap/:id ──────────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await apService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, invoice, 'Invoice fetched');
  } catch (err: any) {
    if (err.message === 'INVOICE_NOT_FOUND') return sendError(res, 'Invoice not found', 404);
    next(err);
  }
};

// ─── POST /finance/ap ─────────────────────────────────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await apService.create({ tenantId: tenantOf(req), ...req.body });
    return sendSuccess(res, invoice, 'AP invoice created', 201);
  } catch (err: any) {
    if (err.message === 'INVOICE_NUMBER_TAKEN') return sendError(res, 'Invoice number already exists', 409);
    if (err.message === 'VENDOR_NOT_FOUND')     return sendError(res, 'Vendor not found', 400);
    if (err.message === 'NO_LINE_ITEMS')        return sendError(res, 'At least one line item is required', 400);
    next(err);
  }
};

// ─── POST /finance/ap/:id/approve ─────────────────────────
export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await apService.approve(tenantOf(req), req.params.id as string, userOf(req));
    return sendSuccess(res, invoice, 'Invoice approved');
  } catch (err: any) {
    if (err.message === 'INVOICE_NOT_FOUND')            return sendError(res, 'Invoice not found', 404);
    if (err.message === 'INVALID_STATUS_FOR_APPROVAL')  return sendError(res, 'Only draft/pending invoices can be approved', 400);
    next(err);
  }
};

// ─── PUT /finance/ap/:id ──────────────────────────────────
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = await apService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, invoice, 'Invoice updated');
  } catch (err: any) {
    if (err.message === 'INVOICE_NOT_FOUND') return sendError(res, 'Invoice not found', 404);
    next(err);
  }
};

// ─── DELETE /finance/ap/:id ───────────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await apService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Invoice deleted');
  } catch (err: any) {
    if (err.message === 'INVOICE_NOT_FOUND')   return sendError(res, 'Invoice not found', 404);
    if (err.message === 'CANNOT_DELETE_PAID')  return sendError(res, 'Cannot delete a paid invoice', 409);
    next(err);
  }
};
