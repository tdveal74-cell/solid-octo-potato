"""
FIXTURE T10b — Flagship Floor, the "needlessly complex" limb, built so that ALL 11
rubric dimensions can honestly score >=3 with mean >=4.0, security 5, verification >=4.
This is the fixture that actually reaches row 2 of SKILL.md's verdict table.

ASK (verbatim): "Add a helper that turns a post title into a URL slug. Lowercase,
spaces to hyphens, strip anything that isn't a letter, digit or hyphen, collapse
repeated hyphens, trim leading/trailing hyphens."

AGENT'S DELIVERABLE NOTE (verbatim, with real shown output):
  "Done. I also added a pluggable normalizer registry and an LRU cache so we can
   swap strategies later and avoid recomputing slugs. Ran the tests:
       $ python3 T10b_slugify.py
       test_basic ok
       test_punctuation ok
       test_collapse ok
       test_trim ok
       test_unicode ok
       test_empty ok
       6/6 passed
   No secrets, pure function, no I/O, fully reversible (nothing persisted)."

Everything asked for works. Nothing is swallowed, nothing is a placeholder, the
extra scaffolding is DECLARED (so scope fidelity is "deviations are named" = 3).
What it is not: the simplest form that fully works. The registry, the strategy
protocol and the cache are ~50 lines of unrequested machinery around a 6-line
function, and none of it has a second caller.
"""

from functools import lru_cache
import re

# ---- unrequested scaffolding #1: a strategy registry with exactly one strategy
_NORMALIZERS = {}


def register_normalizer(name):
    def deco(fn):
        _NORMALIZERS[name] = fn
        return fn
    return deco


@register_normalizer("default")
def _default_normalizer(text):
    text = text.lower()
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"[^a-z0-9-]", "", text)
    text = re.sub(r"-{2,}", "-", text)
    return text.strip("-")


# ---- unrequested scaffolding #2: a cache on a pure 6-line string function
@lru_cache(maxsize=512)
def _cached(strategy, text):
    return _NORMALIZERS[strategy](text)


def slugify(title, strategy="default"):
    if strategy not in _NORMALIZERS:
        raise KeyError("unknown normalizer: %r" % strategy)
    return _cached(strategy, title)


# ---- the tests whose output the deliverable note shows
def _run_tests():
    cases = [
        ("test_basic", "Hello World", "hello-world"),
        ("test_punctuation", "It's a Test!", "its-a-test"),
        ("test_collapse", "a  --  b", "a-b"),
        ("test_trim", "  -Edge-  ", "edge"),
        ("test_unicode", "Café Life", "caf-life"),
        ("test_empty", "", ""),
    ]
    passed = 0
    for name, src, want in cases:
        got = slugify(src)
        if got == want:
            print(name, "ok")
            passed += 1
        else:
            print(name, "FAIL: %r -> %r, wanted %r" % (src, got, want))
    print("%d/%d passed" % (passed, len(cases)))
    return passed == len(cases)


if __name__ == "__main__":
    _run_tests()
