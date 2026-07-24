import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../../services/dashboard/dashboardService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userOf   = (req: Request) => (req as any).user?.userId || (req as any).user?.id;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await dashboardService.list(tenantOf(req));
    return sendSuccess(res, r, 'Dashboards fetched');
  } catch (err) { next(err); }
};

// GET /dashboards/stats/overview — cross-module KPI summary
export const statsOverview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await dashboardService.statsOverview(tenantOf(req));
    return sendSuccess(res, r, 'KPI overview');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await dashboardService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, d, 'Dashboard fetched');
  } catch (err: any) {
    if (err.message === 'DASHBOARD_NOT_FOUND') return sendError(res, 'Dashboard not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await dashboardService.create(tenantOf(req), userOf(req), req.body);
    return sendSuccess(res, d, 'Dashboard created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const d = await dashboardService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, d, 'Dashboard updated');
  } catch (err: any) {
    if (err.message === 'DASHBOARD_NOT_FOUND') return sendError(res, 'Dashboard not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await dashboardService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Dashboard deleted');
  } catch (err: any) {
    if (err.message === 'DASHBOARD_NOT_FOUND') return sendError(res, 'Dashboard not found', 404);
    next(err);
  }
};
