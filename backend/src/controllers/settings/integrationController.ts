import { Request, Response, NextFunction } from 'express';
import { integrationService } from '../../services/settings/integrationService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
// :id here is the integration key (e.g. "slack", "stripe", "quickbooks")

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await integrationService.list(tenantOf(req));
    return sendSuccess(res, r, 'Integrations fetched');
  } catch (err: any) {
    if (err.message === 'TENANT_NOT_FOUND') return sendError(res, 'Tenant not found', 404);
    next(err);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await integrationService.get(tenantOf(req), req.params.id as string);
    return sendSuccess(res, r, 'Integration fetched');
  } catch (err: any) {
    if (err.message === 'INTEGRATION_NOT_FOUND') return sendError(res, 'Integration not found', 404);
    next(err);
  }
};

export const create = async (_req: Request, res: Response) =>
  sendError(res, 'Use PUT /integrations/:key to add or update an integration', 405);

// PUT /integrations/:id  (id = integration key) → upsert
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await integrationService.upsert(tenantOf(req), req.params.id as string, req.body);
    return sendSuccess(res, r, 'Integration saved');
  } catch (err: any) {
    if (err.message === 'TENANT_NOT_FOUND') return sendError(res, 'Tenant not found', 404);
    next(err);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await integrationService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Integration removed');
  } catch (err: any) {
    if (err.message === 'INTEGRATION_NOT_FOUND') return sendError(res, 'Integration not found', 404);
    next(err);
  }
};
