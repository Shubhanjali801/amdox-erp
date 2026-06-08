import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'projectController.getAll — M4');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'projectController.getById — M4');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'projectController.create — M4');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'projectController.update — M4');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'projectController.remove — M4');
