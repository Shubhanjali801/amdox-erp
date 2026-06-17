import { Request, Response, NextFunction } from 'express';
import { ledgerService } from '../../services/finance/ledgerService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /finance/ledger ──────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, type, isActive } = req.query;
    const result = await ledgerService.list({
      tenantId: tenantOf(req),
      page:     page  ? parseInt(page as string)  : undefined,
      limit:    limit ? parseInt(limit as string) : undefined,
      search:   search as string | undefined,
      type:     type as string | undefined,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

// ─── GET /finance/ledger/:id ──────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await ledgerService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, account, 'Account fetched');
  } catch (err: any) {
    if (err.message === 'ACCOUNT_NOT_FOUND') return sendError(res, 'Account not found', 404);
    next(err);
  }
};

// ─── POST /finance/ledger ─────────────────────────────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, name, type, subType, currency, parentId, description } = req.body;
    const account = await ledgerService.create({
      tenantId: tenantOf(req),
      code, name, type, subType, currency, parentId, description,
    });
    return sendSuccess(res, account, 'Account created', 201);
  } catch (err: any) {
    if (err.message === 'CODE_TAKEN')       return sendError(res, 'Account code already exists', 409);
    if (err.message === 'PARENT_NOT_FOUND') return sendError(res, 'Parent account not found', 400);
    next(err);
  }
};

// ─── PUT /finance/ledger/:id ──────────────────────────────
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, subType, currency, parentId, description, isActive } = req.body;
    const account = await ledgerService.update(tenantOf(req), req.params.id as string, {
      name, subType, currency, parentId, description, isActive,
    });
    return sendSuccess(res, account, 'Account updated');
  } catch (err: any) {
    if (err.message === 'ACCOUNT_NOT_FOUND') return sendError(res, 'Account not found', 404);
    if (err.message === 'PARENT_NOT_FOUND')  return sendError(res, 'Parent account not found', 400);
    if (err.message === 'SELF_PARENT')       return sendError(res, 'An account cannot be its own parent', 400);
    next(err);
  }
};

// ─── DELETE /finance/ledger/:id ───────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ledgerService.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Account deleted');
  } catch (err: any) {
    if (err.message === 'ACCOUNT_NOT_FOUND') return sendError(res, 'Account not found', 404);
    if (err.message === 'ACCOUNT_IN_USE')    return sendError(res, 'Cannot delete — account is used in journal entries', 409);
    if (err.message === 'HAS_CHILDREN')      return sendError(res, 'Cannot delete — account has sub-accounts', 409);
    next(err);
  }
};
