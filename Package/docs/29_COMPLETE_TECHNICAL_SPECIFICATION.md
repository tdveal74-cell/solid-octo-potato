# 29 — COMPLETE TECHNICAL SPECIFICATION

Single source of truth for the platform's technical shape. Where this document
and the code disagree, the code is right and this document has a bug.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript (strict) |
| Styling | Tailwind CSS v4 (brand tokens in `src/app/globals.css`) |
| AI | Anthropic SDK — primary `claude-opus-4-8`, utility `claude-haiku-4-5` (overridable via `QO_MODEL_*`) |
| Data | Postgres 15+ / Supabase, pgvector for embeddings, RLS everywhere |
| Payments | Stripe (subscriptions: operator / operator-pro / enterprise) |
| Automation | n8n (webhook-driven; see Automation OS doc) |
| Tests | Vitest — deterministic engines are fully unit-tested |

## Repository layout

```text
src/
  app/                      # Next.js App Router
    page.tsx                # Landing (brand + system overview)
    dashboard/page.tsx      # System status + entry points
    council/page.tsx        # Live Council deliberation UI
    audit/page.tsx          # Job Security Audit UI
    api/
      health/route.ts               # GET  — system status
      agents/route.ts               # GET  — agent catalog
      orchestrate/route.ts          # POST — route + execute + optional Council review
      council/deliberate/route.ts   # POST — full deliberation
      career/audit/route.ts         # POST — deterministic audit (+ optional roadmap)
  lib/
    ai/client.ts            # Anthropic client factory + model tiers
    council/                # META SUPREME X Council (docs 26–27)
    agents/                 # 12-agent registry + deterministic router
    orchestrator/           # Central routing/execution/escalation layer
    career/                 # Audit scoring engine + roadmap generation
    knowledge/              # RAG core (chunking, vector store seam, grounded answers)
    db/schema.sql           # Full Postgres/Supabase schema
tests/                      # Vitest suites for all deterministic engines
Package/docs/               # Build package documents (this set: 26–30)
```

## API contract

### `POST /api/council/deliberate`
Request: `{ question: string, context?, councils?: CouncilId[], debate?: boolean }`
Response: `DeliberationResult` — phase1/phase2 verdicts, consensus report
(support `score`, `agreement`, `band`, contradictions, aggregate risk), final
recommendation, elapsedMs.
Errors: 400 invalid body, 503 AI unconfigured, 500 deliberation failure.

### `POST /api/orchestrate`
Request: `{ input: string, agentId?, memory?: string[], councilReview?: boolean }`
Routing: keyword pass (zero-cost) → utility-model classification when
confidence < 0.5 → explicit `agentId` bypasses both.
Response: `{ agentId, route, status, output, council | null }`.
Council gate: for reviewed outputs, a `reject`/`revise` recommendation sets
`status: "held"` and replaces `output` with a hold notice (the raw text is
withheld); the `council` payload carries the rationale. Approved or unreviewed
outputs return `status: "delivered"` with the agent text.

### `POST /api/career/audit`
Request: role/profile + `tasks[]` (each: name, timeShare, five 0–10 factors).
The audit itself is deterministic and requires no API key; `includeRoadmap: true`
adds the model-generated roadmap when AI is configured.
Response: `{ audit: AuditResult, roadmap: CareerRoadmap | null }`.

### `GET /api/agents`, `GET /api/health`
Catalog and status; no auth required.

## Model-call conventions

- Structured outputs via `output_config.format` (Zod schemas through
  `zodOutputFormat`); every parse failure is an explicit thrown error, never a
  silent fallback.
- Adaptive thinking (`thinking: {type: "adaptive"}`) on all primary-model calls.
- Streaming (`messages.stream` + `finalMessage()`) for long-form agent output.
- Parallel fan-out for council seats (`Promise.all`); a full deliberation is
  17 calls in 3 sequential waves.

## Data model (summary)

`organizations`, `profiles`, `subscriptions` (identity/billing) ·
`job_security_audits`, `career_roadmaps` (career platform) ·
`deliberations`, `agent_runs`, `user_memories` (intelligence system) ·
`knowledge_documents`, `knowledge_chunks` + `match_chunks()` (RAG) ·
`content_pieces` (content OS) · `audit_log` (security).
Full DDL: `src/lib/db/schema.sql`.

## Environment

See `.env.example`. The app boots and serves all deterministic surfaces
(landing, dashboard, audit scoring) with **no** secrets configured; AI routes
degrade to 503/warnings rather than crashing.

## Quality gates

```text
npm run typecheck   # strict TS, no emit
npm run test        # vitest — deterministic engines
npm run build       # production build must pass
```
