import { Request, Response, NextFunction } from 'express';
import { permissionService } from '../../services/settings/permissionService';
import { sendSuccess, sendError } from '../../utils/response';

export const getAll = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await permissionService.list();
    return sendSuccess(res, r, 'Permissions fetched');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await permissionService.getById(req.params.id as string);
    return sendSuccess(res, p, 'Permission fetched');
  } catch (err: any) {
    if (err.message === 'PERMISSION_NOT_FOUND') return sendError(res, 'Permission not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await permissionService.create(req.body);
    return sendSuccess(res, p, 'Permission created', 201);
  } catch (err: any) {
    if (err.message === 'PERMISSION_EXISTS') return sendError(res, 'This resource:action permission already exists', 409);
    next(err);
  }
};

export const update = async (_req: Request, res: Response) =>
  sendError(res, 'Permissions are immutable — delete and recreate instead', 405);

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await permissionService.remove(req.params.id as string);
    return sendSuccess(res, {}, 'Permission deleted');
  } catch (err: any) {
    if (err.message === 'PERMISSION_NOT_FOUND') return sendError(res, 'Permission not found', 404);
    next(err);
  }
};
