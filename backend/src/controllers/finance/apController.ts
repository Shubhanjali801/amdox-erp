import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'apController.getAll — M3');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'apController.getById — M3');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'apController.create — M3');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'apController.update — M3');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'apController.remove — M3');
