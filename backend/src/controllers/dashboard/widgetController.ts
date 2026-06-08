import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'widgetController.getAll — M6');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'widgetController.getById — M6');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'widgetController.create — M6');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'widgetController.update — M6');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'widgetController.remove — M6');
