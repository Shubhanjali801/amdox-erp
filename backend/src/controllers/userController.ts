import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';

export const getUsers   = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, [], 'Users list — M2');
export const getUser    = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Get user — M2');
export const updateUser = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Update user — M2');
export const deleteUser = async (_req: Request, res: Response, _next: NextFunction) => sendSuccess(res, {}, 'Delete user — M2');
