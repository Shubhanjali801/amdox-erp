import { Request, Response, NextFunction } from 'express';
import { payrollEngine } from '../../services/hr/payrollEngine';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /hr/payroll — list runs ──────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const runs = await payrollEngine.list(tenantOf(req));
    return sendSuccess(res, runs, 'Payroll runs fetched');
  } catch (err) { next(err); }
};

// ─── GET /hr/payroll/:id — run with payslips ──────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const run = await payrollEngine.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, run, 'Payroll run fetched');
  } catch (err: any) {
    if (err.message === 'RUN_NOT_FOUND') return sendError(res, 'Payroll run not found', 404);
    next(err);
  }
};

// ─── POST /hr/payroll — run payroll for a period ──────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, currency } = req.body;
    if (!period) return sendError(res, 'period is required (e.g. "2026-06")', 400);
    const run = await payrollEngine.run(tenantOf(req), period, currency);
    return sendSuccess(res, run, `Payroll processed for ${period}`, 201);
  } catch (err: any) {
    if (err.message === 'PERIOD_ALREADY_RUN')  return sendError(res, 'Payroll already run for this period', 409);
    if (err.message === 'NO_ACTIVE_EMPLOYEES') return sendError(res, 'No active employees to pay', 400);
    next(err);
  }
};

// ─── GET /hr/payroll/payslip/:id — single payslip ─────────
export const getPayslip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slip = await payrollEngine.getPayslip(tenantOf(req), req.params.id as string);
    return sendSuccess(res, slip, 'Payslip fetched');
  } catch (err: any) {
    if (err.message === 'PAYSLIP_NOT_FOUND') return sendError(res, 'Payslip not found', 404);
    next(err);
  }
};

export const update = async (_req: Request, res: Response) =>
  sendError(res, 'Payroll runs are immutable — delete and re-run instead', 405);

// ─── DELETE /hr/payroll/:id ───────────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await payrollEngine.remove(tenantOf(req), req.params.id as string);
    return sendSuccess(res, {}, 'Payroll run deleted');
  } catch (err: any) {
    if (err.message === 'RUN_NOT_FOUND') return sendError(res, 'Payroll run not found', 404);
    next(err);
  }
};
