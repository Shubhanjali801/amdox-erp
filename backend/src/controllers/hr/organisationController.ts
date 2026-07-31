import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { organisationService } from '../../services/hr/organisationService';

export const getChart = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await organisationService.orgChart(req.user!.tenantId), 'Organisation chart fetched');
  } catch (error) {
    return next(error);
  }
};

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await organisationService.listDepartments(req.user!.tenantId), 'Departments fetched');
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await organisationService.getDepartment(req.user!.tenantId, req.params.id), 'Department fetched');
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await organisationService.createDepartment(req.user!.tenantId, req.body), 'Department created', 201);
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await organisationService.updateDepartment(req.user!.tenantId, req.params.id, req.body), 'Department updated');
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await organisationService.removeDepartment(req.user!.tenantId, req.params.id);
    return sendSuccess(res, null, 'Department deleted');
  } catch (error) {
    return next(error);
  }
};
