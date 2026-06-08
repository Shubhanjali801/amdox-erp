import { Request } from 'express';
export interface AuthRequest extends Request { user?: { id: string; tenantId: string; email: string; roles: string[]; permissions: string[]; }; }
