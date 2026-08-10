# How to test — solid-octo-potato (The Quiet Operator)

## Local app

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY for live AI
npm run typecheck && npm run test && npm run build
npm run dev                  # http://localhost:3000
```

Offline without a key: landing, dashboard, deterministic Job Security Audit.
With a key: Council, orchestrate, knowledge, content script helpers.

## Content pipeline (n8n — TQO FINAL V5)

The production content engine is the **active** n8n workflow:

| Field | Value |
|-------|-------|
| Name | TQO FINAL V5 |
| ID | `gsGJQan7a6ZufhYt` |
| Nodes | **209** (198 functional + 11 sticky) |
| Active | true |

In-repo mirror: `docs/n8n/TQO_FINAL_V5.md`  
TypeScript contracts: `src/lib/content/pipeline.ts`

### Smoke checks on the live workflow

1. **Pause is off** — hit `/webhook/system-resume` if unsure.
2. **Script lane (TQO)** — PUT one Idea row in `tblx5CcNguOypBjLI`, wait for 06:00 or POST `/webhook/run-tqo-pipeline`.
3. **Script lane (NCO)** — same on `tblhtxvB7xouDKpww` or POST `/webhook/run-nco-pipeline`.
4. **Render** — row must reach Queued; claim → Voice Router → Pexels → self-hosted worker. Known-good render ~33–41 polls (~34–41 min). Cap is 75.
5. **Human Review** — when Status=Ready, tick Human Review by hand. Nothing publishes without it.
6. **OS 28** — publish gate must clear packaging, QC, disclosure, claim validity.

### What the app layer tests

```bash
npm run test -- src/lib/content
```

Asserts legal status transitions, brand table IDs, and prompt shape.
Does not call n8n or Airtable.

## Deploy

Vercel (or any Next host). Set `ANTHROPIC_API_KEY` in the environment.
Content production remains on n8n + Airtable + the self-hosted render/TTS boxes;
the Next app is the intelligence OS and the contract mirror, not the renderer.
