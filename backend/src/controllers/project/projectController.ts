import { Request, Response, NextFunction } from 'express';
import { projectService } from '../../services/project/projectService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page, limit } = req.query;
    const r = await projectService.list({
      tenantId: tenantOf(req),
      status: status as string | undefined,
      search: search as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await projectService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, p, 'Project fetched');
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await projectService.create(tenantOf(req), req.body);
    return sendSuccess(res, p, 'Project created', 201);
  } catch (err: any) {
    if (err.message === 'PROJECT_CODE_EXISTS') return sendError(res, 'A project with this code already exists', 409);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await projectService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, p, 'Project updated');
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await projectService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Project deleted');
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

// ── Milestones ──
export const listMilestones = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await projectService.listMilestones(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Milestones fetched');
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

export const addMilestone = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const m = await projectService.addMilestone(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, m, 'Milestone added', 201);
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};
