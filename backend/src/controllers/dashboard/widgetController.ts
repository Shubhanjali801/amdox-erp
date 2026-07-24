import { Request, Response, NextFunction } from 'express';
import { widgetService } from '../../services/dashboard/widgetService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await widgetService.list(tenantOf(req), req.query.dashboardId as string | undefined);
    return sendSuccess(res, r, 'Widgets fetched');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const w = await widgetService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, w, 'Widget fetched');
  } catch (err: any) {
    if (err.message === 'WIDGET_NOT_FOUND') return sendError(res, 'Widget not found', 404);
    next(err);
  }
};

// GET /widgets/:id/data — live data for the widget
export const getData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await widgetService.getData(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Widget data');
  } catch (err: any) {
    if (err.message === 'WIDGET_NOT_FOUND') return sendError(res, 'Widget not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const w = await widgetService.create(tenantOf(req), req.body);
    return sendSuccess(res, w, 'Widget created', 201);
  } catch (err: any) {
    if (err.message === 'DASHBOARD_NOT_FOUND') return sendError(res, 'Dashboard not found', 404);
    next(err);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const w = await widgetService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, w, 'Widget updated');
  } catch (err: any) {
    if (err.message === 'WIDGET_NOT_FOUND') return sendError(res, 'Widget not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await widgetService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Widget deleted');
  } catch (err: any) {
    if (err.message === 'WIDGET_NOT_FOUND') return sendError(res, 'Widget not found', 404);
    next(err);
  }
};
