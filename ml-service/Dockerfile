FROM python:3.11-slim

WORKDIR /app

# Install system deps for Prophet + pytorch
RUN apt-get update && apt-get install -y \
    gcc g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# SLIM build (default): skip torch (LSTM) and Prophet — the /predict path uses
# the lightweight statistical engine (statsmodels SES / moving-average / naive),
# which is the real forecaster. This keeps the image small enough for a single
# small node. Build with --build-arg SLIM=false to include torch + Prophet
# (needed only for the /train endpoint's LSTM/Prophet models).
ARG SLIM=true

# CPU-only PyTorch — the default wheel pulls ~6GB of CUDA/GPU libs the CPU
# server can't use and that overflow the disk; only installed for a full build.
RUN if [ "$SLIM" != "true" ]; then \
      pip install --no-cache-dir torch==2.3.1 --index-url https://download.pytorch.org/whl/cpu; \
    fi

# Full build installs everything; slim build drops Prophet (heavy cmdstan build).
RUN if [ "$SLIM" = "true" ]; then \
      grep -vi "prophet" requirements.txt > requirements.slim.txt && \
      pip install --no-cache-dir -r requirements.slim.txt; \
    else \
      pip install --no-cache-dir -r requirements.txt; \
    fi

COPY . .

RUN mkdir -p saved_models

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
