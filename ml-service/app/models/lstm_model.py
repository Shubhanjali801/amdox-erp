"""
LSTM Demand Forecasting Model — PyTorch implementation
(per AMX-ERP-2026 spec: "LSTM model (PyTorch)")

Architecture: 2-layer LSTM -> Dropout -> Dense head
Keeps the same public interface (build/train/predict/forecast_future/save/load)
so forecast_service.py needs no changes.
"""

import os
import numpy as np
import logging
from typing import Optional

import torch
import torch.nn as nn

logger = logging.getLogger(__name__)

# Use GPU if available, else CPU
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ─── The network ──────────────────────────────────────────
class _LSTMNet(nn.Module):
    """
    Input  : (batch, lookback, 1)
    Layer 1: LSTM(64) returning full sequence
    Layer 2: LSTM(32) returning last hidden state
    Head   : Dropout -> Linear(32->16) -> ReLU -> Linear(16->1)
    """

    def __init__(self, hidden1: int = 64, hidden2: int = 32, dropout: float = 0.2):
        super().__init__()
        self.lstm1 = nn.LSTM(input_size=1, hidden_size=hidden1, batch_first=True)
        self.drop1 = nn.Dropout(dropout)
        self.lstm2 = nn.LSTM(input_size=hidden1, hidden_size=hidden2, batch_first=True)
        self.drop2 = nn.Dropout(dropout)
        self.fc1 = nn.Linear(hidden2, 16)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(16, 1)

    def forward(self, x):
        out, _ = self.lstm1(x)        # (batch, lookback, hidden1)
        out = self.drop1(out)
        out, (h_n, _) = self.lstm2(out)  # h_n: (1, batch, hidden2)
        last = self.drop2(h_n[-1])    # (batch, hidden2)
        x = self.relu(self.fc1(last))
        return self.fc2(x)            # (batch, 1)


class LSTMForecaster:
    """PyTorch LSTM wrapper for time-series demand forecasting."""

    def __init__(
        self,
        lookback: int = 12,
        epochs: int = 50,
        batch_size: int = 16,
        learning_rate: float = 1e-3,
    ):
        self.lookback = lookback
        self.epochs = epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.model: Optional[_LSTMNet] = None
        self.version = "2.0.0-pytorch"

    # ── Build ─────────────────────────────────────────────
    def build(self) -> None:
        self.model = _LSTMNet().to(DEVICE)
        n_params = sum(p.numel() for p in self.model.parameters())
        logger.info(f"PyTorch LSTM built — params: {n_params:,} on {DEVICE}")

    # ── Train (with early stopping) ───────────────────────
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        verbose: int = 0,
    ):
        if self.model is None:
            self.build()

        Xt = torch.tensor(X_train, dtype=torch.float32).to(DEVICE)
        yt = torch.tensor(y_train, dtype=torch.float32).view(-1, 1).to(DEVICE)
        has_val = X_val is not None and len(X_val) > 0
        if has_val:
            Xv = torch.tensor(X_val, dtype=torch.float32).to(DEVICE)
            yv = torch.tensor(y_val, dtype=torch.float32).view(-1, 1).to(DEVICE)

        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(self.model.parameters(), lr=self.learning_rate)
        scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer, factor=0.5, patience=5, min_lr=1e-6
        )

        best_loss = float("inf")
        best_state = None
        patience, wait = 10, 0
        history = {"loss": [], "val_loss": []}

        n = len(Xt)
        for epoch in range(self.epochs):
            self.model.train()
            perm = torch.randperm(n)
            epoch_loss = 0.0

            for i in range(0, n, self.batch_size):
                idx = perm[i:i + self.batch_size]
                xb, yb = Xt[idx], yt[idx]
                optimizer.zero_grad()
                pred = self.model(xb)
                loss = criterion(pred, yb)
                loss.backward()
                optimizer.step()
                epoch_loss += loss.item() * len(idx)

            epoch_loss /= n
            history["loss"].append(epoch_loss)

            # Validation + early stopping
            monitor = epoch_loss
            if has_val:
                self.model.eval()
                with torch.no_grad():
                    val_loss = criterion(self.model(Xv), yv).item()
                history["val_loss"].append(val_loss)
                monitor = val_loss

            scheduler.step(monitor)

            if monitor < best_loss:
                best_loss = monitor
                best_state = {k: v.clone() for k, v in self.model.state_dict().items()}
                wait = 0
            else:
                wait += 1
                if wait >= patience:
                    logger.info(f"Early stopping at epoch {epoch + 1}")
                    break

            if verbose and (epoch + 1) % 10 == 0:
                logger.info(f"Epoch {epoch + 1}/{self.epochs} — loss: {monitor:.5f}")

        if best_state is not None:
            self.model.load_state_dict(best_state)

        logger.info(f"PyTorch LSTM training complete — best loss: {best_loss:.5f}")
        return type("History", (), {"history": history})()  # mimic Keras .history

    # ── Predict ───────────────────────────────────────────
    def predict(self, X: np.ndarray) -> np.ndarray:
        if self.model is None:
            raise ValueError("Model not trained or loaded.")
        self.model.eval()
        with torch.no_grad():
            xb = torch.tensor(X, dtype=torch.float32).to(DEVICE)
            return self.model(xb).cpu().numpy().flatten()

    # ── Iterative multi-step forecast ─────────────────────
    def forecast_future(self, last_sequence: np.ndarray, horizon: int, scaler) -> np.ndarray:
        if self.model is None:
            raise ValueError("Model not trained or loaded.")
        self.model.eval()
        predictions = []
        current = last_sequence.copy()  # shape (lookback,)

        with torch.no_grad():
            for _ in range(horizon):
                x_in = torch.tensor(
                    current.reshape(1, self.lookback, 1), dtype=torch.float32
                ).to(DEVICE)
                pred_scaled = self.model(x_in).cpu().item()
                predictions.append(pred_scaled)
                current = np.append(current[1:], pred_scaled)  # slide window

        arr = np.array(predictions).reshape(-1, 1)
        return scaler.inverse_transform(arr).flatten()

    # ── Persistence ───────────────────────────────────────
    def save(self, path: str) -> None:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        torch.save(
            {"state_dict": self.model.state_dict(), "lookback": self.lookback},
            path,
        )
        logger.info(f"PyTorch LSTM saved -> {path}")

    def load(self, path: str) -> None:
        ckpt = torch.load(path, map_location=DEVICE)
        self.lookback = ckpt.get("lookback", self.lookback)
        self.build()
        self.model.load_state_dict(ckpt["state_dict"])
        self.model.eval()
        logger.info(f"PyTorch LSTM loaded <- {path}")
