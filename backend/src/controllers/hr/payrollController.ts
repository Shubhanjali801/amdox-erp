import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { payrollEngineService } from '../../services/hr/payrollEngine';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await payrollEngineService.list(req.user!.tenantId), 'Payroll runs fetched');
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await payrollEngineService.get(req.user!.tenantId, req.params.id), 'Payroll run fetched');
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await payrollEngineService.runPayroll(req.user!.tenantId, req.body), 'Payroll run completed', 201);
  } catch (error) {
    return next(error);
  }
};

export const run = create;

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await payrollEngineService.cancel(req.user!.tenantId, req.params.id), 'Payroll run cancelled');
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await payrollEngineService.remove(req.user!.tenantId, req.params.id);
    return sendSuccess(res, null, 'Payroll run deleted');
  } catch (error) {
    return next(error);
  }
};
