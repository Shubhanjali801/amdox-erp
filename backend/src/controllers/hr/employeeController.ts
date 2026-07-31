import { Response, NextFunction } from 'express';
import { sendPaginated, sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../middleware/auth.middleware';
import { employeeService } from '../../services/hr/employeeService';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await employeeService.list(req.user!.tenantId, req.query as any);
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employee = await employeeService.get(req.user!.tenantId, req.params.id);
    return sendSuccess(res, employee, 'Employee fetched');
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employee = await employeeService.create(req.user!.tenantId, req.body);
    return sendSuccess(res, employee, 'Employee created', 201);
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const employee = await employeeService.update(req.user!.tenantId, req.params.id, req.body);
    return sendSuccess(res, employee, 'Employee updated');
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await employeeService.remove(req.user!.tenantId, req.params.id);
    return sendSuccess(res, null, 'Employee deleted');
  } catch (error) {
    return next(error);
  }
};

export const getDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const departments = await employeeService.departments(req.user!.tenantId);
    return sendSuccess(res, departments, 'Departments fetched');
  } catch (error) {
    return next(error);
  }
};
