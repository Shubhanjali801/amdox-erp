import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'notificationController.getAll — M5');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'notificationController.getById — M5');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'notificationController.create — M5');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'notificationController.update — M5');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'notificationController.remove — M5');
