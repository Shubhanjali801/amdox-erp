import { Request, Response, NextFunction } from 'express';
import { forecastingService } from '../../services/supplyChain/forecastingService';
import { mlService } from '../../services/external/mlService';
import prisma from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

const tenantOf = (req: Request) => (req as any).user?.tenantId as string;

// ─── GET /supply/forecasts ────────────────────────────────
export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inventoryItemId } = req.query;
    const data = await forecastingService.list(tenantOf(req), inventoryItemId as string | undefined);
    return sendSuccess(res, data, 'Forecasts fetched');
  } catch (err) {
    next(err);
  }
};

// ─── GET /supply/forecasts/:id ────────────────────────────
export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const f = await forecastingService.getById(tenantOf(req), req.params.id as string);
    return sendSuccess(res, f, 'Forecast fetched');
  } catch (err: any) {
    if (err.message === 'FORECAST_NOT_FOUND') return sendError(res, 'Forecast not found', 404);
    next(err);
  }
};

// ─── POST /supply/forecasts ───────────────────────────────
// Generates a NEW forecast by calling the ML service.
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { inventoryItemId, modelType, horizon } = req.body;
    if (!inventoryItemId) return sendError(res, 'inventoryItemId is required', 400);

    const result = await forecastingService.generate({
      tenantId: tenantOf(req),
      inventoryItemId,
      modelType,
      horizon,
    });
    return sendSuccess(res, result, 'Forecast generated', 201);
  } catch (err: any) {
    if (err.message === 'ITEM_NOT_FOUND')           return sendError(res, 'Inventory item not found', 404);
    if (err.message === 'INSUFFICIENT_HISTORY')     return sendError(res, 'Need at least 6 months of sales history', 400);
    if (err.message?.startsWith('ML_SERVICE_ERROR')) return sendError(res, `ML service error: ${err.message}`, 502);
    next(err);
  }
};

// ─── PUT — forecasts are immutable ────────────────────────
export const update = async (_req: Request, res: Response) =>
  sendError(res, 'Forecasts are immutable — generate a new one instead', 405);

// ─── DELETE /supply/forecasts/:id ─────────────────────────
export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const f = await forecastingService.getById(tenantOf(req), req.params.id as string);
    await prisma.forecast.delete({ where: { id: f.id } });
    return sendSuccess(res, {}, 'Forecast deleted');
  } catch (err: any) {
    if (err.message === 'FORECAST_NOT_FOUND') return sendError(res, 'Forecast not found', 404);
    next(err);
  }
};

// ─── GET /supply/forecasts/health/ml ──────────────────────
export const mlHealth = async (_req: Request, res: Response) => {
  const up = await mlService.health();
  return sendSuccess(res, { mlServiceUp: up }, up ? 'ML service reachable' : 'ML service DOWN');
};
