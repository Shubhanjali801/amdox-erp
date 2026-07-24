import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../../services/settings/settingsService';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// GET /settings — current tenant settings
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const s = await settingsService.get(tenantOf(req));
    return sendSuccess(res, s, 'Settings fetched');
  } catch (err: any) {
    if (err.message === 'TENANT_NOT_FOUND') return sendError(res, 'Tenant not found', 404);
    next(err);
  }
};

export const getById = getAll;

export const create = async (_req: Request, res: Response) =>
  sendError(res, 'Use PUT /settings to update tenant settings', 405);

// PUT /settings — update profile + merge settings JSON
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const s = await settingsService.update(tenantOf(req), req.body);
    return sendSuccess(res, s, 'Settings updated');
  } catch (err: any) {
    if (err.message === 'TENANT_NOT_FOUND') return sendError(res, 'Tenant not found', 404);
    next(err);
  }
};

export const remove = async (_req: Request, res: Response) =>
  sendError(res, 'Settings cannot be deleted', 405);
