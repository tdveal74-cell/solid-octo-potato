# 30 — CLAUDE CODE IMPLEMENTATION ROADMAP

Phased plan from the current flagship core to the full platform vision. Each
phase ends in a shippable state with its quality gates green
(`typecheck` + `test` + `build`).

## Phase 0 — Flagship core ✅ (this repository, done)

- Next.js 15 / React 19 / TypeScript strict / Tailwind v4 scaffold
- META SUPREME X Council: 8 seats, two-phase deliberation, deterministic
  consensus/contradiction/risk engine (unit-tested), Supreme Orchestrator
- 12-agent network with deterministic + LLM routing and Council escalation
- Career Intelligence: deterministic Job Security Audit engine + roadmap
- Knowledge Engine core: chunker, vector-store seam, grounded answering
- Full Postgres/Supabase schema with RLS; branded landing, dashboard,
  Council and Audit UIs; docs 26–29

## Phase 1 — Accounts & persistence (1–2 weeks of sessions)

1. Wire Supabase auth (email + OAuth); apply `src/lib/db/schema.sql`
2. Persist audits, roadmaps, deliberations, agent runs to their tables
3. User memory read/write in the orchestrator (backed by `user_memories`)
4. History views on the dashboard
   - Gate: a signed-in user can re-open a past audit and deliberation

## Phase 2 — Knowledge Engine in production

1. Embedding provider adapter (implement `Embedder`) + pgvector store
   (implement `VectorStore` over `match_chunks()`)
2. Document ingestion route (upload → chunk → embed → upsert) with source
   grading at ingest
3. `/api/knowledge/query` — retrieve + `answerWithContext`, citations in UI
   - Gate: a user library answers questions with graded citations

## Phase 3 — Monetization & lifecycle

1. Stripe checkout + webhooks → `subscriptions` (operator / operator-pro /
   enterprise tiers); route-level entitlement checks
2. n8n lifecycle automations: onboarding sequence, audit-complete follow-up,
   weekly intelligence digest (all with human checkpoints per doc 28)
   - Gate: a paying customer exists end-to-end in test mode

## Phase 4 — Content Operating System

1. Content pipeline UI over `content_pieces`: idea → draft (Content /
   Video Script agents) → Quality Control review → scheduled
2. Publishing automation via n8n connectors; EditForge integration point:
   script → voice/visual plan handoff payload
   - Gate: one newsletter and one video script produced, QC-reviewed, and
     exported without leaving the platform

## Phase 5 — Enterprise platform

1. Org onboarding, team invites, admin roles (schema already supports it)
2. Workforce intelligence: batch audits across a team roster, aggregate
   exposure reporting (Enterprise Intelligence agent + Council review)
3. Audit-log surfacing, data-export, SOC 2 evidence collection begins
   - Gate: one org with ≥5 seats and a workforce report

## Phase 6 — Scale

- Mobile (React Native or PWA hardening), public API keys + rate limits,
  agent marketplace (third-party agent definitions validated against the
  registry contract), i18n

## Standing engineering rules

1. Deterministic engines stay pure and tested; model calls stay at the edge.
2. Prompts are code: reviewed, versioned, never runtime-configured.
3. Every new agent declares `escalateToCouncil` explicitly.
4. No feature ships that breaks the no-secrets boot path (the app must
   always run without keys, with AI surfaces degrading gracefully).
5. Irreversible or outward-facing automation steps require a human checkpoint.
