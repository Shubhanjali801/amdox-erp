import { Request, Response, NextFunction } from 'express';
import { tenantService } from '../services/tenantService';
import { sendSuccess, sendError } from '../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /tenants — current tenant ────────────────────────
export const getTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenant = await tenantService.getById(tenantOf(req));
    return sendSuccess(res, tenant, 'Tenant fetched');
  } catch (err: any) {
    if (err.message === 'TENANT_NOT_FOUND') return sendError(res, 'Tenant not found', 404);
    next(err);
  }
};

// ─── PUT /tenants — update current tenant ─────────────────
export const updateTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, domain, logoUrl, settings } = req.body;

    const tenant = await tenantService.update(tenantOf(req), {
      name, domain, logoUrl, settings,
    });

    return sendSuccess(res, tenant, 'Tenant updated');
  } catch (err: any) {
    if (err.message === 'TENANT_NOT_FOUND') return sendError(res, 'Tenant not found', 404);
    next(err);
  }
};
