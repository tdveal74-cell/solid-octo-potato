# 28 — AI SAFETY AND ALIGNMENT FRAMEWORK

The Quiet Operator sells judgment about people's careers and businesses. The
cost of a confidently wrong or manipulative output is borne by a real person
making a real decision. This framework defines the controls that keep the
platform honest.

## Principles

1. **Truth over comfort, comfort over cruelty.** Agents deliver honest
   assessments (a weak market position is stated as weak) without
   catastrophizing. The Job Security Audit reports exposure bands, never
   "your job is doomed."
2. **Known vs. estimated is always labeled.** The Research agent grades every
   claim `[verified] / [reported] / [inferred]`; the Financial agent shows its
   assumptions as an editable list; the Knowledge Engine flags unverified
   sources in answers.
3. **No dark patterns.** The Ethics & Safety Council's charter makes
   manipulation, engagement-bait, and overclaiming automatic grounds for
   opposition — and its opposition is near-blocking (doc 27 §5).
4. **Humans own irreversible actions.** Automations (doc: Automation OS) must
   declare a human checkpoint for anything irreversible or outward-facing.
   The Automation Agent's system prompt enforces this at design time.

## Structural controls (in code today)

| Control | Mechanism |
|---|---|
| High-stakes escalation | Strategy, Enterprise Intelligence, Financial, and Legal/Compliance agents carry `escalateToCouncil: true`; their outputs are Council-reviewed before delivery (`src/lib/orchestrator/index.ts`). |
| Weighted safety veto | Ethics & Safety and Risk councils carry the highest weights (1.3) in the consensus math; the Supreme Orchestrator may overrule them only with explicit justification. |
| Structured outputs | All verdicts and recommendations are schema-validated (Zod + API structured outputs) — no free-text parsing of safety-relevant fields. |
| Professional-advice boundaries | Financial and Legal agents state in every output that they are not licensed advisors and that qualified review is required for consequential matters. |
| Determinism where it matters | Exposure scoring and consensus math are pure functions with unit tests — the numbers users see cannot drift with model updates. |
| Audit trail | `deliberations`, `agent_runs`, and `audit_log` tables record who asked what, which agent answered, and whether the Council reviewed it. |

## Data controls

- **Minimization.** Career audits store task structures and scores, not
  free-text descriptions of employers or colleagues, unless the user opts in.
- **Row-level security.** Every user-owned table ships with owner-only RLS
  policies (`src/lib/db/schema.sql`); enterprise org access is additive and
  explicit.
- **Memory transparency.** User memories are a first-class table the user can
  view and delete — never an opaque embedding soup.
- **No training on user data.** Platform data is not used to train models;
  API-provider retention follows the provider's documented policy.

## Model-level posture

- Primary model calls run with adaptive thinking; safety-relevant refusals
  (`stop_reason: "refusal"`) are surfaced to the user as a declined request,
  never silently retried with prompt manipulation.
- System prompts are versioned in the repository — prompt changes are code
  review events, not runtime configuration.

## Red-team cadence

Quarterly internal red-team of the three highest-harm surfaces:

1. **Audit gaming** — can a crafted role description produce a reassuring
   score for a genuinely exposed role?
2. **Advice boundary** — can the Financial/Legal agents be steered into
   regulated advice without disclaimers?
3. **Council capture** — can a phrased question suppress Risk/Ethics
   opposition? (Contradiction and dissent records make this measurable.)

Findings feed prompt and weight revisions through normal code review.
