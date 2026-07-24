import { Request, Response, NextFunction } from 'express';
import { resourceService } from '../../services/project/resourceService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await resourceService.list(tenantOf(req), req.query.projectId as string | undefined);
    return sendSuccess(res, r, 'Resource allocations fetched');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await resourceService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Resource allocation fetched');
  } catch (err: any) {
    if (err.message === 'RESOURCE_NOT_FOUND') return sendError(res, 'Resource allocation not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await resourceService.create(tenantOf(req), req.body);
    return sendSuccess(res, r, 'Employee allocated to project', 201);
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND')  return sendError(res, 'Project not found', 404);
    if (err.message === 'EMPLOYEE_NOT_FOUND') return sendError(res, 'Employee not found', 404);
    if (err.message === 'ALREADY_ALLOCATED')  return sendError(res, 'Employee is already allocated to this project', 409);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await resourceService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, 'Allocation updated');
  } catch (err: any) {
    if (err.message === 'RESOURCE_NOT_FOUND') return sendError(res, 'Resource allocation not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await resourceService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Allocation removed');
  } catch (err: any) {
    if (err.message === 'RESOURCE_NOT_FOUND') return sendError(res, 'Resource allocation not found', 404);
    next(err);
  }
};
