import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { ENV } from '../config/env';

export interface AuthRequest extends Request {
  user?: { id: string; tenantId: string; email: string; roles: string[]; permissions: string[] };
}

export const authenticate = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('No token provided'));
  try {
    const payload = jwt.verify(header.slice(7), ENV.JWT_SECRET) as any;
    req.user = { id: payload.sub, tenantId: payload.tenantId, email: payload.email, roles: payload.roles || [], permissions: payload.permissions || [] };
    next();
  } catch { next(new UnauthorizedError('Invalid or expired token')); }
};

export const authorize = (...roles: string[]) => (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new UnauthorizedError());
  const hasRole = roles.some(r => req.user!.roles.includes(r));
  if (!hasRole) return next(new ForbiddenError('Insufficient permissions'));
  next();
};

export const requirePermission = (permission: string) => (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user) return next(new UnauthorizedError());
  if (!req.user.permissions.includes(permission)) return next(new ForbiddenError(`Missing permission: ${permission}`));
  next();
};
