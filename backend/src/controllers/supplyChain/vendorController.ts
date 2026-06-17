import { Request, Response, NextFunction } from 'express';
import { vendorService } from '../../services/supplyChain/vendorService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page, limit } = req.query;
    const r = await vendorService.list({
      tenantId: tenantOf(req),
      status: status as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const v = await vendorService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, v, 'Vendor fetched');
  } catch (err: any) {
    if (err.message === 'VENDOR_NOT_FOUND') return sendError(res, 'Vendor not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const v = await vendorService.create(tenantOf(req), req.body);
    return sendSuccess(res, v, 'Vendor created', 201);
  } catch (err: any) {
    if (err.message === 'VENDOR_CODE_EXISTS') return sendError(res, 'A vendor with this code already exists', 409);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const v = await vendorService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, v, 'Vendor updated');
  } catch (err: any) {
    if (err.message === 'VENDOR_NOT_FOUND') return sendError(res, 'Vendor not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await vendorService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Vendor deleted');
  } catch (err: any) {
    if (err.message === 'VENDOR_NOT_FOUND') return sendError(res, 'Vendor not found', 404);
    next(err);
  }
};
