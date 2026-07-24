import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../../services/supplyChain/inventoryService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, lowStock, page, limit } = req.query;
    const r = await inventoryService.list({
      tenantId: tenantOf(req),
      category: category as string | undefined,
      search: search as string | undefined,
      lowStock: lowStock === 'true',
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, item, 'Inventory item fetched');
  } catch (err: any) {
    if (err.message === 'ITEM_NOT_FOUND') return sendError(res, 'Inventory item not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.create(tenantOf(req), req.body);
    return sendSuccess(res, item, 'Inventory item created', 201);
  } catch (err: any) {
    if (err.message === 'SKU_EXISTS') return sendError(res, 'An item with this SKU already exists', 409);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await inventoryService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, item, 'Inventory item updated');
  } catch (err: any) {
    if (err.message === 'ITEM_NOT_FOUND') return sendError(res, 'Inventory item not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await inventoryService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Inventory item deactivated');
  } catch (err: any) {
    if (err.message === 'ITEM_NOT_FOUND') return sendError(res, 'Inventory item not found', 404);
    next(err);
  }
};

// ── POST /:id/movements — record stock movement ──
export const addMovement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await inventoryService.recordMovement(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, `Stock movement recorded — on hand: ${r.quantityOnHand}`, 201);
  } catch (err: any) {
    if (err.message === 'ITEM_NOT_FOUND')      return sendError(res, 'Inventory item not found', 404);
    if (err.message === 'INSUFFICIENT_STOCK')  return sendError(res, 'Not enough stock on hand for this OUT/TRANSFER', 400);
    next(err);
  }
};

// ── GET /:id/movements — movement history ──
export const listMovements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await inventoryService.movements(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Stock movements fetched');
  } catch (err: any) {
    if (err.message === 'ITEM_NOT_FOUND') return sendError(res, 'Inventory item not found', 404);
    next(err);
  }
};
