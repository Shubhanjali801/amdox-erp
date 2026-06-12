"""
Data preprocessing utilities for LSTM and Prophet models
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from typing import List, Tuple, Dict
import logging

logger = logging.getLogger(__name__)


def parse_sales_data(data: List[Dict]) -> pd.DataFrame:
    """
    Convert raw sales data list to a clean DataFrame.
    Handles both 'YYYY-MM' and 'YYYY-MM-DD' date formats.
    """
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").reset_index(drop=True)
    df["quantity"] = df["quantity"].astype(float)

    # Resample to monthly if daily data provided
    if (df["date"].diff().dropna().dt.days < 28).any():
        df = df.set_index("date").resample("MS").sum().reset_index()
        logger.info("Resampled daily data to monthly")

    return df


def create_lstm_sequences(
    data: np.ndarray,
    lookback: int = 12
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Create (X, y) sequences for LSTM training.

    Args:
        data:     1D scaled array of quantity values
        lookback: number of past months to use as features

    Returns:
        X shape: (samples, lookback, 1)
        y shape: (samples,)
    """
    X, y = [], []
    for i in range(lookback, len(data)):
        X.append(data[i - lookback:i])
        y.append(data[i])
    return np.array(X).reshape(-1, lookback, 1), np.array(y)


def scale_data(series: np.ndarray) -> Tuple[np.ndarray, MinMaxScaler]:
    """Scale data to [0, 1] using MinMaxScaler"""
    scaler = MinMaxScaler(feature_range=(0, 1))
    scaled = scaler.fit_transform(series.reshape(-1, 1)).flatten()
    return scaled, scaler


def inverse_scale(scaled: np.ndarray, scaler: MinMaxScaler) -> np.ndarray:
    """Reverse MinMaxScaler transformation"""
    return scaler.inverse_transform(scaled.reshape(-1, 1)).flatten()


def calculate_mape(actual: np.ndarray, predicted: np.ndarray) -> float:
    """Mean Absolute Percentage Error — lower is better"""
    actual = np.array(actual, dtype=float)
    predicted = np.array(predicted, dtype=float)
    mask = actual != 0
    if mask.sum() == 0:
        return 0.0
    return float(np.mean(np.abs((actual[mask] - predicted[mask]) / actual[mask])) * 100)


def calculate_mae(actual: np.ndarray, predicted: np.ndarray) -> float:
    """Mean Absolute Error"""
    return float(np.mean(np.abs(np.array(actual) - np.array(predicted))))


def generate_future_dates(last_date: pd.Timestamp, horizon: int) -> List[str]:
    """Generate future month labels like ['2025-07', '2025-08', ...]"""
    dates = pd.date_range(start=last_date + pd.offsets.MonthBegin(1), periods=horizon, freq="MS")
    return [d.strftime("%Y-%m") for d in dates]


def add_confidence_interval(
    predictions: np.ndarray,
    uncertainty_pct: float = 0.15
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Simple confidence interval: ± uncertainty_pct of predicted value.
    LSTM doesn't natively give CI, so we estimate it.
    """
    low  = predictions * (1 - uncertainty_pct)
    high = predictions * (1 + uncertainty_pct)
    return low, high
