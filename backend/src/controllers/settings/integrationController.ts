import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'integrationController.getAll — M2');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'integrationController.getById — M2');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'integrationController.create — M2');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'integrationController.update — M2');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'integrationController.remove — M2');
