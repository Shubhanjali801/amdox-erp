import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../../services/notification/webhookService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await webhookService.list(tenantOf(req));
    return sendSuccess(res, r, 'Webhooks fetched');
  } catch (err) { next(err); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wh = await webhookService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, wh, 'Webhook fetched');
  } catch (err: any) {
    if (err.message === 'WEBHOOK_NOT_FOUND') return sendError(res, 'Webhook not found', 404);
    next(err);
  }
};

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wh = await webhookService.create(tenantOf(req), req.body);
    return sendSuccess(res, wh, 'Webhook created', 201);
  } catch (err) { next(err); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wh = await webhookService.update(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, wh, 'Webhook updated');
  } catch (err: any) {
    if (err.message === 'WEBHOOK_NOT_FOUND') return sendError(res, 'Webhook not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await webhookService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Webhook deleted');
  } catch (err: any) {
    if (err.message === 'WEBHOOK_NOT_FOUND') return sendError(res, 'Webhook not found', 404);
    next(err);
  }
};

// POST /:id/test — send a sample delivery
export const test = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await webhookService.test(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, r.ok ? 'Test delivered' : `Delivery failed (status ${r.statusCode ?? 'none'})`);
  } catch (err: any) {
    if (err.message === 'WEBHOOK_NOT_FOUND') return sendError(res, 'Webhook not found', 404);
    next(err);
  }
};
