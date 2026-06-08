import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';

// M2 implements full auth logic — stubs only
export const login    = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Login endpoint — M2');
export const register = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Register endpoint — M2');
export const refresh  = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Refresh endpoint — M2');
export const logout   = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Logout endpoint — M2');
export const me       = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Me endpoint — M2');
