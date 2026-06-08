import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'dashboardController.getAll — M6');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'dashboardController.getById — M6');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'dashboardController.create — M6');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'dashboardController.update — M6');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'dashboardController.remove — M6');
