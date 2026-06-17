from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # ─── App ──────────────────────────────────────────
    APP_NAME: str = "Amdox ML Service"
    DEBUG: bool = False
    PORT: int = 8000
    API_KEY: str = "dev_ml_api_key_change_in_prod"

    # ─── CORS ─────────────────────────────────────────
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5000"]

    # ─── Database (PostgreSQL — read sales history) ───
    DATABASE_URL: str = "postgresql://admin:admin123@127.0.0.1:5432/amdox_erp"

    # ─── Model Settings ───────────────────────────────
    SAVED_MODELS_DIR: str = "saved_models"
    LSTM_EPOCHS: int = 50
    LSTM_BATCH_SIZE: int = 32
    LSTM_LOOKBACK: int = 12        # months of history to look back
    FORECAST_HORIZON: int = 6      # months ahead to forecast
    PROPHET_SEASONALITY_MODE: str = "multiplicative"

    class Config:
        env_file = ".env"

settings = Settings()
