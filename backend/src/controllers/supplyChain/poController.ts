import { Request, Response, NextFunction } from 'express';
import { poService } from '../../services/supplyChain/poService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userOf   = (req: Request) => (req as any).user?.userId || (req as any).user?.id;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, vendorId, page, limit } = req.query;
    const r = await poService.list({
      tenantId: tenantOf(req),
      status: status as string | undefined,
      vendorId: vendorId as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await poService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, po, 'Purchase order fetched');
  } catch (err: any) {
    if (err.message === 'PO_NOT_FOUND') return sendError(res, 'Purchase order not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await poService.create(tenantOf(req), userOf(req), req.body);
    return sendSuccess(res, po, 'Purchase order created', 201);
  } catch (err: any) {
    if (err.message === 'VENDOR_NOT_FOUND')  return sendError(res, 'Vendor not found', 404);
    if (err.message === 'PO_NUMBER_EXISTS')  return sendError(res, 'A PO with this number already exists', 409);
    next(err);
  }
};

// PUT /:id → reused for "send" (DRAFT→SENT). Body-less.
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await poService.send(tenantOf(req), userOf(req), req.params.id as string);
    return sendSuccess(res, po, 'Purchase order sent to vendor');
  } catch (err: any) {
    if (err.message === 'PO_NOT_FOUND') return sendError(res, 'Purchase order not found', 404);
    if (err.message === 'PO_NOT_DRAFT') return sendError(res, 'Only DRAFT purchase orders can be sent', 400);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await poService.cancel(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Purchase order cancelled');
  } catch (err: any) {
    if (err.message === 'PO_NOT_FOUND')        return sendError(res, 'Purchase order not found', 404);
    if (err.message === 'PO_ALREADY_RECEIVED') return sendError(res, 'Cannot cancel a received purchase order', 400);
    next(err);
  }
};

// POST /:id/receive — record goods receipt
export const receive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await poService.receive(tenantOf(req), userOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, `Goods received — PO is now ${r.status}`, 201);
  } catch (err: any) {
    if (err.message === 'PO_NOT_FOUND')        return sendError(res, 'Purchase order not found', 404);
    if (err.message === 'PO_NOT_SENT')         return sendError(res, 'PO must be sent before receiving goods', 400);
    if (err.message === 'PO_CANCELLED')        return sendError(res, 'Cannot receive a cancelled PO', 400);
    if (err.message === 'PO_ALREADY_RECEIVED') return sendError(res, 'PO is already fully received', 400);
    if (err.message === 'LINE_NOT_FOUND')      return sendError(res, 'A line item id does not belong to this PO', 400);
    if (err.message === 'OVER_RECEIPT')        return sendError(res, 'Received quantity exceeds the ordered quantity', 400);
    next(err);
  }
};
