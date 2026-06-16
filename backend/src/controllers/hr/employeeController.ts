import { Request, Response, NextFunction } from 'express';
import { employeeService } from '../../services/hr/employeeService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /hr/employees ────────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, departmentId, status } = req.query;
    const result = await employeeService.list({
      tenantId:     tenantOf(req),
      page:         page  ? parseInt(page as string)  : undefined,
      limit:        limit ? parseInt(limit as string) : undefined,
      search:       search as string | undefined,
      departmentId: departmentId as string | undefined,
      status:       status as string | undefined,
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

// ─── GET /hr/employees/:id ────────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const e = await employeeService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, e, 'Employee fetched');
  } catch (err: any) {
    if (err.message === 'EMPLOYEE_NOT_FOUND') return sendError(res, 'Employee not found', 404);
    next(err);
  }
};

// ─── POST /hr/employees ───────────────────────────────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const e = await employeeService.create({ tenantId: tenantOf(req), ...req.body });
    return sendSuccess(res, e, 'Employee onboarded', 201);
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN')          return sendError(res, 'Email already in use', 409);
    if (err.message === 'CODE_TAKEN')           return sendError(res, 'Employee code already exists', 409);
    if (err.message === 'DEPARTMENT_NOT_FOUND') return sendError(res, 'Department not found', 400);
    next(err);
  }
};

// ─── PUT /hr/employees/:id ────────────────────────────────
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const e = await employeeService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, e, 'Employee updated');
  } catch (err: any) {
    if (err.message === 'EMPLOYEE_NOT_FOUND')   return sendError(res, 'Employee not found', 404);
    if (err.message === 'DEPARTMENT_NOT_FOUND') return sendError(res, 'Department not found', 400);
    next(err);
  }
};

// ─── DELETE /hr/employees/:id ─────────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await employeeService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Employee offboarded');
  } catch (err: any) {
    if (err.message === 'EMPLOYEE_NOT_FOUND') return sendError(res, 'Employee not found', 404);
    next(err);
  }
};
