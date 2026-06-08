import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UnauthorizedError } from '../utils/errors';

// Injects tenantId into every request from JWT payload
export const tenantContext = (req: AuthRequest, _res: Response, next: NextFunction) => {
  if (!req.user?.tenantId) return next(new UnauthorizedError('Tenant context missing'));
  // Optionally attach to res.locals for downstream use
  (_res as any).locals = { ...((_res as any).locals || {}), tenantId: req.user.tenantId };
  next();
};
