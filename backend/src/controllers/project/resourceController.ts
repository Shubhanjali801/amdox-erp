import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'resourceController.getAll — M4');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'resourceController.getById — M4');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'resourceController.create — M4');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'resourceController.update — M4');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'resourceController.remove — M4');
