import { Request, Response, NextFunction } from 'express';
import { organisationService } from '../../services/hr/organisationService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /hr/organisation ─────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await organisationService.list(tenantOf(req));
    return sendSuccess(res, data, 'Departments fetched');
  } catch (err) {
    next(err);
  }
};

// ─── GET /hr/organisation/:id ─────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await organisationService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, dept, 'Department fetched');
  } catch (err: any) {
    if (err.message === 'DEPT_NOT_FOUND') return sendError(res, 'Department not found', 404);
    next(err);
  }
};

// ─── POST /hr/organisation ────────────────────────────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await organisationService.create({ tenantId: tenantOf(req), ...req.body });
    return sendSuccess(res, dept, 'Department created', 201);
  } catch (err: any) {
    if (err.message === 'NAME_TAKEN')       return sendError(res, 'Department name already exists', 409);
    if (err.message === 'PARENT_NOT_FOUND') return sendError(res, 'Parent department not found', 400);
    next(err);
  }
};

// ─── PUT /hr/organisation/:id ─────────────────────────────
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dept = await organisationService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, dept, 'Department updated');
  } catch (err: any) {
    if (err.message === 'DEPT_NOT_FOUND')   return sendError(res, 'Department not found', 404);
    if (err.message === 'PARENT_NOT_FOUND') return sendError(res, 'Parent department not found', 400);
    if (err.message === 'SELF_PARENT')      return sendError(res, 'A department cannot be its own parent', 400);
    next(err);
  }
};

// ─── DELETE /hr/organisation/:id ──────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await organisationService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Department deleted');
  } catch (err: any) {
    if (err.message === 'DEPT_NOT_FOUND') return sendError(res, 'Department not found', 404);
    if (err.message === 'HAS_EMPLOYEES')  return sendError(res, 'Cannot delete — department has employees', 409);
    if (err.message === 'HAS_CHILDREN')   return sendError(res, 'Cannot delete — department has sub-departments', 409);
    next(err);
  }
};
