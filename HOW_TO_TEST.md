# How to Test — The Quiet Operator (solid-octo-potato)

This product is the furthest along. You can test it **today** offline.

## 1. Install and run

```bash
git clone https://github.com/tdveal74-cell/solid-octo-potato.git
cd solid-octo-potato
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live Council
npm run dev
```

Open **http://localhost:3000**

## 2. Quality gates (must pass)

```bash
npm run typecheck
npm run test
npm run build
```

## 3. What works with zero API keys

| Surface | URL | Notes |
|---------|-----|-------|
| Landing | `/` | Full brand + council overview |
| Job Security Audit | `/audit` | Deterministic engine — fully offline |
| Dashboard | `/dashboard` | Shell |
| Council UI | `/council` | UI loads; live deliberation needs key |
| Content Pipeline board | `/content` | Status contract + n8n alignment |
| Health | `/api/health` | Status JSON |
| Agents catalog | `/api/agents` | 12 agents |
| Pipeline contract | `/api/content/pipeline` | Status machine JSON |

## 4. What needs `ANTHROPIC_API_KEY`

- `POST /api/council/deliberate`
- `POST /api/orchestrate`
- Optional AI roadmap on career audit

Without the key, those routes degrade gracefully (app still boots).

## 5. Content pipeline (production)

Live automation is **n8n**, not this repo:

- Drive: `TQO-Content-Pipeline.json`
- Drive: `TQO - Platform Packaging Pipeline.json`
- Airtable statuses: Idea → Scripted → Queued → Rendering → Ready → Published
- Human checkpoint before Published (never automatic)

In-app module `src/lib/content/pipeline.ts` mirrors that contract so the product and automation stay aligned.

## 6. Deploy (optional)

```bash
# Connect the GitHub repo to Vercel, or:
npx vercel --prod
```

Set `NEXT_PUBLIC_AUDIT_URL` if you want a different Job Security Audit CTA URL in scripts.
