/**
 * Forecasting Service (M5)
 * Orchestrates: read sales history from PostgreSQL → call Python ML service
 * → persist the prediction in the Forecast table.
 */
import prisma from '../../config/database';
import { logger } from '../../utils/logger';
import { mlService, SalesDataPoint } from '../external/mlService';

export interface GenerateForecastInput {
  tenantId:        string;
  inventoryItemId: string;
  modelType?:      'auto' | 'lstm' | 'prophet';
  horizon?:        number;
}

export const forecastingService = {

  // ── List stored forecasts (tenant-scoped) ────────────────
  async list(tenantId: string, inventoryItemId?: string) {
    return prisma.forecast.findMany({
      where: { tenantId, ...(inventoryItemId ? { inventoryItemId } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  },

  async getById(tenantId: string, id: string) {
    const f = await prisma.forecast.findFirst({ where: { id, tenantId } });
    if (!f) throw new Error('FORECAST_NOT_FOUND');
    return f;
  },

  // ── Build sales history from stock movements (type = OUT) ─
  async buildHistory(tenantId: string, inventoryItemId: string): Promise<SalesDataPoint[]> {
    // Confirm the item belongs to this tenant
    const item = await prisma.inventoryItem.findFirst({
      where: { id: inventoryItemId, tenantId },
    });
    if (!item) throw new Error('ITEM_NOT_FOUND');

    const movements = await prisma.stockMovement.findMany({
      where: { inventoryItemId, type: 'OUT' },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate quantity by month (YYYY-MM)
    const byMonth: Record<string, number> = {};
    for (const m of movements) {
      const key = m.createdAt.toISOString().slice(0, 7); // YYYY-MM
      byMonth[key] = (byMonth[key] || 0) + Number(m.quantity);
    }

    return Object.entries(byMonth)
      .map(([date, quantity]) => ({ date, quantity }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  // ── Generate a forecast: DB → ML → DB ────────────────────
  async generate(input: GenerateForecastInput) {
    const { tenantId, inventoryItemId, modelType = 'auto', horizon = 6 } = input;

    const history = await this.buildHistory(tenantId, inventoryItemId);
    if (history.length < 6) throw new Error('INSUFFICIENT_HISTORY');

    // Call the Python ML service
    const result = await mlService.predict({
      tenant_id:         tenantId,
      inventory_item_id: inventoryItemId,
      historical_data:   history,
      model_type:        modelType,
      forecast_horizon:  horizon,
    });

    // Persist each forecast point
    const saved = await prisma.$transaction(
      result.forecasts.map((f) =>
        prisma.forecast.create({
          data: {
            tenantId,
            inventoryItemId,
            modelType:      result.model_used,
            modelVersion:   result.model_version,
            forecastDate:   new Date(),
            forecastPeriod: f.period,
            predictedQty:   f.predicted_qty,
            confidenceLow:  f.confidence_low,
            confidenceHigh: f.confidence_high,
            mape:           result.mape ?? undefined,
          },
        })
      )
    );

    logger.info(
      `Forecast generated for item ${inventoryItemId} using ${result.model_used} (MAPE ${result.mape})`
    );

    return {
      model_used:     result.model_used,
      model_version:  result.model_version,
      mape:           result.mape,
      mae:            result.mae,
      history_points: history.length,
      forecasts:      saved,
    };
  },
};
