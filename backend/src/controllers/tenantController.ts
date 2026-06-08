import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';

export const getTenant    = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Get tenant — M2');
export const updateTenant = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Update tenant — M2');
