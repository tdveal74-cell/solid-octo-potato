# 26 — META SUPREME X COUNCIL ARCHITECTURE

The Council is the deliberative core of The Quiet Operator. It exists because a
single model's first answer is a draft, not a decision. Any consequential
output — strategy, financial, legal, enterprise, or workforce-impacting — is
deliberated by eight specialist councils under a Supreme Orchestrator before it
reaches a user.

## Roster

| Council | Mandate | Weight |
|---|---|---|
| Research Council | Evidence, prior art, known vs. assumed | 1.0 |
| Strategy Council | Positioning, timing, second-order effects | 1.2 |
| Logic Council | Consistency, causal reasoning, hidden premises | 1.1 |
| Creative Council | Alternatives and reframings | 0.9 |
| Risk Council | Failure modes, reversibility, blast radius | 1.3 |
| Quality Council | Flagship execution bar | 1.0 |
| Ethics & Safety Council | Harm, honesty, privacy, safety controls | 1.3 |
| Enterprise Council | Scale, compliance, operational cost | 1.0 |

Weights express structural influence on the consensus score. Risk and
Ethics & Safety carry the highest weights by design: they are the councils
whose opposition the Supreme Orchestrator may overrule only with explicit
justification.

The **Supreme Orchestrator** is not a ninth voter. It is the synthesis layer:
it receives the verdicts plus the computed consensus metrics and issues exactly
one decision, preserving dissent on the record.

## Deliberation protocol

```text
Phase 1 — INDEPENDENT ANALYSIS
  All councils receive the question in parallel, in isolation.
  Each returns a structured verdict:
    stance ∈ {endorse, endorse_with_conditions, oppose, abstain}
    confidence ∈ [0, 1]
    position, keyPoints[], risks[{severity, description}], conditions[]

Phase 2 — DEBATE (optional, default on)
  Each council receives the other seven verdicts and revises.
  The prompt requires councils to state what changed their mind — and to
  hold their position when peer reasoning does not genuinely change it.

Phase 3 — SYNTHESIS
  Deterministic layer (code, not model):
    consensus score, consensus band, stance breakdown,
    contradiction detection, aggregate risk.
  Supreme Orchestrator (model):
    resolves each contradiction explicitly, weighs dissent,
    issues decision ∈ {proceed, proceed_with_conditions, revise, reject}.
```

## Why independence-then-debate

Running all councils with sight of each other from the start produces anchoring:
the first strong opinion drags the rest. Independent phase-1 verdicts give an
unanchored spread; the debate phase then recovers the benefits of
cross-examination without losing the diversity of the initial positions. The
delta between phase 1 and phase 2 is itself a signal — positions that flip
easily were weakly held.

## Implementation

The reference implementation lives in the platform codebase:

- `src/lib/council/types.ts` — the full type contract
- `src/lib/council/councils.ts` — seat definitions and system prompts
- `src/lib/council/consensus.ts` — deterministic scoring (pure, unit-tested)
- `src/lib/council/engine.ts` — phase orchestration on the Claude API
- `POST /api/council/deliberate` — the public surface

Council seats run on the primary model (Claude Opus tier) with adaptive
thinking and structured outputs, guaranteeing schema-valid verdicts. All
phase-1 and phase-2 seats run in parallel; a full 8-seat, two-phase
deliberation is 17 model calls (8 + 8 + 1 synthesis).

## Cost and latency posture

The Council is deliberately expensive. It is invoked for:

1. Explicit user requests (`/council` in the product)
2. Automatic escalation from high-stakes agents (Strategy, Enterprise
   Intelligence, Financial Analysis, Legal/Compliance)
3. Internal platform decisions (release gates, pricing changes)

It is **not** invoked for routine agent work. The routing stack (doc 27)
keeps everyday requests on the single-agent path.
