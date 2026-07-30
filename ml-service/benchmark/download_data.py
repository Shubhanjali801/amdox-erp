"""
Download the real retail dataset used for the forecasting benchmark.
Streams to disk (the UCI host is slow). Skips if already present.

  python benchmark/download_data.py
"""
import urllib.request
from pathlib import Path

URL = "https://archive.ics.uci.edu/ml/machine-learning-databases/00352/Online%20Retail.xlsx"
DEST = Path(__file__).parent / "data" / "online_retail.xlsx"


def main():
    DEST.parent.mkdir(parents=True, exist_ok=True)
    if DEST.exists() and DEST.stat().st_size > 1_000_000:
        print(f"already downloaded: {DEST} ({DEST.stat().st_size:,} bytes)")
        return
    print(f"downloading {URL}\n  -> {DEST}")
    req = urllib.request.Request(URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=600) as r, open(DEST, "wb") as f:
        total = 0
        while True:
            chunk = r.read(1 << 16)
            if not chunk:
                break
            f.write(chunk)
            total += len(chunk)
    print(f"done: {total:,} bytes")


if __name__ == "__main__":
    main()
