"""
Generate realistic synthetic sales data for LSTM/Prophet training.
Run this first before train_lstm.py

Usage:
    python training/generate_sample_data.py
"""

import numpy as np
import pandas as pd
import json
import os

np.random.seed(42)

def generate_sales_series(
    n_months: int = 36,
    base: float = 100,
    trend: float = 2.0,
    noise_std: float = 15,
    seasonality_amp: float = 30,
) -> pd.DataFrame:
    """
    Generate monthly sales with:
    - Upward trend
    - Annual seasonality (peaks in Nov/Dec)
    - Random noise
    """
    dates = pd.date_range(start="2022-01-01", periods=n_months, freq="MS")

    # Trend component
    trend_component = np.arange(n_months) * trend

    # Seasonal component (peak around month 11-12)
    month_idx = np.array([d.month for d in dates])
    seasonality = seasonality_amp * np.sin(2 * np.pi * (month_idx - 3) / 12)

    # Noise
    noise = np.random.normal(0, noise_std, n_months)

    qty = base + trend_component + seasonality + noise
    qty = np.maximum(qty, 5)  # No negative quantities

    return pd.DataFrame({"date": dates.strftime("%Y-%m"), "quantity": qty.round(1)})


def main():
    os.makedirs("training/sample_data", exist_ok=True)

    # Generate 5 different SKUs
    items = [
        {"id": "item-001", "base": 100, "trend": 2.0, "noise": 15},
        {"id": "item-002", "base": 250, "trend": 5.0, "noise": 30},
        {"id": "item-003", "base": 50,  "trend": 0.5, "noise": 8},
        {"id": "item-004", "base": 500, "trend": 10,  "noise": 50},
        {"id": "item-005", "base": 80,  "trend": -1,  "noise": 12},  # declining trend
    ]

    all_data = {}

    for item in items:
        df = generate_sales_series(
            n_months       = 36,
            base           = item["base"],
            trend          = item["trend"],
            noise_std      = item["noise"],
        )

        # Save as CSV
        csv_path = f"training/sample_data/{item['id']}.csv"
        df.to_csv(csv_path, index=False)

        # Also save as JSON (for API testing)
        json_path = f"training/sample_data/{item['id']}.json"
        payload = {
            "tenant_id": "tenant-demo-001",
            "inventory_item_id": item["id"],
            "model_type": "auto",
            "forecast_horizon": 6,
            "historical_data": df.to_dict(orient="records"),
        }
        with open(json_path, "w") as f:
            json.dump(payload, f, indent=2)

        all_data[item["id"]] = df
        print(f"✅ Generated {len(df)} months for {item['id']} | "
              f"avg qty: {df['quantity'].mean():.1f}")

    print(f"\n📁 Saved to training/sample_data/")
    print(f"   → {len(items)} CSV files")
    print(f"   → {len(items)} JSON files (ready for API testing)")
    return all_data


if __name__ == "__main__":
    main()
