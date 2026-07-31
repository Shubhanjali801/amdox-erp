import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { sendSuccess } from '../../utils/response';
import { attendanceService } from '../../services/hr/attendanceService';

export const getAll = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await attendanceService.list(req.user!.tenantId, req.query), 'Attendance fetched');
  } catch (error) {
    return next(error);
  }
};

export const getById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await attendanceService.get(req.user!.tenantId, req.params.id), 'Attendance fetched');
  } catch (error) {
    return next(error);
  }
};

export const create = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await attendanceService.create(req.user!.tenantId, req.body), 'Attendance created', 201);
  } catch (error) {
    return next(error);
  }
};

export const update = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    return sendSuccess(res, await attendanceService.update(req.user!.tenantId, req.params.id, req.body), 'Attendance updated');
  } catch (error) {
    return next(error);
  }
};

export const remove = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await attendanceService.remove(req.user!.tenantId, req.params.id);
    return sendSuccess(res, null, 'Attendance deleted');
  } catch (error) {
    return next(error);
  }
};
