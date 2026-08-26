# Hook test suite — `agent-output-gauntlet`

An executable fixture corpus for the bundled Stop hook. It exists because the
package's headline evidence — "204/204 hook fixtures", "all patterns linear" —
was prose. No fixture list, no runner, no captured output shipped, so nobody
could reproduce either number, and both turned out to be wrong.

**The rule here: the count is whatever `run.py` prints.** Nothing in this
directory asserts a total. If you want to know how many fixtures there are, run
it.

## Run it

```sh
cd docs/certification/hook-suite
python3 run.py           # behavioural fixtures (H1–H8 + audit defects)
python3 scaling.py       # growth curves (H9) + end-to-end wall clock
```

Both default to the installed hook at
`~/.claude/skills/synced/agent-output-gauntlet/hooks/gauntlet-stop-hook.py`.
Point them elsewhere with `--hook PATH` or `GAUNTLET_HOOK=PATH`.

Python 3 standard library only, matching the hook. No network, no writes outside
a temp dir, no third-party packages.

## Current result (2026-08-26, against the candidate package)

```
TOTAL FIXTURES RUN: 205
  pass  189      H1 35 · H2 38 · H3 23 · H4 7 · H5 11 · H6 66 · H7 8 · H8 1
  FAIL    0      (unexpected — a regression)
  xfail  16      (known open defects, asserting the correct behaviour)
  XPASS   0      (a defect got fixed — delete its marker)
```

Every documented behaviour reproduces. All 16 defects found during the
certification audit reproduce as recorded.

`scaling.py` finds six patterns linear at ~2.0x per doubling and two
**superlinear at ~4.0x** — `HTML_COMMENT_RE` and `DETAILS_RE`, both inside
`strip_code`, neither ever covered by the documented curve. End-to-end, 96KB of
unclosed `<!--` openers burns 8.5s of the hook's declared `timeout: 10`. One
doubling of that input exceeds it, and a killed hook means the stop proceeds
unaudited.

## How the harness protects itself

`run.py` refuses to report anything until a known-ship fixture has actually
produced a block. A wrong path makes the hook fail open, so an "allow" result
proves nothing on its own — an early version of the package's own suite reported
21 failures that were purely a missing `.jsonl` suffix, and it could just as
easily have read as a clean pass. Exit status 2 means the harness is broken and
no other number in the output means anything.

## `xfail` semantics

Every fixture asserts the **correct** behaviour, including the ones covering open
defects. Those carry an `xfail` marker naming the defect.

| Outcome | Meaning |
|---|---|
| `pass` | behaves as documented |
| `FAIL` | a regression — something that used to work stopped working |
| `xfail` | a known open defect, still open. Expected. |
| `XPASS` | **the defect was fixed** — delete the marker, the suite now guards it |

`run.py` exits non-zero on `FAIL` or `XPASS`, so the suite goes green when the
defects are genuinely fixed, and tells you to update itself when they are.

## The open defects it currently pins

- `MUTATION_VERBS` omits `push` and `fork` — `push_files` and `fork_repository`
  write to a remote repo and are invisible to the gate.
- `resolve` and `comment` are mutation verbs, and `MUTATION_HEAD_RE` outranks the
  read veto, so five read-only tools block. This is the cry-wolf class that gets
  a hook switched off.
- The verdict shape `SKILL.md:70-81` documents is printed inside a fence, and
  `strip_code` deletes fenced blocks — a correct audit reads as unaudited.
- The hook's own block message coaches the escape that clears its gate.
- `has_real_verdict` accepts content-free receipts (length, charset and
  word-count only).
- One-character quote splicing (`"git" push`, `g''it push`) defeats
  command-position matching.
- The 32-iteration peel bound is a silent bypass at 33 stacked env assignments.
- `HTML_COMMENT_RE` / `DETAILS_RE` quadratics, above.

## Adding fixtures

Add to `FIXTURES` in `fixtures.py` via `add(...)`. For `scaling.py`, add a row to
`build_cases()`.

The discipline that matters, and the one the package kept missing: **every regex
in a scanning function needs its own payload.** The linearity claim was wrong
three times, and each time the cause was the same — the curve was derived from a
chosen fixture set rather than from the code, so a regex nobody thought to
exercise stayed quadratic. Adding a regex without adding its payload is the bug.
