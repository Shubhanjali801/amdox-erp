import { Request, Response, NextFunction } from 'express';
import { attendanceService } from '../../services/hr/attendanceService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, from, to, page, limit } = req.query;
    const result = await attendanceService.list({
      tenantId:   tenantOf(req),
      employeeId: employeeId as string | undefined,
      from:       from as string | undefined,
      to:         to as string | undefined,
      page:  page  ? parseInt(page as string)  : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rec = await attendanceService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, rec, 'Attendance fetched');
  } catch (err: any) {
    if (err.message === 'ATTENDANCE_NOT_FOUND') return sendError(res, 'Attendance not found', 404);
    next(err);
  }
};

// POST /hr/attendance — mark/upsert attendance for a day
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rec = await attendanceService.mark({ tenantId: tenantOf(req), ...req.body });
    return sendSuccess(res, rec, 'Attendance marked', 201);
  } catch (err: any) {
    if (err.message === 'EMPLOYEE_NOT_FOUND') return sendError(res, 'Employee not found', 404);
    next(err);
  }
};

// PUT /hr/attendance/:id — upsert via mark
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rec = await attendanceService.mark({ tenantId: tenantOf(req), ...req.body });
    return sendSuccess(res, rec, 'Attendance updated');
  } catch (err: any) {
    if (err.message === 'EMPLOYEE_NOT_FOUND') return sendError(res, 'Employee not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await attendanceService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Attendance deleted');
  } catch (err: any) {
    if (err.message === 'ATTENDANCE_NOT_FOUND') return sendError(res, 'Attendance not found', 404);
    next(err);
  }
};
