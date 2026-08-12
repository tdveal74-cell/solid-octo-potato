#!/usr/bin/env python3
"""
Scaling curves for the agent-output-gauntlet Stop hook (H9).

Measures the GROWTH RATE of every hot path, in-process, per pattern. A single
timing proves nothing: linear is ~2.0x per doubling and quadratic is ~4.0x, and
a ~1.0x reading means you measured ~28ms of process startup instead of the code.

This exists because the linearity claim has been wrong three times, each time
because the curve was derived from a CHOSEN FIXTURE SET rather than from the
code. So the rule here is: every regex in a scanning function gets a payload
that exercises it. Adding a regex without adding its payload is the bug.

Usage:
    python3 scaling.py [--hook /path/to/gauntlet-stop-hook.py] [--max 65536]

Exit status:
    0  every pattern is linear, except those recorded as known-superlinear
    1  a pattern that should be linear is superlinear (regression), or a
       known-superlinear pattern is now linear (fix it in the table below)
    2  the hook could not be loaded
"""

import argparse
import importlib.util
import os
import sys
import time

LINEAR_MAX = 3.0        # ratio/doubling below this is linear enough (linear~2.0)
TIMEOUT = 10            # settings.snippet.json declares timeout: 10 for this hook
SIZES = [2000, 4000, 8000, 16000, 32000, 64000]


def load_hook(path):
    spec = importlib.util.spec_from_file_location("gauntlet_hook", path)
    mod = importlib.util.module_from_spec(spec)
    sys.dont_write_bytecode = True
    spec.loader.exec_module(mod)
    return mod


def build_cases(h):
    """(name, fn, payload_builder, known_superlinear_reason_or_None).

    The first six are the curves tests/validation-tests.md H9 documents.
    The last two are the regexes inside strip_code that the documented curve
    never covered - found quadratic during the 2026-08-12 certification.
    """
    return [
        ("strip_code / unclosed ``` fences", h.strip_code,
         lambda n: "```\n" * (n // 4), None),
        ("shell_segments / heredoc markers", h.shell_segments,
         lambda n: "cat <<EOF\n" * (n // 10), None),
        ("shell_segments / unbalanced quotes", h.shell_segments,
         lambda n: "'" * n, None),
        ("bash_is_ship / env assignments", h.bash_is_ship,
         lambda n: "A=1 " * (n // 4), None),
        ("has_real_verdict / newlines", h.has_real_verdict,
         lambda n: "\n" * n, None),
        ("is_ship_tool / long camelCase name", lambda s: h.is_ship_tool(s, {}, False),
         lambda n: "aB" * (n // 2), None),

        ("strip_code / unclosed <!-- openers", h.strip_code,
         lambda n: "<!-- " * (n // 5),
         "HTML_COMMENT_RE (hook:209) is quadratic on unclosed openers"),
        ("strip_code / unclosed <details> openers", h.strip_code,
         lambda n: "<details>" * (n // 9),
         "DETAILS_RE (hook:210) is quadratic on unclosed openers"),
    ]


def measure(fn, build, sizes):
    row = []
    for n in sizes:
        payload = build(n)
        best = None
        for _ in range(3):
            t = time.perf_counter()
            fn(payload)
            el = time.perf_counter() - t
            best = el if best is None else min(best, el)
        row.append((len(payload), best))
        if best > 20:
            break
    return row


def classify(row):
    """Sustained growth ratio over the upper half of the curve."""
    ratios = [row[i][1] / row[i - 1][1] for i in range(1, len(row)) if row[i - 1][1] > 0]
    if not ratios:
        return 0.0, "flat"
    upper = ratios[len(ratios) // 2:] or ratios
    sustained = sum(upper) / len(upper)
    return sustained, ("linear" if sustained < LINEAR_MAX else "SUPERLINEAR")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hook", default=os.environ.get(
        "GAUNTLET_HOOK",
        os.path.expanduser("~/.claude/skills/synced/agent-output-gauntlet/"
                           "hooks/gauntlet-stop-hook.py")))
    ap.add_argument("--max", type=int, default=64000)
    args = ap.parse_args()

    if not os.path.isfile(args.hook):
        print("hook not found: %s" % args.hook)
        return 2
    h = load_hook(args.hook)
    sizes = [s for s in SIZES if s <= args.max]

    print("hook:  %s" % args.hook)
    print("linear is ~2.0x per doubling; quadratic is ~4.0x; "
          "threshold %.1fx\n" % LINEAR_MAX)

    problems = []
    known_super = []
    margins = []
    for name, fn, build, known in build_cases(h):
        row = measure(fn, build, sizes)
        sustained, verdict = classify(row)
        flag = ""
        if verdict == "SUPERLINEAR" and not known:
            flag = "  <-- REGRESSION"
            problems.append((name, "became superlinear (%.2fx)" % sustained))
        elif verdict == "linear" and known:
            flag = "  <-- FIXED, update the table in build_cases()"
            problems.append((name, "known-superlinear entry is now linear"))
        elif known:
            flag = "  <-- known: %s" % known
            known_super.append((name, known))

        print("%s" % name)
        print("  " + "  ".join("%6d:%7.4fs" % (ln, el) for ln, el in row))
        print("  sustained %.2fx/doubling -> %s%s\n" % (sustained, verdict, flag))

    # ---- end-to-end, through the real process, against the declared timeout
    print("END-TO-END (subprocess wall clock) vs settings.snippet.json timeout: 10")
    import json
    import subprocess
    import tempfile
    e2e = [("96KB unclosed fences", "```\n" * (98304 // 4)),
           ("144KB heredoc-heavy command", "cat <<EOF\n" * (147456 // 10)),
           ("200k quote characters", "'" * 200000),
           ("96KB unclosed <!-- openers", "<!-- " * (98304 // 5))]
    with tempfile.TemporaryDirectory() as td:
        for label, payload in e2e:
            p = os.path.join(td, "t.jsonl")
            with open(p, "w", encoding="utf-8") as fh:
                fh.write(json.dumps({"type": "assistant", "message": {
                    "role": "assistant", "content": [{"type": "text", "text": payload}]}}) + "\n")
                fh.write(json.dumps({"type": "assistant", "message": {
                    "role": "assistant", "content": [
                        {"type": "tool_use", "name": "mcp__Vercel__deploy_to_vercel",
                         "input": {}}]}}) + "\n")
            t = time.perf_counter()
            proc = subprocess.run(
                [sys.executable, "-B", args.hook],
                input=json.dumps({"transcript_path": p, "stop_hook_active": False}),
                capture_output=True, text=True, timeout=300)
            wall = time.perf_counter() - t
            if wall > TIMEOUT:
                note = "  *** PAST timeout:%d -> hook killed, gate disarmed ***" % TIMEOUT
            elif wall > TIMEOUT * 0.5:
                note = ("  *** %.0f%% of the timeout - one doubling of this input "
                        "exceeds it ***" % (100.0 * wall / TIMEOUT))
            else:
                note = ""
            print("  %-32s wall=%6.3fs  exit=%d%s" % (label, wall, proc.returncode, note))
            if wall > TIMEOUT:
                problems.append((label, "%.1fs exceeds the hook's own %ds timeout"
                                 % (wall, TIMEOUT)))
            elif wall > TIMEOUT * 0.5:
                margins.append((label, wall))

    if problems:
        print("\nNEEDS ATTENTION")
        for name, why in problems:
            print("  - %s: %s" % (name, why))
        return 1

    # No regressions - but say plainly what is still open. A closing line that
    # reads "all patterns linear" while known-superlinear entries stand is the
    # same defect this file exists to catch.
    if known_super:
        print("\nNo regressions. %d pattern(s) remain KNOWN-SUPERLINEAR and are "
              "open defects, not passes:" % len(known_super))
        for name, reason in known_super:
            print("  - %s: %s" % (name, reason))
    else:
        print("\nEvery measured pattern is linear.")
    for label, wall in margins:
        print("  margin warning: %s ran %.3fs against a %ds timeout" % (label, wall, TIMEOUT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
