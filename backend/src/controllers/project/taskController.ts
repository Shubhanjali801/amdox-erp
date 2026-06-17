import { Request, Response, NextFunction } from 'express';
import { taskService } from '../../services/project/taskService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId, status, assignedToUserId, page, limit } = req.query;
    const r = await taskService.list({
      tenantId: tenantOf(req),
      projectId: projectId as string | undefined,
      status: status as string | undefined,
      assignedToUserId: assignedToUserId as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await taskService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, t, 'Task fetched');
  } catch (err: any) {
    if (err.message === 'TASK_NOT_FOUND') return sendError(res, 'Task not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await taskService.create(tenantOf(req), req.body);
    return sendSuccess(res, t, 'Task created', 201);
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await taskService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, t, 'Task updated');
  } catch (err: any) {
    if (err.message === 'TASK_NOT_FOUND') return sendError(res, 'Task not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taskService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Task deleted');
  } catch (err: any) {
    if (err.message === 'TASK_NOT_FOUND') return sendError(res, 'Task not found', 404);
    next(err);
  }
};
