# The Quiet Operator — engineering guide

AI intelligence operating system built on the META SUPREME X Council.
Stack: Next.js 15 (App Router) + React 19 + TypeScript strict + Tailwind v4 +
Anthropic SDK + Supabase/Postgres (pgvector).

## Commands

- `npm run dev` — dev server
- `npm run typecheck` — strict TS check (run before committing)
- `npm run test` — vitest suites for the deterministic engines
- `npm run build` — production build (must pass before pushing)

## Architecture map

- `src/lib/council/` — the Council. `consensus.ts` is pure math (unit-tested,
  keep it model-free); `engine.ts` is the only file that calls the API here.
- `src/lib/agents/` — 12-agent registry + deterministic keyword router.
- `src/lib/orchestrator/` — routing → execution → Council escalation.
- `src/lib/career/` — `audit.ts` is deterministic scoring (keep pure);
  `roadmap.ts` is the model layer on top.
- `src/lib/knowledge/` — RAG core; `VectorStore`/`Embedder` are the seams for
  production stores.
- `src/lib/db/schema.sql` — full schema; apply with psql/Supabase.
- `Package/docs/` — build-package documents 26–30 (architecture specs).

## Conventions

- Model calls: primary `claude-opus-4-8`, utility `claude-haiku-4-5`
  (via `MODELS` in `src/lib/ai/client.ts`; never hardcode model ids elsewhere).
- Adaptive thinking on all primary calls; structured outputs via
  `zodOutputFormat`; throw on parse failure — no silent fallbacks.
- Deterministic engines (consensus math, audit scoring, router, chunker) stay
  pure and fully unit-tested; model calls live at the edges.
- The app must boot and serve all deterministic surfaces with no env secrets;
  AI routes return 503/warnings instead of crashing.
- Agents that produce high-stakes output set `escalateToCouncil: true`.
