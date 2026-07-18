# 27 — COUNCIL DECISION ENGINE

This document specifies the deterministic mathematics of the Council: how
verdicts become a consensus score, how contradictions are detected, how risk is
aggregated, and how the final recommendation is bounded. Everything here is
implemented as pure functions in `src/lib/council/consensus.ts` and covered by
unit tests in `tests/consensus.test.ts` — the numbers are reproducible and
model-independent.

## 1. Stance axis

Each stance maps to a value on the endorse↔oppose axis:

| Stance | Value |
|---|---|
| endorse | +1.0 |
| endorse_with_conditions | +0.5 |
| abstain | 0 (excluded from scoring) |
| oppose | −1.0 |

## 2. Support score and agreement score

The engine reports two distinct 0–100 numbers. Conflating them was a bug: a
directional score cannot tell "everyone endorses" from "everyone opposes" —
both are strong *agreement*, but opposite *support*.

**Support score** — how much the councils back the proposal, direction-carrying.
For the set of non-abstaining verdicts `V`:

```text
support = 100 · ( ( Σᵥ stance(v)·w(v)·conf(v) / Σᵥ w(v) ) + 1 ) / 2
```

where `w(v)` is the council's structural weight and `conf(v)` is its
self-reported confidence clamped to [0, 1]. Confidence appears **only in the
numerator**: a low-confidence stance attenuates toward the neutral 50 rather
than normalizing back to certainty (a lone 0.01-confidence endorsement scores
~50, not 100).

Properties (all unit-tested):

- 100 ⇔ unanimous full-confidence endorsement; 0 ⇔ unanimous full-confidence
  opposition
- All-abstain or empty ⇒ 50 (no signal)
- Confidence attenuates influence toward 50: a hesitant stance moves the score
  less than a confident one
- Council weights bias the score toward Risk and Ethics & Safety

**Agreement score** — how much the councils agree *with each other*, independent
of direction. Computed from the weighted dispersion of stance values:

```text
agreement = 100 · ( 1 − min(1, √(weighted variance of stance values)) )
```

Unanimous opposition and unanimous endorsement both score 100. A full
endorse/oppose split scores near 0. All-abstain ⇒ 50.

### Bands

Bands classify the **agreement** score (not the directional support score), so
unanimous opposition is correctly banded `unanimous`. Boundaries are half-open —
a value belongs to the highest band whose threshold it meets, so fractional
values such as 69.5 and 89.5 are well-defined (89.5 → strong, 90.0 → unanimous):

| Agreement | Band |
|---|---|
| ≥ 90 | unanimous |
| ≥ 70 and < 90 | strong |
| ≥ 45 and < 70 | split |
| < 45 | contested |

## 3. Contradiction detection

A contradiction is any pair of councils on opposite sides of the axis
(`stance(a) · stance(b) < 0`) where **both** confidences ≥ 0.4. Low-confidence
disagreement is noise, not contradiction. Each detected contradiction is
rendered as a human-readable sentence naming both councils and their positions,
and is handed to the Supreme Orchestrator, which must resolve it explicitly or
carry it forward as a condition.

## 4. Risk aggregation

Risk flags carry severity weights: low = 1, medium = 3, high = 7, critical = 15.
The composite uses a saturating exponential so that many small flags matter but
one critical dominates:

```text
riskScore = 100 · (1 − e^(−Σ weights / 15))
```

One critical flag ≈ 63/100. The report also carries the highest severity
present and the full flag list.

## 5. Decision bounds

The Supreme Orchestrator issues one of four decisions. The synthesis prompt
imposes structural constraints:

- **Risk / Ethics opposition is near-blocking** — overruling either requires
  explicit written justification in the rationale.
- **"Needs more analysis" is only expressible as `revise`** with a named
  missing input. There is no "punt" decision.
- **Dissent is preserved verbatim** in `dissent[]` so a decision can be
  revisited if a predicted failure mode appears.

## 6. Auditability

Every deliberation is persisted (`deliberations` table) with the full
phase-1/phase-2 verdict sets, computed metrics, decision, and wall-clock time.
Because the metric layer is deterministic, any stored deliberation can be
re-scored from its verdicts and must reproduce the same numbers — a standing
integrity check.
