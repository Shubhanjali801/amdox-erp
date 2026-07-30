"""
Honest, useful demand-forecast engine.

Design (validated on real UCI retail data — see /benchmark):
  1. Pick the model that ACTUALLY forecasts best for THIS product, by running a
     quick rolling-origin backtest of a few robust candidates and choosing the
     lowest sMAPE — but only if it beats the naive baseline; otherwise use naive.
     (On real short-history demand, Simple Exp. Smoothing usually wins; LSTM/
     Prophet rarely help — so we don't pretend they do.)
  2. Report the model's HONEST backtested accuracy (sMAPE) and how much it beats
     naive — not an in-sample number.
  3. Return confidence bands sized from the model's own backtest error.
  4. Translate the forecast into a REORDER RECOMMENDATION, which is the thing a
     user actually acts on.
"""
from __future__ import annotations
import warnings
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")


# ── metrics ──────────────────────────────────────────────────────────────────
def _smape(y, yhat) -> float:
    y, yhat = np.asarray(y, float), np.asarray(yhat, float)
    denom = np.abs(y) + np.abs(yhat)
    m = denom > 1e-9
    return float(np.mean(2 * np.abs(yhat - y)[m] / denom[m]) * 100) if m.any() else float("nan")


def _mae(y, yhat) -> float:
    return float(np.mean(np.abs(np.asarray(y, float) - np.asarray(yhat, float))))


# ── candidate models: (train Series, h) -> np.array[h] ───────────────────────
def _naive(train: pd.Series, h: int):
    return np.repeat(train.tail(3).mean(), h)


def _moving_average(train: pd.Series, h: int):
    return np.repeat(train.tail(6).mean(), h)


def _ses(train: pd.Series, h: int):
    from statsmodels.tsa.holtwinters import SimpleExpSmoothing
    try:
        fit = SimpleExpSmoothing(train.values, initialization_method="estimated").fit()
        return np.clip(fit.forecast(h), 0, None)
    except Exception:
        return _naive(train, h)


def _prophet(train: pd.Series, h: int):
    from prophet import Prophet
    try:
        dfp = pd.DataFrame({"ds": train.index, "y": train.values})
        # Short-series safe config: no seasonality (not enough data), stiff trend.
        m = Prophet(weekly_seasonality=False, yearly_seasonality=False,
                    daily_seasonality=False, changepoint_prior_scale=0.02)
        m.fit(dfp)
        fut = m.make_future_dataframe(periods=h, freq=pd.infer_freq(train.index) or "MS")
        return np.clip(m.predict(fut).tail(h)["yhat"].values, 0, None)
    except Exception:
        return _naive(train, h)


CANDIDATES = {
    "naive": _naive,
    "moving_average": _moving_average,
    "ses": _ses,
    "prophet": _prophet,
}


# ── rolling-origin backtest to score a model on THIS series ──────────────────
def _backtest_smape(fn, series: pd.Series, h: int, min_train: int) -> tuple[float, np.ndarray]:
    errs, resid = [], []
    n = len(series)
    for t in range(min_train, n - h + 1):
        train, actual = series.iloc[:t], series.iloc[t:t + h].values
        if np.all(actual == 0):
            continue
        pred = fn(train, h)
        errs.append(_smape(actual, pred))
        resid.extend((actual - pred).tolist())
    smape = float(np.nanmean(errs)) if errs else float("nan")
    return smape, np.asarray(resid, float)


def _parse(historical: list[dict]) -> pd.Series:
    df = pd.DataFrame(historical)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    s = pd.Series(df["quantity"].astype(float).values, index=df["date"])
    # Infer frequency; default to monthly if ambiguous
    return s


# ── main entry point ─────────────────────────────────────────────────────────
def forecast(
    historical: list[dict],
    horizon: int = 6,
    model_type: str = "auto",
    lead_time_periods: int = 1,
    current_stock: float | None = None,
) -> dict:
    s = _parse(historical)
    n = len(s)
    if n < 4:
        raise ValueError("Need at least 4 periods of history")

    freq = pd.infer_freq(s.index) or "MS"
    min_train = max(3, min(n - 1, 6 if n < 24 else 12))

    # 1) score candidates (only fast/robust ones for 'auto')
    to_score = ["naive", "moving_average", "ses"] if model_type == "auto" else ["naive", model_type]
    to_score = [m for m in to_score if m in CANDIDATES]
    scores = {m: _backtest_smape(CANDIDATES[m], s, h=1, min_train=min_train) for m in to_score}

    naive_smape = scores["naive"][0]
    # choose the best non-naive that actually beats naive; else naive
    ranked = sorted((m for m in scores if m != "naive"),
                    key=lambda m: (np.inf if np.isnan(scores[m][0]) else scores[m][0]))
    chosen = "naive"
    for m in ranked:
        if not np.isnan(scores[m][0]) and scores[m][0] <= naive_smape:
            chosen = m
            break

    chosen_smape, resid = scores[chosen]
    skill_vs_naive = round((1 - chosen_smape / naive_smape) * 100, 1) if naive_smape else 0.0

    # 2) fit chosen model on full history, forecast `horizon`
    preds = np.clip(CANDIDATES[chosen](s, horizon), 0, None)

    # 3) confidence bands from backtest residual spread (grows with horizon)
    sigma = float(np.nanstd(resid)) if resid.size else float(preds.std() or preds.mean() * 0.2)
    future_idx = pd.date_range(s.index[-1], periods=horizon + 1, freq=freq)[1:]
    forecasts = []
    for i, (dt, p) in enumerate(zip(future_idx, preds), start=1):
        width = 1.28 * sigma * np.sqrt(i)          # ~80% interval
        forecasts.append({
            "period": dt.strftime("%Y-%m"),
            "predicted_qty": round(float(p), 1),
            "confidence_low": round(max(0.0, p - width), 1),
            "confidence_high": round(float(p + width), 1),
        })

    # 4) reorder recommendation
    lead = max(1, min(lead_time_periods, horizon))
    demand_lead = float(np.sum(preds[:lead]))
    safety_stock = round(1.65 * sigma * np.sqrt(lead), 1)   # ~95% service level
    reorder_point = round(demand_lead + safety_stock, 1)
    reorder = {
        "lead_time_periods": lead,
        "expected_demand_over_lead": round(demand_lead, 1),
        "safety_stock": safety_stock,
        "reorder_point": reorder_point,
        "suggested_order_qty": round(float(np.sum(preds[:min(3, horizon)])), 1),
    }
    if current_stock is not None:
        reorder["current_stock"] = current_stock
        reorder["should_reorder"] = bool(current_stock < reorder_point)

    return {
        "model_used": chosen,
        "model_version": "engine-2.0",
        "candidates_tried": {m: (None if np.isnan(v[0]) else round(v[0], 1)) for m, v in scores.items()},
        "backtest_smape": round(chosen_smape, 1) if not np.isnan(chosen_smape) else None,
        "skill_vs_naive_pct": skill_vs_naive,
        "history_points": n,
        "forecasts": forecasts,
        "reorder": reorder,
    }
