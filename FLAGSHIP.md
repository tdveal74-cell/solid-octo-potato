# The Quiet Operator — Flagship Standard

**Live:** https://quiet-operator.vercel.app  
**Updated:** 2026-08-10

## What flagship means here

| Pillar | Standard |
|--------|----------|
| Identity | Intelligence OS — not a chatbot |
| Council | Multi-seat deliberation; dissent preserved |
| Career | Deterministic Job Security Audit (works offline) |
| Content | TQO FINAL V5 contract (209 nodes, dual-brand) |
| Safety | Simulated/AI output never silent about provenance |
| Deploy | Production on Vercel with health + AI config flag |

## Live verification

```bash
curl -s https://quiet-operator.vercel.app/api/health
```

Expect `ok: true`, `contentPipeline.workflow: "TQO FINAL V5"`, `nodes: 209`.
With `ANTHROPIC_API_KEY` set: `aiConfigured: true`.

## Product surfaces

| Surface | Flagship bar |
|---------|----------------|
| Landing | Quiet Operator positioning |
| Dashboard | Operator home |
| Council | Deliberation path |
| Job Security Audit | Deterministic scores + optional AI roadmap |
| Content board | V5 status machine · TQO + NCO |
| Agents catalog | 12-agent network |
| `/api/health` | System truth |

## Quality gates

```bash
npm run typecheck && npm run test && npm run build
```

## Content pipeline (locked to production n8n)

- Workflow: **TQO FINAL V5**
- Nodes: **209**
- Brands: The Quiet Operator · NCO Forge
- Human review required before publish

Contracts: `src/lib/content/pipeline.ts` · map: `docs/n8n/TQO_FINAL_V5.md`

## Next flagship increments (optional)

- Custom domain
- Stripe live checkout
- Supabase-backed content board rows
- Auth for multi-operator orgs
