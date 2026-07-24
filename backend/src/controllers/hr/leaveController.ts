import { Request, Response, NextFunction } from 'express';
import { leaveService } from '../../services/hr/leaveService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userOf   = (req: Request) => (req as any).user?.userId as string;

// ─── Leave Types ──────────────────────────────────────────
export const listTypes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const types = await leaveService.listTypes(tenantOf(req));
    return sendSuccess(res, types, 'Leave types fetched');
  } catch (err) { next(err); }
};

export const createType = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const type = await leaveService.createType(tenantOf(req), req.body);
    return sendSuccess(res, type, 'Leave type created', 201);
  } catch (err: any) {
    if (err.message === 'TYPE_NAME_TAKEN') return sendError(res, 'Leave type already exists', 409);
    next(err);
  }
};

// ─── Leave Requests ───────────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, status, page, limit } = req.query;
    const result = await leaveService.list({
      tenantId:   tenantOf(req),
      employeeId: employeeId as string | undefined,
      status:     status as string | undefined,
      page:  page  ? parseInt(page as string)  : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await leaveService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Leave request fetched');
  } catch (err: any) {
    if (err.message === 'REQUEST_NOT_FOUND') return sendError(res, 'Leave request not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await leaveService.create(tenantOf(req), req.body);
    return sendSuccess(res, r, 'Leave request submitted', 201);
  } catch (err: any) {
    if (err.message === 'EMPLOYEE_NOT_FOUND')   return sendError(res, 'Employee not found', 404);
    if (err.message === 'LEAVE_TYPE_NOT_FOUND') return sendError(res, 'Leave type not found', 400);
    if (err.message === 'INVALID_DATE_RANGE')   return sendError(res, 'End date must be after start date', 400);
    next(err);
  }
};

export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await leaveService.approve(tenantOf(req), req.params.id as string, userOf(req));
    return sendSuccess(res, r, 'Leave approved');
  } catch (err: any) {
    if (err.message === 'REQUEST_NOT_FOUND') return sendError(res, 'Leave request not found', 404);
    if (err.message === 'NOT_PENDING')       return sendError(res, 'Only pending requests can be approved', 400);
    next(err);
  }
};

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await leaveService.reject(tenantOf(req), req.params.id as string, userOf(req), req.body?.reason);
    return sendSuccess(res, r, 'Leave rejected');
  } catch (err: any) {
    if (err.message === 'REQUEST_NOT_FOUND') return sendError(res, 'Leave request not found', 404);
    if (err.message === 'NOT_PENDING')       return sendError(res, 'Only pending requests can be rejected', 400);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  // updates are done via approve/reject — generic update not used
  return sendError(res, 'Use /approve or /reject to change a leave request', 405);
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await leaveService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Leave request cancelled');
  } catch (err: any) {
    if (err.message === 'REQUEST_NOT_FOUND') return sendError(res, 'Leave request not found', 404);
    next(err);
  }
};
