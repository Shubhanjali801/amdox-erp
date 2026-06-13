"""
Amdox ERP — ML Microservice
FastAPI + LSTM + Prophet Demand Forecasting
AMX-ERP-2026-06 | Owner: M5
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.routes import forecast
from app.config import settings

# ─── Logging ──────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("amdox-ml")

# ─── App ──────────────────────────────────────────────────
app = FastAPI(
    title="Amdox ERP — ML Microservice",
    description="AI-powered demand forecasting using LSTM and Prophet models",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ─────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Request Timer Middleware ──────────────────────────────
@app.middleware("http")
async def add_process_time(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)
    response.headers["X-Process-Time"] = f"{duration}ms"
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response

# ─── Routes ───────────────────────────────────────────────
app.include_router(forecast.router, prefix="/api/v1/forecast", tags=["Forecasting"])

# ─── Health ───────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "service": "Amdox ERP ML Microservice",
        "version": "1.0.0",
        "status": "running",
        "models": ["LSTM", "Prophet"],
    }

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy", "service": "ml-microservice"}
