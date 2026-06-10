import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;
const userIdOf = (req: Request) => (req as any).user?.userId as string;

// ─── GET /users ───────────────────────────────────────────
export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, search, isActive } = req.query;

    const result = await userService.list({
      tenantId: tenantOf(req),
      page:     page  ? parseInt(page as string)  : undefined,
      limit:    limit ? parseInt(limit as string) : undefined,
      search:   search as string | undefined,
      isActive: isActive === undefined ? undefined : isActive === 'true',
    });

    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

// ─── GET /users/:id ───────────────────────────────────────
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await userService.getById(tenantOf(req), req.params.id);
    return sendSuccess(res, user, 'User fetched');
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    next(err);
  }
};

// ─── POST /users ──────────────────────────────────────────
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, email, password, phone, roleNames } = req.body;

    const user = await userService.create({
      tenantId: tenantOf(req),
      firstName, lastName, email, password, phone, roleNames,
    });

    return sendSuccess(res, user, 'User created', 201);
  } catch (err: any) {
    if (err.message === 'EMAIL_TAKEN') return sendError(res, 'Email already in use', 409);
    next(err);
  }
};

// ─── PUT /users/:id ───────────────────────────────────────
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, phone, isActive, roleNames } = req.body;

    const user = await userService.update(tenantOf(req), req.params.id, {
      firstName, lastName, phone, isActive, roleNames,
    });

    return sendSuccess(res, user, 'User updated');
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') return sendError(res, 'User not found', 404);
    next(err);
  }
};

// ─── DELETE /users/:id ────────────────────────────────────
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await userService.remove(tenantOf(req), req.params.id, userIdOf(req));
    return sendSuccess(res, {}, 'User deleted');
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND')     return sendError(res, 'User not found', 404);
    if (err.message === 'CANNOT_DELETE_SELF') return sendError(res, 'You cannot delete your own account', 400);
    next(err);
  }
};
