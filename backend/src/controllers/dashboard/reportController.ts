import { Request, Response, NextFunction } from 'express';
import { reportService } from '../../services/dashboard/reportService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await reportService.list(tenantOf(req));
    return sendSuccess(res, r, 'Scheduled reports fetched');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await reportService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Report fetched');
  } catch (err: any) {
    if (err.message === 'REPORT_NOT_FOUND') return sendError(res, 'Report not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await reportService.create(tenantOf(req), req.body);
    return sendSuccess(res, r, 'Scheduled report created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await reportService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, 'Report updated');
  } catch (err: any) {
    if (err.message === 'REPORT_NOT_FOUND') return sendError(res, 'Report not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await reportService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Report deleted');
  } catch (err: any) {
    if (err.message === 'REPORT_NOT_FOUND') return sendError(res, 'Report not found', 404);
    next(err);
  }
};

// POST /reports/:id/run — run a scheduled report now
export const run = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await reportService.run(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Report generated');
  } catch (err: any) {
    if (err.message === 'REPORT_NOT_FOUND')    return sendError(res, 'Report not found', 404);
    if (err.message === 'UNKNOWN_REPORT_TYPE') return sendError(res, 'Unknown report type', 400);
    next(err);
  }
};

// GET /reports/generate/:type — on-demand live report
export const generate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await reportService.generate(tenantOf(req), req.params.type as string);
    return sendSuccess(res, { type: req.params.type, data }, 'Report generated');
  } catch (err: any) {
    if (err.message === 'UNKNOWN_REPORT_TYPE') return sendError(res, 'Unknown report type. Try: financial-summary, inventory-status, hr-headcount, project-portfolio', 400);
    next(err);
  }
};
