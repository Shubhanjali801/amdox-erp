/**
 * GraphQL context — mirrors the REST `authenticate` middleware: verify the JWT
 * from the Authorization header and expose the same user shape (tenantId,
 * roles, permissions) to resolvers. Unauthenticated requests get user: null.
 */
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export interface GqlUser {
  userId: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface GqlContext {
  user: GqlUser | null;
}

export function buildContext(authHeader?: string): GqlContext {
  if (!authHeader?.startsWith('Bearer ')) return { user: null };
  try {
    const payload = jwt.verify(authHeader.slice(7), ENV.JWT_SECRET) as any;
    return {
      user: {
        userId: payload.userId,
        tenantId: payload.tenantId,
        email: payload.email,
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      },
    };
  } catch {
    return { user: null };
  }
}
