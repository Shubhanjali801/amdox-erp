/**
 * ML Microservice HTTP client.
 * Talks to the Python FastAPI service (LSTM + Prophet) over HTTP.
 * The backend never runs Python — it just calls these REST endpoints.
 */
import axios, { AxiosInstance } from 'axios';
import { ENV } from '../../config/env';
import { logger } from '../../utils/logger';

export interface SalesDataPoint {
  date: string;      // "YYYY-MM" or "YYYY-MM-DD"
  quantity: number;
}

export interface MlForecastRequest {
  tenant_id: string;
  inventory_item_id: string;
  historical_data: SalesDataPoint[];
  model_type?: 'auto' | 'lstm' | 'prophet';
  forecast_horizon?: number;
}

export interface MlForecastPoint {
  period: string;
  predicted_qty: number;
  confidence_low: number;
  confidence_high: number;
}

export interface MlForecastResponse {
  tenant_id: string;
  inventory_item_id: string;
  model_used: string;
  model_version: string;
  forecast_horizon: number;
  mape: number | null;
  mae: number | null;
  forecasts: MlForecastPoint[];
  generated_at: string;
}

const client: AxiosInstance = axios.create({
  baseURL: ENV.ML_SERVICE_URL,                 // e.g. http://localhost:8000
  timeout: 30000,                              // ML training can take a few seconds
  headers: {
    'Content-Type': 'application/json',
    ...(ENV.ML_SERVICE_API_KEY ? { 'x-api-key': ENV.ML_SERVICE_API_KEY } : {}),
  },
});

export const mlService = {
  /** Check the ML service is up. */
  async health(): Promise<boolean> {
    try {
      const res = await client.get('/health');
      return res.status === 200;
    } catch {
      return false;
    }
  },

  /** Request a demand forecast from the ML service. */
  async predict(payload: MlForecastRequest): Promise<MlForecastResponse> {
    try {
      const res = await client.post<MlForecastResponse>('/api/v1/forecast/predict', payload);
      return res.data;
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      logger.error(`ML predict failed: ${detail}`);
      throw new Error(`ML_SERVICE_ERROR: ${detail}`);
    }
  },

  /** Trigger model training/retraining for an item. */
  async train(payload: MlForecastRequest): Promise<any> {
    try {
      const res = await client.post('/api/v1/forecast/train', payload);
      return res.data;
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.message;
      logger.error(`ML train failed: ${detail}`);
      throw new Error(`ML_SERVICE_ERROR: ${detail}`);
    }
  },
};
