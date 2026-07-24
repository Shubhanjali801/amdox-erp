import { Request, Response, NextFunction } from 'express';
import { budgetService } from '../../services/project/budgetService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// GET /projects/budget — summary for all projects
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await budgetService.list(tenantOf(req));
    return sendSuccess(res, r, 'Budget summary fetched');
  } catch (err) { next(err); }
};

// GET /projects/budget/:id — one project's budget detail
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await budgetService.getByProject(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Project budget fetched');
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

// create is not applicable — budget lives on the project
export const create = async (_req: Request, res: Response) =>
  sendError(res, 'Set budget when creating a project, or PUT /projects/budget/:id', 405);

// PUT /projects/budget/:id — update budget / adjust actual cost
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await budgetService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, 'Budget updated');
  } catch (err: any) {
    if (err.message === 'PROJECT_NOT_FOUND') return sendError(res, 'Project not found', 404);
    next(err);
  }
};

export const remove = async (_req: Request, res: Response) =>
  sendError(res, 'Budget cannot be deleted — it belongs to the project', 405);
