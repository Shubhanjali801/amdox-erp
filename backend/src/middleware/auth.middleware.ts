import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface AuthRequest extends Request {
  user?: {
    userId:      string;
    id:          string;
    tenantId:    string;
    email:       string;
    roles:       string[];
    permissions: string[];
  };
}

// ─── Authenticate — verify JWT ────────────────────────────
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const token   = header.slice(7);
    const payload = jwt.verify(token, ENV.JWT_SECRET) as any;

    req.user = {
      userId:      payload.userId,
      id:          payload.userId,
      tenantId:    payload.tenantId,
      email:       payload.email,
      roles:       payload.roles       || [],
      permissions: payload.permissions || [],
    };

    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── Authorize — check roles ──────────────────────────────
export const authorize = (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const hasRole = roles.some(r => req.user!.roles.includes(r));
    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Insufficient role' });
    }
    next();
  };

// ─── Require Permission ───────────────────────────────────
export const requirePermission = (permission: string) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({ success: false, message: `Missing permission: ${permission}` });
    }
    next();
  };
