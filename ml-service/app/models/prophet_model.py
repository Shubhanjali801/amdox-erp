"""
Facebook Prophet Demand Forecasting Model
Best for: seasonal patterns, holiday effects, trend changes
"""

import pandas as pd
import numpy as np
import logging
import os
import joblib
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class ProphetForecaster:
    """
    Facebook Prophet wrapper for demand forecasting.

    Advantages over LSTM:
    - Works well with < 2 years of data
    - Handles seasonality automatically (weekly, monthly, yearly)
    - Provides native confidence intervals (uncertainty_samples)
    - Interpretable components (trend + seasonality)
    """

    def __init__(
        self,
        seasonality_mode: str   = "multiplicative",
        yearly_seasonality: bool = True,
        weekly_seasonality: bool = False,
        daily_seasonality: bool  = False,
        changepoint_prior_scale: float = 0.05,
        interval_width: float   = 0.80,
    ):
        self.seasonality_mode         = seasonality_mode
        self.yearly_seasonality       = yearly_seasonality
        self.weekly_seasonality       = weekly_seasonality
        self.daily_seasonality        = daily_seasonality
        self.changepoint_prior_scale  = changepoint_prior_scale
        self.interval_width           = interval_width
        self.model                    = None
        self.version                  = "1.0.0"

    def _build(self):
        """Lazily import and build Prophet model"""
        from prophet import Prophet
        self.model = Prophet(
            seasonality_mode        = self.seasonality_mode,
            yearly_seasonality      = self.yearly_seasonality,
            weekly_seasonality      = self.weekly_seasonality,
            daily_seasonality       = self.daily_seasonality,
            changepoint_prior_scale = self.changepoint_prior_scale,
            interval_width          = self.interval_width,
        )
        # Add monthly seasonality for ERP use case
        self.model.add_seasonality(
            name="monthly",
            period=30.5,
            fourier_order=5,
        )

    def train(self, df: pd.DataFrame) -> None:
        """
        Train Prophet model.

        Args:
            df: DataFrame with columns ['date', 'quantity']
        """
        self._build()

        # Prophet requires columns named 'ds' and 'y'
        prophet_df = df.rename(columns={"date": "ds", "quantity": "y"})
        prophet_df["ds"] = pd.to_datetime(prophet_df["ds"])

        # Remove zeros / negatives for multiplicative mode
        if self.seasonality_mode == "multiplicative":
            prophet_df = prophet_df[prophet_df["y"] > 0]

        self.model.fit(prophet_df)
        logger.info(f"Prophet model trained on {len(prophet_df)} data points")

    def predict(self, horizon: int) -> pd.DataFrame:
        """
        Generate future forecasts.

        Args:
            horizon: number of months to forecast

        Returns:
            DataFrame with columns: ds, yhat, yhat_lower, yhat_upper
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")

        future = self.model.make_future_dataframe(periods=horizon, freq="MS")
        forecast = self.model.predict(future)

        # Return only future rows
        return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(horizon).reset_index(drop=True)

    def in_sample(self) -> pd.DataFrame:
        """
        Fitted values on the TRAINING dates (for accuracy evaluation).
        Unlike predict(horizon), this returns the historical rows, not the tail.
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train() first.")
        future = self.model.make_future_dataframe(periods=0, freq="MS")
        forecast = self.model.predict(future)
        return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].reset_index(drop=True)

    def get_components(self) -> pd.DataFrame:
        """Return trend + seasonality components for explainability"""
        if self.model is None:
            raise ValueError("Model not trained.")
        future = self.model.make_future_dataframe(periods=0, freq="MS")
        return self.model.predict(future)[["ds", "trend", "yearly", "monthly"]]

    def save(self, path: str) -> None:
        """Serialize Prophet model with joblib"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        joblib.dump(self.model, path)
        logger.info(f"Prophet model saved → {path}")

    def load(self, path: str) -> None:
        """Load serialized Prophet model"""
        self.model = joblib.load(path)
        logger.info(f"Prophet model loaded ← {path}")
