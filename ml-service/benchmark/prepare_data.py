"""
Prepare a REAL retail dataset for demand-forecasting benchmarks.

Source: UCI "Online Retail" — ~500k real transactions from a UK online store
(Dec 2010 – Dec 2011). We turn raw transaction lines into a clean per-product
weekly demand series, which is exactly what a demand forecaster consumes.

Why weekly: daily retail demand is very spiky/intermittent; weekly aggregation
gives a stable signal with ~53 points per product over the year.
"""
from __future__ import annotations
import pandas as pd
import numpy as np
from pathlib import Path

DATA_FILE = Path(__file__).parent / "data" / "online_retail.xlsx"


def load_raw() -> pd.DataFrame:
    if not DATA_FILE.exists():
        raise FileNotFoundError(
            f"{DATA_FILE} not found. Run: python benchmark/download_data.py"
        )
    df = pd.read_excel(DATA_FILE)
    return df


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Standard retail cleaning: drop cancellations, returns, and bad rows."""
    df = df.rename(columns={
        "InvoiceDate": "date", "StockCode": "sku", "Quantity": "qty",
        "Description": "name", "UnitPrice": "price",
    })
    df = df[["date", "sku", "name", "qty", "price"]].copy()
    df["date"] = pd.to_datetime(df["date"])
    df = df[df["qty"] > 0]                 # drop returns/cancellations (negative qty)
    df = df[df["price"] > 0]               # drop free/adjustment lines
    df = df[df["sku"].notna()]
    df["sku"] = df["sku"].astype(str)
    # Drop obvious non-product codes (postage, fees, etc.)
    df = df[~df["sku"].str.upper().isin(
        {"POST", " ", "M", "BANK CHARGES", "AMAZONFEE", "S", "CRUK"}
    )]
    return df


def weekly_demand(df: pd.DataFrame, top_n: int = 50, min_weeks: int = 40) -> dict[str, pd.Series]:
    """
    Return {sku: weekly-demand Series} for the top_n best-selling products
    that have at least `min_weeks` of history (so backtesting is meaningful).
    """
    # Weekly bucket (week starting Monday)
    df["week"] = df["date"].dt.to_period("W").dt.start_time
    grp = df.groupby(["sku", "week"])["qty"].sum().reset_index()

    top_skus = (
        df.groupby("sku")["qty"].sum().sort_values(ascending=False).head(top_n * 3).index
    )

    series: dict[str, pd.Series] = {}
    full_weeks = pd.date_range(df["week"].min(), df["week"].max(), freq="W-MON")
    for sku in top_skus:
        s = grp[grp["sku"] == sku].set_index("week")["qty"]
        s = s.reindex(full_weeks, fill_value=0)          # fill gap weeks with 0 demand
        # keep products that actually sell most weeks (avoid pure-intermittent noise)
        if (s > 0).sum() >= min_weeks:
            series[str(sku)] = s.astype(float)
        if len(series) >= top_n:
            break
    return series


def monthly_demand(df: pd.DataFrame, top_n: int = 50, min_months: int = 10) -> dict[str, pd.Series]:
    """Same idea as weekly_demand but bucketed by month — smoother, and the
    granularity real reorder decisions use."""
    df["month"] = df["date"].dt.to_period("M").dt.start_time
    grp = df.groupby(["sku", "month"])["qty"].sum().reset_index()
    top_skus = (
        df.groupby("sku")["qty"].sum().sort_values(ascending=False).head(top_n * 3).index
    )
    full_months = pd.date_range(df["month"].min(), df["month"].max(), freq="MS")
    series: dict[str, pd.Series] = {}
    for sku in top_skus:
        s = grp[grp["sku"] == sku].set_index("month")["qty"].reindex(full_months, fill_value=0)
        if (s > 0).sum() >= min_months:
            series[str(sku)] = s.astype(float)
        if len(series) >= top_n:
            break
    return series


def build(freq: str = "weekly") -> dict[str, pd.Series]:
    df = clean(load_raw())
    return monthly_demand(df) if freq == "monthly" else weekly_demand(df)


if __name__ == "__main__":
    s = build()
    print(f"Prepared {len(s)} product demand series")
    for sku, ser in list(s.items())[:5]:
        print(f"  {sku:>8}  weeks={len(ser)}  total={ser.sum():.0f}  "
              f"mean/wk={ser.mean():.1f}  nonzero={ (ser>0).sum() }")
