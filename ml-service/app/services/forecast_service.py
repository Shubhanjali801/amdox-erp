"""
Forecast Service — orchestrates LSTM and Prophet models
Decides which model to use based on data size and returns unified response
"""

import numpy as np
import pandas as pd
import os
import joblib
import logging
from typing import List, Dict, Tuple

from app.models.lstm_model import LSTMForecaster
from app.models.prophet_model import ProphetForecaster
from app.utils.data_prep import (
    parse_sales_data,
    create_lstm_sequences,
    scale_data,
    calculate_mape,
    calculate_mae,
    generate_future_dates,
    add_confidence_interval,
)
from app.config import settings

logger = logging.getLogger(__name__)

# ─── Thresholds ──────────────────────────────────────────
MIN_PROPHET_SAMPLES = 6    # Prophet needs at least 6 months
MIN_LSTM_SAMPLES    = 18   # LSTM needs at least 18 months for reliable training


class ForecastService:

    def __init__(self):
        self.saved_models_dir = settings.SAVED_MODELS_DIR
        os.makedirs(self.saved_models_dir, exist_ok=True)

    # ─────────────────────────────────────────────────────
    # PUBLIC: FORECAST
    # ─────────────────────────────────────────────────────

    def forecast(
        self,
        tenant_id: str,
        inventory_item_id: str,
        historical_data: List[Dict],
        model_type: str = "auto",
        horizon: int = 6,
    ) -> Dict:
        """
        Main forecast entry point.
        Automatically selects best model based on data size if model_type='auto'.
        """
        df = parse_sales_data(historical_data)
        n  = len(df)

        # ── Auto select model ──
        if model_type == "auto":
            chosen = "lstm" if n >= MIN_LSTM_SAMPLES else "prophet"
            logger.info(f"Auto-selected {chosen} model (n={n} samples)")
        else:
            chosen = model_type

        if chosen == "lstm":
            return self._forecast_lstm(df, tenant_id, inventory_item_id, horizon)
        else:
            return self._forecast_prophet(df, tenant_id, inventory_item_id, horizon)

    # ─────────────────────────────────────────────────────
    # PUBLIC: TRAIN
    # ─────────────────────────────────────────────────────

    def train(
        self,
        tenant_id: str,
        inventory_item_id: str,
        historical_data: List[Dict],
        model_type: str = "lstm",
    ) -> Dict:
        """Train and save a model for a specific inventory item"""
        df = parse_sales_data(historical_data)

        if model_type == "lstm":
            return self._train_lstm(df, tenant_id, inventory_item_id)
        else:
            return self._train_prophet(df, tenant_id, inventory_item_id)

    # ─────────────────────────────────────────────────────
    # PRIVATE: LSTM
    # ─────────────────────────────────────────────────────

    def _forecast_lstm(
        self,
        df: pd.DataFrame,
        tenant_id: str,
        item_id: str,
        horizon: int,
    ) -> Dict:
        lookback = min(settings.LSTM_LOOKBACK, len(df) - 1)
        series   = df["quantity"].values.astype(float)

        # Scale
        scaled, scaler = scale_data(series)

        # Try to load saved model, else train fresh
        model_path  = self._model_path("lstm", tenant_id, item_id)
        scaler_path = self._scaler_path("lstm", tenant_id, item_id)
        model       = LSTMForecaster(lookback=lookback, epochs=settings.LSTM_EPOCHS)

        if os.path.exists(model_path) and os.path.exists(scaler_path):
            logger.info(f"Loading saved LSTM model for {item_id}")
            model.load(model_path)
            scaler = joblib.load(scaler_path)
        else:
            logger.info(f"Training new LSTM model for {item_id} (n={len(df)})")
            X, y    = create_lstm_sequences(scaled, lookback)
            split   = int(len(X) * 0.8)
            X_tr, X_val = X[:split], X[split:]
            y_tr, y_val = y[:split], y[split:]
            model.build()
            model.train(X_tr, y_tr, X_val, y_val)
            model.save(model_path)
            joblib.dump(scaler, scaler_path)

        # Generate forecast
        last_seq     = scaled[-lookback:]
        predictions  = model.forecast_future(last_seq, horizon, scaler)
        future_dates = generate_future_dates(df["date"].iloc[-1], horizon)
        low, high    = add_confidence_interval(predictions, uncertainty_pct=0.15)

        # Compute accuracy on training data
        X_all, y_all = create_lstm_sequences(scaled, lookback)
        y_pred_scaled = model.predict(X_all)
        y_pred = scaler.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
        y_true = series[lookback:]
        mape   = calculate_mape(y_true, y_pred)
        mae    = calculate_mae(y_true, y_pred)

        return {
            "model_used":         "lstm",
            "model_version":      model.version,
            "mape":               round(mape, 2),
            "mae":                round(mae, 2),
            "forecasts": [
                {
                    "period":         future_dates[i],
                    "predicted_qty":  round(float(predictions[i]), 2),
                    "confidence_low": round(float(max(0, low[i])), 2),
                    "confidence_high":round(float(high[i]), 2),
                }
                for i in range(horizon)
            ],
        }

    def _train_lstm(
        self,
        df: pd.DataFrame,
        tenant_id: str,
        item_id: str,
    ) -> Dict:
        lookback = min(settings.LSTM_LOOKBACK, len(df) - 1)
        series   = df["quantity"].values.astype(float)
        scaled, scaler = scale_data(series)
        X, y     = create_lstm_sequences(scaled, lookback)

        split        = int(len(X) * 0.8)
        X_tr, X_val  = X[:split], X[split:]
        y_tr, y_val  = y[:split], y[split:]

        model = LSTMForecaster(lookback=lookback, epochs=settings.LSTM_EPOCHS)
        model.build()
        model.train(X_tr, y_tr, X_val, y_val)

        model_path  = self._model_path("lstm", tenant_id, item_id)
        scaler_path = self._scaler_path("lstm", tenant_id, item_id)
        model.save(model_path)
        joblib.dump(scaler, scaler_path)

        # Eval
        y_pred_scaled = model.predict(X)
        y_pred = scaler.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
        y_true = series[lookback:]
        mape   = calculate_mape(y_true, y_pred)
        mae    = calculate_mae(y_true, y_pred)

        return {
            "status":            "trained",
            "model_type":        "lstm",
            "mape":              round(mape, 2),
            "mae":               round(mae, 2),
            "training_samples":  len(df),
            "model_saved_path":  model_path,
        }

    # ─────────────────────────────────────────────────────
    # PRIVATE: PROPHET
    # ─────────────────────────────────────────────────────

    def _forecast_prophet(
        self,
        df: pd.DataFrame,
        tenant_id: str,
        item_id: str,
        horizon: int,
    ) -> Dict:
        model_path = self._model_path("prophet", tenant_id, item_id)
        model      = ProphetForecaster(
            seasonality_mode=settings.PROPHET_SEASONALITY_MODE
        )

        if os.path.exists(model_path):
            logger.info(f"Loading saved Prophet model for {item_id}")
            model.load(model_path)
        else:
            logger.info(f"Training new Prophet model for {item_id}")
            model.train(df)
            model.save(model_path)

        forecast_df  = model.predict(horizon)
        future_dates = generate_future_dates(df["date"].iloc[-1], horizon)

        # Holdout back-test for an HONEST out-of-sample MAPE.
        # (In-sample fit gives ~0% because Prophet fits its own training points.)
        mape = mae = 0.0
        h = min(3, max(1, len(df) // 4))
        if len(df) > h + 2:
            try:
                train_df = df.iloc[:-h]
                test_df  = df.iloc[-h:]
                bt = ProphetForecaster(seasonality_mode=settings.PROPHET_SEASONALITY_MODE)
                bt.train(train_df)
                bt_pred = bt.predict(h)
                y_true  = test_df["quantity"].values
                y_pred  = bt_pred["yhat"].values[:len(y_true)]
                mape    = calculate_mape(y_true, y_pred)
                mae     = calculate_mae(y_true, y_pred)
            except Exception as e:
                logger.warning(f"Prophet back-test failed, MAPE unavailable: {e}")
                mape = mae = 0.0

        forecasts = []
        for i in range(min(horizon, len(forecast_df))):
            yhat = float(max(0, forecast_df["yhat"].iloc[i]))
            low  = float(max(0, forecast_df["yhat_lower"].iloc[i]))
            high = float(forecast_df["yhat_upper"].iloc[i])
            # Fallback: if Prophet's interval collapsed, use a ±15% band
            if high - low < 1e-6:
                low, high = yhat * 0.85, yhat * 1.15
            forecasts.append({
                "period":          future_dates[i],
                "predicted_qty":   round(yhat, 2),
                "confidence_low":  round(max(0, low), 2),
                "confidence_high": round(high, 2),
            })

        return {
            "model_used":    "prophet",
            "model_version": model.version,
            "mape":          round(mape, 2),
            "mae":           round(mae, 2),
            "forecasts":     forecasts,
        }

    def _train_prophet(
        self,
        df: pd.DataFrame,
        tenant_id: str,
        item_id: str,
    ) -> Dict:
        model      = ProphetForecaster(seasonality_mode=settings.PROPHET_SEASONALITY_MODE)
        model.train(df)
        model_path = self._model_path("prophet", tenant_id, item_id)
        model.save(model_path)

        hist = model.in_sample()
        y_true = df["quantity"].values
        y_pred = hist["yhat"].values[:len(y_true)]
        mape   = calculate_mape(y_true, y_pred)
        mae    = calculate_mae(y_true, y_pred)

        return {
            "status":           "trained",
            "model_type":       "prophet",
            "mape":             round(mape, 2),
            "mae":              round(mae, 2),
            "training_samples": len(df),
            "model_saved_path": model_path,
        }

    # ─────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────

    def _model_path(self, model_type: str, tenant_id: str, item_id: str) -> str:
        ext = ".pt" if model_type == "lstm" else ".pkl"
        return os.path.join(self.saved_models_dir, f"{model_type}_{tenant_id}_{item_id}{ext}")

    def _scaler_path(self, model_type: str, tenant_id: str, item_id: str) -> str:
        return os.path.join(self.saved_models_dir, f"scaler_{model_type}_{tenant_id}_{item_id}.pkl")


# Singleton instance
forecast_service = ForecastService()
