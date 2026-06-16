import { Request, Response, NextFunction } from 'express';
import { currencyService } from '../../services/finance/currencyService';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

// ─── GET /finance/currency ────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, page, limit } = req.query;
    const result = await currencyService.list({
      fromCurrency: from as string | undefined,
      toCurrency:   to as string | undefined,
      page:  page  ? parseInt(page as string)  : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
    });
    return sendPaginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    next(err);
  }
};

// ─── GET /finance/currency/convert?from=USD&to=INR&amount=100 ──
export const convert = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, amount } = req.query;
    if (!from || !to || !amount) return sendError(res, 'from, to and amount are required', 400);

    const result = await currencyService.convert(
      from as string,
      to as string,
      parseFloat(amount as string),
    );
    return sendSuccess(res, result, 'Converted');
  } catch (err: any) {
    if (err.message === 'NO_RATE_FOUND') return sendError(res, 'No exchange rate found for this currency pair', 404);
    next(err);
  }
};

// ─── GET /finance/currency/:id ────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rate = await currencyService.getById(req.params.id as string);
    return sendSuccess(res, rate, 'Rate fetched');
  } catch (err: any) {
    if (err.message === 'RATE_NOT_FOUND') return sendError(res, 'Rate not found', 404);
    next(err);
  }
};

// ─── POST /finance/currency (upsert) ──────────────────────
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromCurrency, toCurrency, rate, date, source } = req.body;
    const result = await currencyService.upsert({ fromCurrency, toCurrency, rate, date, source });
    return sendSuccess(res, result, 'Rate saved', 201);
  } catch (err: any) {
    if (err.message === 'SAME_CURRENCY') return sendError(res, 'from and to currencies must differ', 400);
    next(err);
  }
};

// ─── PUT /finance/currency/:id (upsert via body) ──────────
export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fromCurrency, toCurrency, rate, date, source } = req.body;
    const result = await currencyService.upsert({ fromCurrency, toCurrency, rate, date, source });
    return sendSuccess(res, result, 'Rate updated');
  } catch (err: any) {
    if (err.message === 'SAME_CURRENCY') return sendError(res, 'from and to currencies must differ', 400);
    next(err);
  }
};

// ─── DELETE /finance/currency/:id ─────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await currencyService.remove(req.params.id as string);
    return sendSuccess(res, {}, 'Rate deleted');
  } catch (err: any) {
    if (err.message === 'RATE_NOT_FOUND') return sendError(res, 'Rate not found', 404);
    next(err);
  }
};
