import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'employeeController.getAll — M4');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'employeeController.getById — M4');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'employeeController.create — M4');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'employeeController.update — M4');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'employeeController.remove — M4');
