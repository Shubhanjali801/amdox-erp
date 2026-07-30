"""
Run the full forecasting benchmark on the real UCI Online Retail dataset and
print an honest accuracy report.

  python benchmark/run_benchmark.py [--products N] [--horizon H]

Writes results to benchmark/results.json and benchmark/RESULTS.md.
"""
from __future__ import annotations
import argparse, json, time
from pathlib import Path

import prepare_data
import backtest


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--products", type=int, default=50)
    ap.add_argument("--horizon", type=int, default=4)
    ap.add_argument("--freq", choices=["weekly", "monthly"], default="weekly")
    args = ap.parse_args()

    t0 = time.time()
    unit = "weeks" if args.freq == "weekly" else "months"
    print(f"Loading + preparing real retail data (UCI Online Retail, {args.freq})...")
    series = prepare_data.build(freq=args.freq)
    series = dict(list(series.items())[: args.products])
    print(f"  {len(series)} products, {args.freq} demand, ~{len(next(iter(series.values())))} {unit} each\n")

    min_train = 20 if args.freq == "weekly" else 6
    print(f"Rolling-origin backtest (forecast horizon = {args.horizon} {unit})...")
    all_results = []
    for i, (sku, s) in enumerate(series.items(), 1):
        all_results.append(backtest.backtest_series(s, h=args.horizon, min_train=min_train, step=1))
        if i % 10 == 0:
            print(f"  ...{i}/{len(series)} products")

    summary = backtest.aggregate(all_results)
    elapsed = time.time() - t0

    # ── Report ──
    order = sorted(summary, key=lambda k: summary[k]["MAPE"])
    print("\n" + "=" * 64)
    print(f"  BENCHMARK RESULTS — {len(series)} real products, {args.horizon}-week horizon")
    print("=" * 64)
    print(f"  {'model':<16}{'MAPE':>8}{'sMAPE':>9}{'MAE':>9}{'skill vs naive':>16}")
    print("  " + "-" * 56)
    for name in order:
        r = summary[name]
        print(f"  {name:<16}{r['MAPE']:>7.1f}%{r['sMAPE']:>8.1f}%{r['MAE']:>9.1f}"
              f"{r['skill_vs_naive_%']:>14}%")
    best = order[0]
    print("  " + "-" * 56)
    print(f"  Best: {best}  ({summary[best]['MAPE']:.1f}% MAPE, "
          f"{summary[best]['skill_vs_naive_%']}% better than naive)")
    print(f"  Ran in {elapsed:.0f}s")

    out = {
        "dataset": "UCI Online Retail (real UK e-commerce, 2010-2011)",
        "products": len(series),
        "horizon_weeks": args.horizon,
        "validation": "rolling-origin walk-forward",
        "models": summary,
        "best_model": best,
    }
    Path(__file__).parent.joinpath("results.json").write_text(json.dumps(out, indent=2))
    print(f"\n  Wrote results.json")


if __name__ == "__main__":
    main()
