import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { ENV } from '../config/env';
import prisma from '../config/database';

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

declare global {
  namespace Express {
    interface User extends AuthUser {}
  }
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

const getDevUser = async (): Promise<AuthUser | null> => {
  if (!ENV.DEV_AUTH_BYPASS || !ENV.isDevelopment) return null;
  const user = await prisma.user.findFirst({
    where: { email: process.env.DEV_AUTH_EMAIL || 'hr@amdox.com', isActive: true },
    select: { id: true, tenantId: true, email: true },
  });
  if (!user) return null;
  return {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    roles: ['manager'],
    permissions: [],
  };
};

export const authenticate: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    const devUser = await getDevUser();
    if (devUser) {
      req.user = devUser;
      return next();
    }
    return next(new UnauthorizedError('No token provided'));
  }
  try {
    const payload = jwt.verify(header.slice(7), ENV.JWT_SECRET) as any;
    req.user = { id: payload.sub, tenantId: payload.tenantId, email: payload.email, roles: payload.roles || [], permissions: payload.permissions || [] };
    next();
  } catch {
    const devUser = await getDevUser();
    if (devUser) {
      req.user = devUser;
      return next();
    }
    next(new UnauthorizedError('Invalid or expired token'));
  }
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
