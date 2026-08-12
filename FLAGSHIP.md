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

## Visual system

The brand tokens are the only source of colour, type, and radius. They live in
`src/app/globals.css` under `@theme`; the components that consume them live in
`src/components/ui/primitives.tsx`.

| Rule | Why |
|---|---|
| **Brass is the accent, and it is scarce** | It marks the one thing that matters in a view — the primary action, the live signal, the human gate. A surface that uses brass everywhere has used it nowhere |
| **No hardcoded colour** | A hex in a component is drift waiting to happen. The pricing page carried `#c9a86a` against a brand brass of `#c9a96a` — one digit off, invisible in review, wrong on screen |
| **One radius** | `rounded-sm` throughout. A page reaching for `rounded-2xl` has left the system |
| **One container** | `Page` sets max width and gutter. Three different `max-w-` values across five routes is three different products |
| **Figures are fog; signals are coloured** | A number that is always brass tells the reader nothing. Colour a value only when its value is the message — a risk severity, a failing score |

Every route composes from the primitives: `Page`, `Section`, `Card`, `Grid`,
`Heading`, `Lede`, `Eyebrow`, `Meta`, `Badge`, `Button`, `Input`, `Stat`,
`Empty`. A page that needs a new shape earns a new primitive rather than a local
one-off — a local `StatCard` and a local `Metric` are how two pages start
disagreeing about what a figure looks like.

## Hardware

`HARDWARE.md` — reference classes for the render worker, the serverless limits
that behave like hardware, and 3-2-1 retention for masters. The short version:
the app needs no particular machine, the render worker needs hardware video
encode, and no render ever happens on the request path.

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
