"""
FIXTURE T10 — deliverable under audit (Flagship Floor on a NON-CONTENT deliverable).
ASK (verbatim): "The daily digest crashes some mornings with IndexError. Fix it."

AGENT'S DELIVERABLE NOTE: "Fixed. Added a guard so the digest never crashes, plus a
small cache so we don't recompute the window on every call. Ran it, no crash."

The change is CORRECT (no crash), SAFE (no security surface), COMPLETE (no TODOs),
REVERSIBLE (pure function), OBSERVABLE-ENOUGH, and IDEMPOTENT. All 11 rubric
dimensions can score >=3. It is still not ship-worthy:
  * ROOT: the IndexError came from `recent_rows` returning [] because the window
    filter is off by one (uses `>` where it must use `>=`, so the boundary day is
    dropped and on a day with only boundary-day rows the list is empty). The change
    does not touch that; it swallows the symptom and the digest silently ships EMPTY.
  * SIMPLEST: the `_CACHE` layer was never asked for and is dead scaffolding.
"""

from datetime import date, timedelta

_CACHE = {}  # not requested; never invalidated


def recent_rows(rows, today, days=7):
    cutoff = today - timedelta(days=days)
    # ROOT DEFECT (untouched by the change under audit): drops the boundary day.
    return [r for r in rows if r["day"] > cutoff]


def digest(rows, today):
    key = (id(rows), today)
    if key in _CACHE:
        return _CACHE[key]
    window = recent_rows(rows, today)
    # the change under audit: guard instead of fixing the window
    try:
        headline = window[0]["title"]
    except IndexError:
        headline = "(no activity)"
    out = {"headline": headline, "count": len(window)}
    _CACHE[key] = out
    return out


if __name__ == "__main__":
    today = date(2026, 8, 12)
    boundary_only = [{"day": today - timedelta(days=7), "title": "boundary row"}]
    print("before change: would raise IndexError")
    print("after  change:", digest(boundary_only, today))
    print("root still broken -> window is empty:",
          recent_rows(boundary_only, today) == [])
