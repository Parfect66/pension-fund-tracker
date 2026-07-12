"""
Trade Scorer
============
Gives each ORB signal a score out of 100 based on factors that
tend to separate high-quality breakouts from weak ones.

The idea: not every signal is worth taking. A score helps you
decide which trades to act on and which to skip.

Scoring factors (each worth points, adding to 100 max):

  1. Time of day          (25 pts) — earlier breakouts tend to be stronger
  2. Opening range size   (25 pts) — a tight range means a cleaner break
  3. Breakout volume      (25 pts) — high volume confirms the move
  4. Risk/reward ratio    (25 pts) — how far to target vs how far to stop

How to run:
    python3 score_trades.py

Output: backtests/orb_scored.csv  (signals + scores, sorted best first)
"""

import pandas as pd
import numpy as np
import os

# ---------------------------------------------------------------------------
# Settings
# ---------------------------------------------------------------------------

SIGNALS_FILE  = "../backtests/orb_signals.csv"
PRICE_DATA    = "../data/nq_sample.csv"
RESULTS_FILE  = "../backtests/orb_scored.csv"

# These must match what you used in backtest_orb.py
STOP_LOSS_POINTS  = 30
PROFIT_TARGET_PTS = 60

# Trades with a score at or above this threshold are "high quality"
HIGH_QUALITY_THRESHOLD = 60

# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------

def load_files():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    signals = pd.read_csv(os.path.join(script_dir, SIGNALS_FILE))
    signals = signals[signals["Signal"] != "NONE"].copy()
    signals["Signal_Time"] = pd.to_datetime(signals["Signal_Time"], utc=True).dt.tz_convert("America/New_York")

    prices = pd.read_csv(os.path.join(script_dir, PRICE_DATA),
                         index_col="Datetime", parse_dates=True)
    if prices.index.tz is None:
        prices.index = prices.index.tz_localize("America/New_York",
                                                  ambiguous="infer",
                                                  nonexistent="shift_forward")

    print(f"Loaded {len(signals)} signals to score.")
    return signals, prices

# ---------------------------------------------------------------------------
# Individual scoring factors
# Each function returns a score between 0 and 25
# ---------------------------------------------------------------------------

def score_time_of_day(signal_time):
    """
    Earlier breakouts are given more points.
    Intuition: the first breakout of the day captures the full trend.
    A breakout at 3pm is often a low-energy, end-of-day drift.

    Scale:
      Before 11:00am  → 25 pts  (best)
      11:00–12:00pm   → 18 pts
      12:00–1:00pm    → 12 pts
      1:00–2:00pm     →  6 pts
      After 2:00pm    →  0 pts  (weakest)
    """
    hour = signal_time.hour + signal_time.minute / 60  # e.g. 10:30 → 10.5

    if   hour < 11:   return 25
    elif hour < 12:   return 18
    elif hour < 13:   return 12
    elif hour < 14:   return 6
    else:             return 0


def score_range_size(range_size, all_range_sizes):
    """
    Scores how tight the opening range was compared to recent history.
    A tight range (small number) is better — it means the market was
    coiled and the breakout is cleaner.

    We compare today's range to the median of all ranges in the dataset,
    then assign points based on which percentile it falls in.
    """
    if len(all_range_sizes) < 5:
        return 12  # not enough data to compare — give average score

    percentile = (all_range_sizes < range_size).mean() * 100  # 0–100

    # Lower percentile = tighter range = better score
    if   percentile <= 20:  return 25   # tighter than 80% of days
    elif percentile <= 40:  return 18
    elif percentile <= 60:  return 12
    elif percentile <= 80:  return 6
    else:                   return 0    # wider than 80% of days


def score_breakout_volume(signal_time, prices):
    """
    Compares the volume on the breakout bar to the average volume
    of that same day's opening range bars.

    High volume on the breakout bar = more conviction = better score.
    Low volume = the move might be a fake-out.
    """
    # Get the breakout bar itself
    breakout_bar_data = prices[prices.index == signal_time]
    if breakout_bar_data.empty:
        return 12

    breakout_vol = breakout_bar_data["Volume"].iloc[0]

    # Get opening range bars for that day (9:30–10:00am)
    day = signal_time.normalize()
    market_open = day.replace(hour=9, minute=30)
    range_end   = day.replace(hour=10, minute=0)
    range_bars  = prices[(prices.index >= market_open) & (prices.index < range_end)]

    if range_bars.empty:
        return 12

    avg_range_vol = range_bars["Volume"].mean()

    if avg_range_vol == 0:
        return 12

    ratio = breakout_vol / avg_range_vol  # >1 = breakout had more volume than range

    if   ratio >= 2.5:  return 25   # breakout volume 2.5x the range average
    elif ratio >= 1.75: return 18
    elif ratio >= 1.25: return 12
    elif ratio >= 0.75: return 6
    else:               return 0    # breakout volume was weak


def score_risk_reward(range_size, stop_pts, target_pts):
    """
    Rewards setups where the potential gain is large relative to the risk.

    The basic risk/reward ratio (RR) = target points / stop points.
    But we also factor in the range size — a big range eats into your
    target because price has to travel further just to reach the range edge.

    Simple version here: just use the fixed stop/target ratio with a
    small penalty for very wide ranges.
    """
    base_rr = target_pts / stop_pts if stop_pts > 0 else 0

    # Penalty: if the range is bigger than the stop, you're risking less
    # than one range-width but targeting two — that's actually fine.
    # Only penalise if the range itself is enormous (>2x the stop).
    range_penalty = max(0, (range_size - stop_pts * 2) / stop_pts) * 5

    adjusted_rr = base_rr - range_penalty

    if   adjusted_rr >= 2.5: return 25
    elif adjusted_rr >= 2.0: return 18
    elif adjusted_rr >= 1.5: return 12
    elif adjusted_rr >= 1.0: return 6
    else:                    return 0

# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------

def score_all_signals(signals, prices):
    all_range_sizes = signals["Range_Size_Pts"].values
    scored_rows = []

    for _, row in signals.iterrows():
        signal_time = pd.Timestamp(row["Signal_Time"])

        s_time   = score_time_of_day(signal_time)
        s_range  = score_range_size(row["Range_Size_Pts"], all_range_sizes)
        s_volume = score_breakout_volume(signal_time, prices)
        s_rr     = score_risk_reward(row["Range_Size_Pts"], STOP_LOSS_POINTS, PROFIT_TARGET_PTS)

        total = s_time + s_range + s_volume + s_rr

        scored_rows.append({
            **row.to_dict(),                  # keep all original columns
            "Score_TimeOfDay":   s_time,
            "Score_RangeSize":   s_range,
            "Score_Volume":      s_volume,
            "Score_RiskReward":  s_rr,
            "Total_Score":       total,
            "Grade":             grade(total),
            "Take_Trade":        "YES" if total >= HIGH_QUALITY_THRESHOLD else "no",
        })

    df = pd.DataFrame(scored_rows)
    df = df.sort_values("Total_Score", ascending=False)
    return df


def grade(score):
    """Convert numeric score to a letter grade — easier to read at a glance."""
    if   score >= 80: return "A"
    elif score >= 65: return "B"
    elif score >= 50: return "C"
    elif score >= 35: return "D"
    else:             return "F"

# ---------------------------------------------------------------------------
# Display summary
# ---------------------------------------------------------------------------

def print_summary(df):
    total      = len(df)
    take_count = (df["Take_Trade"] == "YES").sum()
    skip_count = total - take_count

    print("\n" + "=" * 55)
    print("  TRADE SCORES — Opening Range Breakout")
    print("=" * 55)
    print(f"  Total signals scored : {total}")
    print(f"  High quality (≥{HIGH_QUALITY_THRESHOLD}) : {take_count}  → would take these")
    print(f"  Low quality  (<{HIGH_QUALITY_THRESHOLD}) : {skip_count}  → would skip these")
    print()

    grade_counts = df["Grade"].value_counts().sort_index()
    print("  Grade breakdown:")
    for g, count in grade_counts.items():
        bar = "█" * count
        print(f"    {g}  {bar}  ({count})")

    print()
    print("  Top 10 highest-scoring setups:")
    cols = ["Date", "Signal", "Signal_Time", "Range_Size_Pts",
            "Score_TimeOfDay", "Score_RangeSize", "Score_Volume",
            "Score_RiskReward", "Total_Score", "Grade", "Take_Trade"]
    print(df[cols].head(10).to_string(index=False))

    print()
    print("  Score breakdown for the best setup:")
    best = df.iloc[0]
    print(f"    Date          : {best['Date']}")
    print(f"    Direction     : {best['Signal']}")
    print(f"    Time of day   : {best['Score_TimeOfDay']}/25")
    print(f"    Range size    : {best['Score_RangeSize']}/25")
    print(f"    Volume        : {best['Score_Volume']}/25")
    print(f"    Risk/reward   : {best['Score_RiskReward']}/25")
    print(f"    TOTAL         : {best['Total_Score']}/100  (Grade {best['Grade']})")

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    signals, prices = load_files()
    scored = score_all_signals(signals, prices)

    script_dir = os.path.dirname(os.path.abspath(__file__))
    save_path  = os.path.join(script_dir, RESULTS_FILE)
    scored.to_csv(save_path, index=False)
    print(f"Scored signals saved to: {save_path}")

    print_summary(scored)
