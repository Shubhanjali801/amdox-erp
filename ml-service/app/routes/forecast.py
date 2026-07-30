"""
Forecast API Routes
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from datetime import datetime

from app.schemas.forecast import (
    ForecastRequest, ForecastResponse,
    TrainRequest, TrainResponse,
    ForecastPoint, ReorderRecommendation,
)
from app.services.forecast_service import forecast_service
from app.services import forecast_engine
from app.config import settings

router = APIRouter()


def verify_api_key(x_api_key: Optional[str] = Header(None)):
    """Simple API key auth for ML service"""
    if settings.DEBUG:
        return  # Skip auth in debug mode
    if x_api_key != settings.API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")


# ─── POST /forecast ───────────────────────────────────────
@router.post(
    "/predict",
    response_model=ForecastResponse,
    summary="Generate demand forecast",
    description="Accepts historical sales data and returns multi-step forecast using LSTM or Prophet",
)
async def predict(
    body: ForecastRequest,
    _: None = Depends(verify_api_key),
):
    try:
        historical = [
            {"date": str(p.date), "quantity": p.quantity}
            for p in body.historical_data
        ]

        # Honest engine: auto-selects the best model per item, returns backtested
        # accuracy + confidence bands + a reorder recommendation.
        result = forecast_engine.forecast(
            historical        = historical,
            horizon           = body.forecast_horizon,
            model_type        = body.model_type.value,
            lead_time_periods = body.lead_time_periods,
            current_stock     = body.current_stock,
        )

        forecasts = [ForecastPoint(**f) for f in result["forecasts"]]

        return ForecastResponse(
            tenant_id          = body.tenant_id,
            inventory_item_id  = body.inventory_item_id,
            model_used         = result["model_used"],
            model_version      = result["model_version"],
            forecast_horizon   = body.forecast_horizon,
            backtest_smape     = result.get("backtest_smape"),
            skill_vs_naive_pct = result.get("skill_vs_naive_pct"),
            candidates_tried   = result.get("candidates_tried"),
            history_points     = result.get("history_points"),
            mape               = result.get("backtest_smape"),   # backward-compat
            forecasts          = forecasts,
            reorder            = ReorderRecommendation(**result["reorder"]),
            generated_at       = datetime.utcnow(),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Forecast failed: {str(e)}")


# ─── POST /train ──────────────────────────────────────────
@router.post(
    "/train",
    response_model=TrainResponse,
    summary="Train model for an inventory item",
    description="Trains and saves an LSTM or Prophet model for a specific SKU",
)
async def train(
    body: TrainRequest,
    _: None = Depends(verify_api_key),
):
    try:
        historical = [
            {"date": str(p.date), "quantity": p.quantity}
            for p in body.historical_data
        ]

        result = forecast_service.train(
            tenant_id         = body.tenant_id,
            inventory_item_id = body.inventory_item_id,
            historical_data   = historical,
            model_type        = body.model_type.value,
        )

        return TrainResponse(
            status            = result["status"],
            model_type        = result["model_type"],
            inventory_item_id = body.inventory_item_id,
            mape              = result["mape"],
            mae               = result["mae"],
            training_samples  = result["training_samples"],
            model_saved_path  = result["model_saved_path"],
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


# ─── GET /models ──────────────────────────────────────────
@router.get(
    "/models",
    summary="List saved models",
    description="Returns list of all trained models in saved_models directory",
)
async def list_models(_: None = Depends(verify_api_key)):
    import os
    models_dir = settings.SAVED_MODELS_DIR
    if not os.path.exists(models_dir):
        return {"models": []}
    files = os.listdir(models_dir)
    return {
        "models": files,
        "count": len(files),
    }
