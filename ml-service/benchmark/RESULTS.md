# Benchmark Results — real data, honest numbers

**Dataset:** UCI Online Retail (~500k real UK e-commerce transactions, Dec 2010–Dec 2011)
**Validation:** rolling-origin (walk-forward) — the model never sees the future
**Baseline:** naive (recent-average persistence). A model is only "good" if it beats naive.

## Monthly demand · 30 products · 1-month-ahead
| Model | MAPE | sMAPE | skill vs naive |
|---|---|---|---|
| **ses** (best) | **89.8%** | **48.7%** | **+2.4%** |
| naive | 97.0% | 51.4% | 0.0% |
| ets_damped | 103.2% | 55.9% | −14.6% |
| prophet | 112.2% | 56.4% | −8.0% |
| moving_average | 124.0% | 52.2% | −1.4% |

## Weekly demand · 15 products · 4-week-ahead
| Model | MAPE | sMAPE | skill vs naive |
|---|---|---|---|
| **ses** (best) | **162.1%** | **57.2%** | **+3.7%** |
| moving_average | 164.7% | 58.2% | +3.7% |
| naive | 171.4% | 59.5% | 0.0% |
| prophet | 176.8% | 60.0% | −0.1% |
| ets_damped | 191.6% | 61.1% | −2.2% |

## What the numbers say (the honest story)

1. **Simple Exponential Smoothing wins.** On real short-history per-item demand,
   SES beats Prophet, damped-ETS, *and* the naive baseline. Prophet and ETS often
   **lose to naive** — they over-fit / over-extrapolate on ~1 year of data.

2. **Monthly is far more forecastable than weekly** (49% vs 57% sMAPE), which is
   why the app forecasts at the monthly granularity real reorder decisions use.

3. **Deep learning (LSTM) is the wrong tool here.** It needs hundreds of points
   per series; real per-item retail history is ~13 monthly / ~53 weekly points.
   Using the model that fits the data size is the actual skill — a fake
   "12.84% LSTM MAPE" on synthetic data would have hidden this.

4. **Per-item demand is inherently hard.** No method beats naive by more than a
   few percent — true for everyone (see the M-competitions). The product value is
   the **reorder recommendation** (forecast + safety stock), not pinpoint numbers.

## Reproduce
```bash
cd ml-service
python benchmark/download_data.py
python benchmark/run_benchmark.py --products 30 --horizon 1 --freq monthly
python benchmark/run_benchmark.py --products 15 --horizon 4 --freq weekly
```
