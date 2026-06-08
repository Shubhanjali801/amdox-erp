import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'ledgerController.getAll — M3');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'ledgerController.getById — M3');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'ledgerController.create — M3');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'ledgerController.update — M3');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'ledgerController.remove — M3');
