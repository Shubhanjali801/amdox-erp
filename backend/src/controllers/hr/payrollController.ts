import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'payrollController.getAll — M4');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'payrollController.getById — M4');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'payrollController.create — M4');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'payrollController.update — M4');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'payrollController.remove — M4');
