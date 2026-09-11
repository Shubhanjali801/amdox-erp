"""
AI forecast insight (Claude).

Turns the numeric forecast + reorder recommendation into a short, plain-English
recommendation an inventory/operations manager can act on. This is a thin,
optional layer on top of the statistical engine — the forecast is always
computed locally; Claude only *explains* it.

Fully optional: if ANTHROPIC_API_KEY is unset (or the call fails for any
reason) this returns None and the forecast response simply omits the insight.
It never raises into the forecast path.
"""
from typing import Optional, List, Dict, Any
import logging

from app.config import settings

logger = logging.getLogger("ml.insight")

# Lazily-built Anthropic client (created once, only if a key is configured).
_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    if not settings.ANTHROPIC_API_KEY:
        return None
    try:
        from anthropic import Anthropic
        _client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        return _client
    except Exception as e:  # SDK missing / bad key format / etc.
        logger.warning("Anthropic client unavailable: %s", e)
        return None


def ai_enabled() -> bool:
    return bool(settings.ANTHROPIC_API_KEY)


SYSTEM = (
    "You are an inventory planning assistant inside an ERP. Given a demand "
    "forecast and its measured accuracy for one product, write a short, plain-"
    "English recommendation for a non-technical operations manager. "
    "Rules: 2-3 sentences, no markdown, no bullet points, no XML tags. Lead with "
    "the action (reorder or hold, and roughly how much/when). Be honest about "
    "uncertainty — if the model barely beats a naive baseline or the error is "
    "high, say the forecast is only a rough guide. Never invent numbers beyond "
    "what you are given."
)


def generate_insight(
    *,
    model_used: str,
    backtest_smape: Optional[float],
    skill_vs_naive_pct: Optional[float],
    history_points: Optional[int],
    forecasts: List[Dict[str, Any]],
    reorder: Optional[Dict[str, Any]],
) -> Optional[str]:
    """Return a short natural-language insight, or None if AI is disabled/failed."""
    client = _get_client()
    if client is None:
        return None

    try:
        # Compact the numbers into a prompt (only the next few periods).
        horizon = forecasts[:6]
        demand_lines = "\n".join(
            f"  {p['period']}: {round(p['predicted_qty'])} "
            f"(range {round(p['confidence_low'])}-{round(p['confidence_high'])})"
            for p in horizon
        )
        r = reorder or {}
        prompt = (
            f"Product forecast summary:\n"
            f"- Model chosen: {model_used}\n"
            f"- Backtested error (sMAPE, lower is better): "
            f"{backtest_smape if backtest_smape is not None else 'n/a'}%\n"
            f"- Skill vs naive baseline: "
            f"{skill_vs_naive_pct if skill_vs_naive_pct is not None else 'n/a'}% "
            f"(positive means it beats naive)\n"
            f"- History used: {history_points} periods\n"
            f"- Predicted demand per period:\n{demand_lines}\n"
            f"- Current stock: {r.get('current_stock', 'unknown')}\n"
            f"- Reorder point: {round(r['reorder_point']) if r.get('reorder_point') is not None else 'n/a'}\n"
            f"- Suggested order qty: {round(r['suggested_order_qty']) if r.get('suggested_order_qty') is not None else 'n/a'}\n"
            f"- Should reorder now: {r.get('should_reorder')}\n\n"
            f"Write the recommendation."
        )

        base = dict(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=1024,
            system=SYSTEM,
            messages=[{"role": "user", "content": prompt}],
        )
        try:
            # Preferred: low effort keeps this fast/cheap for a short summary.
            # (On Claude Opus 5 thinking is on by default, so we don't set it.)
            msg = client.messages.create(output_config={"effort": "low"}, **base)
        except TypeError:
            # Older SDK without output_config — fall back to a plain call.
            msg = client.messages.create(**base)

        # Refusals / non-text: fail soft.
        if getattr(msg, "stop_reason", None) == "refusal":
            return None
        text = "".join(
            b.text for b in msg.content if getattr(b, "type", None) == "text"
        ).strip()
        return text or None

    except Exception as e:
        logger.warning("AI insight generation failed: %s", e)
        return None
