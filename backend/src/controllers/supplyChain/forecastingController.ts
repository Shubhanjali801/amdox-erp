import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'forecastingController.getAll — M5');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'forecastingController.getById — M5');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'forecastingController.create — M5');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'forecastingController.update — M5');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'forecastingController.remove — M5');
