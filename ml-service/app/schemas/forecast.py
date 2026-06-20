from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class ModelType(str, Enum):
    LSTM    = "lstm"
    PROPHET = "prophet"
    AUTO    = "auto"   # picks best based on data size


# ─── Request Schemas ──────────────────────────────────────

class SalesDataPoint(BaseModel):
    """Single historical sales data point"""
    date: str = Field(..., example="2025-01-01", description="YYYY-MM-DD or YYYY-MM")
    quantity: float = Field(..., ge=0, example=120.5)


class ForecastRequest(BaseModel):
    """Request body for forecast endpoint"""
    tenant_id: str              = Field(..., example="uuid-tenant-123")
    inventory_item_id: str      = Field(..., example="uuid-item-456")
    historical_data: List[SalesDataPoint] = Field(..., min_length=6)
    model_type: ModelType       = Field(default=ModelType.AUTO)
    forecast_horizon: int       = Field(default=6, ge=1, le=24, description="Months ahead")

    class Config:
        protected_namespaces = ()
        json_schema_extra = {
            "example": {
                "tenant_id": "tenant-001",
                "inventory_item_id": "item-001",
                "model_type": "auto",
                "forecast_horizon": 6,
                "historical_data": [
                    {"date": "2024-01", "quantity": 100},
                    {"date": "2024-02", "quantity": 120},
                    {"date": "2024-03", "quantity": 95},
                    {"date": "2024-04", "quantity": 140},
                    {"date": "2024-05", "quantity": 130},
                    {"date": "2024-06", "quantity": 155},
                    {"date": "2024-07", "quantity": 160},
                    {"date": "2024-08", "quantity": 175},
                    {"date": "2024-09", "quantity": 145},
                    {"date": "2024-10", "quantity": 190},
                    {"date": "2024-11", "quantity": 210},
                    {"date": "2024-12", "quantity": 230},
                ]
            }
        }


class TrainRequest(BaseModel):
    """Request to retrain model for a specific item"""
    model_config = {"protected_namespaces": ()}

    tenant_id: str
    inventory_item_id: str
    model_type: ModelType = ModelType.LSTM
    historical_data: List[SalesDataPoint] = Field(..., min_length=12)


# ─── Response Schemas ─────────────────────────────────────

class ForecastPoint(BaseModel):
    """Single forecast output point"""
    period: str               # "2025-07"
    predicted_qty: float
    confidence_low: float
    confidence_high: float


class ForecastResponse(BaseModel):
    """Full forecast response"""
    model_config = {"protected_namespaces": ()}

    tenant_id: str
    inventory_item_id: str
    model_used: str
    model_version: str
    forecast_horizon: int
    mape: Optional[float]     = None  # Mean Absolute % Error
    mae: Optional[float]      = None  # Mean Absolute Error
    forecasts: List[ForecastPoint]
    generated_at: datetime    = Field(default_factory=datetime.utcnow)


class TrainResponse(BaseModel):
    """Response after training"""
    model_config = {"protected_namespaces": ()}

    status: str
    model_type: str
    inventory_item_id: str
    mape: float
    mae: float
    training_samples: int
    model_saved_path: str
    trained_at: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    status: str
    models_loaded: List[str]
