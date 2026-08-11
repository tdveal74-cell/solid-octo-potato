# REPOSITORY_STATUS — solid-octo-potato / The Quiet Operator

**Updated:** 2026-08-11

| Field | Value |
|-------|--------|
| Product name | **The Quiet Operator (TQO)** |
| Repository name | `solid-octo-potato` (legacy codename — product name is TQO) |
| Canonical runtime | Next.js 15 on Vercel |
| Production URL | https://quiet-operator.vercel.app |
| Health | `GET /api/health` — expect `ok`, `contentPipeline.workflow: TQO FINAL V5`, `nodes: 209` |
| Completion vocabulary | **deployed** + **runtime-validated** (health) · council/career **code-complete** · billing/persistence **scaffold** |
| Required checks | `.github/workflows/ci.yml` (typecheck · test · build) + Vercel production |
| Content contract | TQO FINAL V5 — `src/lib/content/pipeline.ts` · `docs/n8n/TQO_FINAL_V5.md` |
| Known blockers | Actions pass must be visible on exact main SHA; n8n/Airtable not called from unit tests; Stripe/Supabase not live-proven |
| External ops | Live n8n 209-node workflow (ops plane) — separate from repo unit tests |

## Status badges

| Badge | State |
|-------|--------|
| deployed | **yes** (Vercel) |
| AI configured | env-dependent (`aiConfigured` on health) |
| billing live | no |
| persistence live | schema ready, not production-proven |
| n8n contract tested in-repo | fixture/contract only — not live call |
