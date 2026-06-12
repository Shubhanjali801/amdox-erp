"""
Standalone LSTM Training Script
Trains LSTM models for all items in training/sample_data/

Usage:
    cd ml-service
    python training/train_lstm.py

Output:
    saved_models/lstm_tenant-demo-001_item-001.pt
    saved_models/scaler_lstm_tenant-demo-001_item-001.pkl
    training/results/training_report.json
"""

import sys
import os
import json
import time
import numpy as np
import pandas as pd

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.models.lstm_model import LSTMForecaster
from app.utils.data_prep import (
    parse_sales_data,
    create_lstm_sequences,
    scale_data,
    calculate_mape,
    calculate_mae,
    generate_future_dates,
    add_confidence_interval,
)
import joblib

TENANT_ID      = "tenant-demo-001"
LOOKBACK       = 12
EPOCHS         = 50
BATCH_SIZE     = 16
FORECAST_MONTHS = 6
DATA_DIR       = "training/sample_data"
MODELS_DIR     = "saved_models"
RESULTS_DIR    = "training/results"

os.makedirs(MODELS_DIR,  exist_ok=True)
os.makedirs(RESULTS_DIR, exist_ok=True)


def train_item(item_id: str, df: pd.DataFrame) -> dict:
    print(f"\n{'='*50}")
    print(f"  Training LSTM for: {item_id}")
    print(f"  Data points: {len(df)} months")
    print(f"{'='*50}")

    series         = df["quantity"].values.astype(float)
    scaled, scaler = scale_data(series)
    lookback       = min(LOOKBACK, len(scaled) - 2)

    X, y   = create_lstm_sequences(scaled, lookback)
    split  = int(len(X) * 0.8)
    X_tr, X_val = X[:split], X[split:]
    y_tr, y_val = y[:split], y[split:]

    print(f"  Train samples: {len(X_tr)} | Val samples: {len(X_val)}")

    # Build + train
    start = time.time()
    model = LSTMForecaster(
        lookback   = lookback,
        epochs     = EPOCHS,
        batch_size = BATCH_SIZE,
    )
    model.build()
    history = model.train(X_tr, y_tr, X_val, y_val, verbose=1)
    elapsed = round(time.time() - start, 1)

    # Evaluate
    y_pred_scaled = model.predict(X)
    y_pred = scaler.inverse_transform(y_pred_scaled.reshape(-1, 1)).flatten()
    y_true = series[lookback:]
    mape   = calculate_mape(y_true, y_pred)
    mae    = calculate_mae(y_true, y_pred)

    print(f"\n  ✅ Training complete in {elapsed}s")
    print(f"  📊 MAPE: {mape:.2f}%  |  MAE: {mae:.2f}")

    # Save model + scaler
    model_path  = os.path.join(MODELS_DIR, f"lstm_{TENANT_ID}_{item_id}.pt")
    scaler_path = os.path.join(MODELS_DIR, f"scaler_lstm_{TENANT_ID}_{item_id}.pkl")
    model.save(model_path)
    joblib.dump(scaler, scaler_path)

    # Forecast future 6 months
    last_seq    = scaled[-lookback:]
    predictions = model.forecast_future(last_seq, FORECAST_MONTHS, scaler)
    low, high   = add_confidence_interval(predictions)
    future_dates= generate_future_dates(df["date"].iloc[-1], FORECAST_MONTHS)

    print(f"\n  📈 {FORECAST_MONTHS}-Month Forecast:")
    for i, (d, p, l, h) in enumerate(zip(future_dates, predictions, low, high)):
        print(f"     {d}: {p:.1f}  [{l:.1f} – {h:.1f}]")

    return {
        "item_id":         item_id,
        "training_samples":len(df),
        "lookback":        lookback,
        "epochs_run":      len(history.history["loss"]),
        "mape":            round(mape, 2),
        "mae":             round(mae, 2),
        "training_time_s": elapsed,
        "model_path":      model_path,
        "forecast": [
            {
                "period":         future_dates[i],
                "predicted_qty":  round(float(predictions[i]), 2),
                "confidence_low": round(float(max(0, low[i])), 2),
                "confidence_high":round(float(high[i]), 2),
            }
            for i in range(FORECAST_MONTHS)
        ],
    }


def main():
    print("\n🚀 Amdox ERP — LSTM Training Script")
    print("=" * 50)

    # Load all items
    if not os.path.exists(DATA_DIR):
        print(f"❌ Data directory not found: {DATA_DIR}")
        print("   Run: python training/generate_sample_data.py first")
        sys.exit(1)

    csv_files = [f for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    if not csv_files:
        print("❌ No CSV files found. Run generate_sample_data.py first.")
        sys.exit(1)

    print(f"Found {len(csv_files)} items to train\n")

    results = []
    for csv_file in sorted(csv_files):
        item_id = csv_file.replace(".csv", "")
        df      = pd.read_csv(os.path.join(DATA_DIR, csv_file))
        df["date"] = pd.to_datetime(df["date"])
        result  = train_item(item_id, df)
        results.append(result)

    # Save training report
    report = {
        "tenant_id":   TENANT_ID,
        "total_items": len(results),
        "avg_mape":    round(sum(r["mape"] for r in results) / len(results), 2),
        "avg_mae":     round(sum(r["mae"]  for r in results) / len(results), 2),
        "items":       results,
    }
    report_path = os.path.join(RESULTS_DIR, "training_report.json")
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    print(f"\n{'='*50}")
    print(f"🎉 ALL MODELS TRAINED SUCCESSFULLY")
    print(f"   Items trained : {len(results)}")
    print(f"   Avg MAPE      : {report['avg_mape']}%")
    print(f"   Avg MAE       : {report['avg_mae']}")
    print(f"   Report saved  : {report_path}")
    print(f"{'='*50}\n")


if __name__ == "__main__":
    main()
