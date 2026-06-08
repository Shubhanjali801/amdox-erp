import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
export const getAll  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, [], 'permissionController.getAll — M2');
export const getById = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'permissionController.getById — M2');
export const create  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'permissionController.create — M2');
export const update  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'permissionController.update — M2');
export const remove  = async (_req: Request, res: Response, _n: NextFunction) => sendSuccess(res, {}, 'permissionController.remove — M2');
