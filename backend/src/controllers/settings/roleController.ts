import { Request, Response, NextFunction } from 'express';
import { roleService } from '../../services/settings/roleService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await roleService.list(tenantOf(req));
    return sendSuccess(res, r, 'Roles fetched');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await roleService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Role fetched');
  } catch (err: any) {
    if (err.message === 'ROLE_NOT_FOUND') return sendError(res, 'Role not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await roleService.create(tenantOf(req), req.body);
    return sendSuccess(res, r, 'Role created', 201);
  } catch (err: any) {
    if (err.message === 'ROLE_EXISTS') return sendError(res, 'A role with this name already exists', 409);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await roleService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, 'Role updated');
  } catch (err: any) {
    if (err.message === 'ROLE_NOT_FOUND')     return sendError(res, 'Role not found', 404);
    if (err.message === 'SYSTEM_ROLE_LOCKED') return sendError(res, 'System roles cannot have their permissions changed', 400);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await roleService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Role deleted');
  } catch (err: any) {
    if (err.message === 'ROLE_NOT_FOUND')     return sendError(res, 'Role not found', 404);
    if (err.message === 'SYSTEM_ROLE_LOCKED') return sendError(res, 'System roles cannot be deleted', 400);
    next(err);
  }
};

// POST /roles/:id/assign  { userId }
export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await roleService.assign(tenantOf(req), req.params.id as string, req.body.userId);
    return sendSuccess(res, r, 'Role assigned to user');
  } catch (err: any) {
    if (err.message === 'ROLE_NOT_FOUND') return sendError(res, 'Role not found', 404);
    if (err.message === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    next(err);
  }
};

// POST /roles/:id/revoke  { userId }
export const revoke = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await roleService.revoke(tenantOf(req), req.params.id as string, req.body.userId);
    return sendSuccess(res, {}, 'Role revoked from user');
  } catch (err: any) {
    if (err.message === 'ROLE_NOT_FOUND') return sendError(res, 'Role not found', 404);
    next(err);
  }
};
