import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { authenticateKeycloak } from '../services/auth/keycloakService';

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
    const token = header.slice(7);

    // When SSO is on, a Keycloak access token (RS256) is verified against the
    // realm JWKS and mapped to the local app user; local HS256 tokens still work
    // exactly as before. The token's `alg` header tells the two apart, so there
    // is zero behaviour change when KEYCLOAK_ENABLED is false.
    const alg = jwt.decode(token, { complete: true })?.header?.alg;
    if (ENV.KEYCLOAK_ENABLED && alg === 'RS256') {
      const identity = await authenticateKeycloak(token);
      req.user = { ...identity, id: identity.userId };
      return next();
    }

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
