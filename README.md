# The Quiet Operator

**AI Intelligence Operating System** — career intelligence, content operations,
and decision-grade analysis, deliberated by the **META SUPREME X Council**.

> Loud tools make noise. Quiet operators make moves.

## What this is

Not a chatbot. Every consequential answer runs through an eight-seat council
(Research, Strategy, Logic, Creative, Risk, Quality, Ethics & Safety,
Enterprise) that analyzes independently, debates, and surfaces its
disagreements — scored by a deterministic consensus engine — before a Supreme
Orchestrator issues one recommendation with dissent preserved.

Around that core:

- **12-agent network** — research, career, job-security audit, strategy,
  content, video scripts, QC, enterprise intelligence, customer success,
  automation, financial analysis, legal/compliance. High-stakes agents are
  Council-reviewed automatically.
- **Career Intelligence Platform** — a deterministic, task-level AI-exposure
  scoring engine (Job Security Audit) with model-generated roadmaps on top.
- **Knowledge Engine** — RAG core with source grading, pluggable vector
  store (pgvector schema included), and grounded, cited answers.
- **SaaS foundation** — full Postgres/Supabase schema (orgs, profiles,
  subscriptions, audit log, RLS), Stripe-ready tiers, n8n automation hooks.

## Quick start

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for AI features
npm run dev                  # http://localhost:3000
```

The app boots with zero secrets: landing, dashboard, and the deterministic
Job Security Audit all work offline. AI surfaces (Council, roadmaps,
orchestration) activate when `ANTHROPIC_API_KEY` is set.

## Quality gates

```bash
npm run typecheck && npm run test && npm run build
```

## Key endpoints

| Route | Purpose |
|---|---|
| `POST /api/council/deliberate` | Full two-phase Council deliberation |
| `POST /api/orchestrate` | Route → agent → optional Council review |
| `POST /api/career/audit` | Deterministic audit (+ optional roadmap) |
| `GET /api/agents` · `GET /api/health` | Catalog and status |

## Documentation

- `Package/docs/26_META_SUPREME_X_COUNCIL_ARCHITECTURE.md`
- `Package/docs/27_COUNCIL_DECISION_ENGINE.md`
- `Package/docs/28_AI_SAFETY_AND_ALIGNMENT_FRAMEWORK.md`
- `Package/docs/29_COMPLETE_TECHNICAL_SPECIFICATION.md`
- `Package/docs/30_CLAUDE_CODE_IMPLEMENTATION_ROADMAP.md`
- `CLAUDE.md` — engineering conventions
