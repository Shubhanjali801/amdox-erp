import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/common/auditService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// GET /audit — list audit entries (filter by resource/action/userId)
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resource, action, userId, page, limit } = req.query;
    const r = await auditService.list({
      tenantId: tenantOf(req),
      resource: resource as string | undefined,
      action: action as string | undefined,
      userId: userId as string | undefined,
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, r.data, r.total, r.page, r.limit);
  } catch (err) { next(err); }
};

// GET /audit/verify — verify the hash chain is intact (tamper detection)
export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const r = await auditService.verifyChain(tenantOf(req));
    return sendSuccess(res, r, r.intact ? 'Audit chain intact' : 'Audit chain BROKEN — possible tampering');
  } catch (err) { next(err); }
};

// GET /audit/:id
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entry = await auditService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, entry, 'Audit entry fetched');
  } catch (err: any) {
    if (err.message === 'AUDIT_NOT_FOUND') return sendError(res, 'Audit entry not found', 404);
    next(err);
  }
};
