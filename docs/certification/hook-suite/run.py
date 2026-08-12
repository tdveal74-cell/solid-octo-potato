#!/usr/bin/env python3
"""
Runner for the agent-output-gauntlet Stop-hook fixture corpus.

The count of fixtures is whatever this program reports. It is not asserted
anywhere in prose, and it should not be.

Usage:
    python3 run.py [--hook /path/to/gauntlet-stop-hook.py] [-v]

Exit status:
    0  every fixture behaved as documented; every xfail still fails as recorded
    1  an unexpected FAIL (a regression), or an XPASS (a defect was fixed and
       its xfail marker must now be deleted), or the hook exited non-zero
    2  the harness itself is broken - no result below it means anything
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fixtures import FIXTURES  # noqa: E402

DEFAULT_HOOK = os.path.expanduser(
    "~/.claude/skills/synced/agent-output-gauntlet/hooks/gauntlet-stop-hook.py")

SELF_TEST_RECORD = (
    '{"type":"assistant","message":{"role":"assistant","content":'
    '[{"type":"tool_use","name":"mcp__Vercel__deploy_to_vercel","input":{}}]}}')


def invoke(hook, tmpdir, records, stdin=None, env_extra=None, active=False, tag="f"):
    """Run the hook once. Returns (decision, exit_code, stderr)."""
    path = os.path.join(tmpdir, tag + ".jsonl")
    with open(path, "w", encoding="utf-8") as fh:
        for r in records:
            fh.write(r if isinstance(r, str) else json.dumps(r))
            fh.write("\n")

    if stdin is None:
        stdin = json.dumps({"transcript_path": path, "stop_hook_active": active})

    env = dict(os.environ)
    env.pop("GAUNTLET_HOOK_DISABLE", None)
    env.pop("GAUNTLET_HOOK_STRICT", None)
    env.update(env_extra or {})

    proc = subprocess.run([sys.executable, "-B", hook], input=stdin,
                          capture_output=True, text=True, env=env, timeout=60)
    decision = "block" if '"decision": "block"' in proc.stdout else "allow"
    return decision, proc.returncode, proc.stderr


def self_test(hook, tmpdir):
    """A known-ship fixture MUST block. Without this, an 'allow' proves nothing:
    a wrong path makes the hook fail open and every later result reads clean."""
    decision, code, _ = invoke(hook, tmpdir, [SELF_TEST_RECORD], tag="selftest")
    if decision != "block" or code != 0:
        print("HARNESS BROKEN - a known unaudited deploy did not block "
              "(decision=%s exit=%d). Aborting; no result would mean anything."
              % (decision, code))
        return False
    print("harness self-test: an unaudited deploy blocks, exit 0. OK\n")
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--hook", default=os.environ.get("GAUNTLET_HOOK", DEFAULT_HOOK))
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args()

    if not os.path.isfile(args.hook):
        print("hook not found: %s\nPass --hook or set GAUNTLET_HOOK." % args.hook)
        return 2

    print("hook:   %s" % args.hook)
    print("python: %s\n" % sys.version.split()[0])

    with tempfile.TemporaryDirectory() as tmpdir:
        if not self_test(args.hook, tmpdir):
            return 2

        results = []
        for i, f in enumerate(FIXTURES):
            decision, code, stderr = invoke(
                args.hook, tmpdir, f["records"], stdin=f["stdin"],
                env_extra=f["env"], active=f["active"], tag="f%04d" % i)
            ok = (decision == f["expect"]) and code == 0
            if f["xfail"]:
                status = "XPASS" if ok else "xfail"
            else:
                status = "pass" if ok else "FAIL"
            results.append((f, status, decision, code, stderr))

    # ------------------------------------------------------------- report
    by_test = {}
    for f, status, _, _, _ in results:
        d = by_test.setdefault(f["test"], {})
        d[status] = d.get(status, 0) + 1

    print("PER TEST")
    for t in sorted(by_test):
        d = by_test[t]
        total = sum(d.values())
        bits = ", ".join("%s %d" % (k, d[k]) for k in
                         ("pass", "FAIL", "xfail", "XPASS") if k in d)
        print("  %-6s %3d fixtures   %s" % (t, total, bits))

    counts = {}
    for _, status, _, _, _ in results:
        counts[status] = counts.get(status, 0) + 1

    print("\nTOTAL FIXTURES RUN: %d" % len(results))
    print("  pass  %d" % counts.get("pass", 0))
    print("  FAIL  %d  (unexpected - a regression)" % counts.get("FAIL", 0))
    print("  xfail %d  (known open defects, asserted correct behaviour)"
          % counts.get("xfail", 0))
    print("  XPASS %d  (defect fixed - delete the xfail marker)"
          % counts.get("XPASS", 0))

    bad_exit = [r for r in results if r[3] != 0]
    if bad_exit:
        print("\nNON-ZERO HOOK EXITS: %d  (a non-zero exit from a Stop hook is "
              "itself a block)" % len(bad_exit))
        for f, _, _, code, _ in bad_exit:
            print("  exit=%d  %s" % (code, f["id"]))

    failures = [r for r in results if r[1] in ("FAIL", "XPASS")]
    if failures:
        print("\nNEEDS ATTENTION")
        for f, status, decision, code, _ in failures:
            print("  [%s] %-34s %s" % (status, f["id"], f["name"]))
            print("        expected %s, got %s (exit %d)" % (f["expect"], decision, code))
            if status == "XPASS":
                print("        this xfail is stale: %s" % f["xfail"])

    if args.verbose:
        print("\nKNOWN OPEN DEFECTS (xfail)")
        seen = set()
        for f, status, _, _, _ in results:
            if status == "xfail" and f["xfail"] not in seen:
                seen.add(f["xfail"])
                print("  - %s" % f["xfail"])

    return 1 if (failures or bad_exit) else 0


if __name__ == "__main__":
    sys.exit(main())
