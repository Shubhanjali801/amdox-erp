import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { leaveService } from '../../services/hr/leaveService';

export const getTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await leaveService.listTypes(req.user!.tenantId), 'Leave types fetched');
  } catch (error) {
    return next(error);
  }
};

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await leaveService.list(req.user!.tenantId, req.query), 'Leave requests fetched');
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await leaveService.get(req.user!.tenantId, req.params.id), 'Leave request fetched');
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await leaveService.create(req.user!.tenantId, req.body), 'Leave request created', 201);
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await leaveService.update(req.user!.tenantId, req.params.id, req.body), 'Leave request updated');
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await leaveService.remove(req.user!.tenantId, req.params.id);
    return sendSuccess(res, null, 'Leave request deleted');
  } catch (error) {
    return next(error);
  }
};
