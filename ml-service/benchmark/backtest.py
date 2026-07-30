"""
Honest forecasting benchmark on REAL retail data.

The point of this file: measure how well each model *actually* forecasts unseen
demand, using rolling-origin (walk-forward) cross-validation — the only fair way
to evaluate a time-series model. Every model is compared against a NAIVE baseline
("next week = a recent average"), because a forecast is only useful if it beats
the trivial guess.

Models compared:
  - naive          : seasonal-ish persistence (mean of last 4 weeks)  [the bar to beat]
  - moving_average : mean of last 8 weeks
  - ets            : Holt-Winters exponential smoothing (statsmodels)
  - prophet        : Facebook Prophet (trend + weekly seasonality)

Metrics per model (averaged over products & folds):
  - MAPE  (mean absolute % error)   — lower is better
  - MAE   (mean absolute error)
  - sMAPE (symmetric MAPE, robust to zeros)
  - skill = 1 - model_MAE / naive_MAE   (>0 means it beats naive)
"""
from __future__ import annotations
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


# ── Error metrics ────────────────────────────────────────────────────────────
def mape(y_true, y_pred):
    y_true, y_pred = np.asarray(y_true, float), np.asarray(y_pred, float)
    mask = y_true > 1e-6
    if mask.sum() == 0:
        return np.nan
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100


def smape(y_true, y_pred):
    y_true, y_pred = np.asarray(y_true, float), np.asarray(y_pred, float)
    denom = (np.abs(y_true) + np.abs(y_pred))
    mask = denom > 1e-6
    if mask.sum() == 0:
        return np.nan
    return np.mean(2 * np.abs(y_pred - y_true)[mask] / denom[mask]) * 100


def mae(y_true, y_pred):
    return float(np.mean(np.abs(np.asarray(y_true, float) - np.asarray(y_pred, float))))


# ── Models: each takes a training Series, returns h forecasts ────────────────
def m_naive(train: pd.Series, h: int):
    return np.repeat(train.tail(4).mean(), h)


def m_moving_average(train: pd.Series, h: int):
    return np.repeat(train.tail(8).mean(), h)


def m_ses(train: pd.Series, h: int):
    """Simple exponential smoothing — no trend. Strong on volatile demand."""
    from statsmodels.tsa.holtwinters import SimpleExpSmoothing
    try:
        fit = SimpleExpSmoothing(train.values, initialization_method="estimated").fit()
        return np.clip(fit.forecast(h), 0, None)
    except Exception:
        return m_naive(train, h)


def m_ets_damped(train: pd.Series, h: int):
    """Holt with a DAMPED trend — avoids the runaway extrapolation of a full trend."""
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    try:
        fit = ExponentialSmoothing(
            train.values, trend="add", damped_trend=True, seasonal=None,
            initialization_method="estimated",
        ).fit()
        return np.clip(fit.forecast(h), 0, None)
    except Exception:
        return m_naive(train, h)


def m_prophet(train: pd.Series, h: int):
    """
    Prophet tuned for SHORT series: no yearly/weekly seasonality (not enough
    data to learn it — that was the 1900% bug), low changepoint flexibility so
    the trend can't run away.
    """
    from prophet import Prophet
    try:
        dfp = pd.DataFrame({"ds": train.index, "y": train.values})
        mdl = Prophet(weekly_seasonality=False, yearly_seasonality=False,
                      daily_seasonality=False, changepoint_prior_scale=0.02)
        mdl.fit(dfp)
        future = mdl.make_future_dataframe(periods=h, freq="W-MON")
        fc = mdl.predict(future).tail(h)["yhat"].values
        return np.clip(fc, 0, None)
    except Exception:
        return m_naive(train, h)


MODELS = {
    "naive":          m_naive,
    "moving_average": m_moving_average,
    "ses":            m_ses,
    "ets_damped":     m_ets_damped,
    "prophet":        m_prophet,
}


# ── Rolling-origin backtest for one product ──────────────────────────────────
def backtest_series(series: pd.Series, h: int = 4, min_train: int = 20, step: int = 2):
    """
    Walk forward: train on [0:t], forecast next h weeks, score against actuals,
    slide the origin by `step`, repeat. Returns {model: {metric: [values]}}.
    """
    results = {name: {"mape": [], "smape": [], "mae": []} for name in MODELS}
    n = len(series)
    origins = range(min_train, n - h + 1, step)
    for t in origins:
        train = series.iloc[:t]
        actual = series.iloc[t:t + h].values
        if np.all(actual == 0):
            continue
        for name, fn in MODELS.items():
            pred = fn(train, h)
            results[name]["mape"].append(mape(actual, pred))
            results[name]["smape"].append(smape(actual, pred))
            results[name]["mae"].append(mae(actual, pred))
    return results


def aggregate(all_results: list[dict]):
    """Average each metric across all products & folds; add skill vs naive."""
    summary = {}
    for name in MODELS:
        mapes  = np.concatenate([np.array(r[name]["mape"])  for r in all_results]) if all_results else np.array([])
        smapes = np.concatenate([np.array(r[name]["smape"]) for r in all_results]) if all_results else np.array([])
        maes   = np.concatenate([np.array(r[name]["mae"])   for r in all_results]) if all_results else np.array([])
        summary[name] = {
            "MAPE":  float(np.nanmean(mapes)),
            "sMAPE": float(np.nanmean(smapes)),
            "MAE":   float(np.nanmean(maes)),
        }
    naive_mae = summary["naive"]["MAE"]
    for name in MODELS:
        summary[name]["skill_vs_naive_%"] = round((1 - summary[name]["MAE"] / naive_mae) * 100, 1)
    return summary
