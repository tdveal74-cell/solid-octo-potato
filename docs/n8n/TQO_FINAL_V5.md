# TQO FINAL V5 — n8n Pipeline Map

**Workflow:** TQO FINAL V5  
**ID:** `gsGJQan7a6ZufhYt`  
**Nodes:** 209 (198 functional · 11 sticky notes)  
**Active:** true  
**Timezone:** America/New_York  
**Synced into repo:** 2026-08-10

This document is the in-repo mirror of the live n8n workflow so the Next.js
platform (`src/lib/content/pipeline.ts`) and the automation never drift.

---

## Dual brand

| Brand | Channel | Airtable table | Script cron | Promote | Render | Publish |
|-------|---------|----------------|-------------|---------|--------|---------|
| TQO | The Quiet Operator | `tblx5CcNguOypBjLI` | Daily 06:00 | Mon/Wed/Fri 07:00 | Hourly :00 | Every 2h |
| NCO | NCO Forge | `tblhtxvB7xouDKpww` | Daily 06:30 | Tue 07:30 | Hourly :30 | Odd hours |

Shared base: `app28z7XnKzjfTXwc`

Show Context nodes inject brand, tableId, taglines, limits, and voice flags
before every lane. Carousel gates + pause gates sit in front of each lane.

---

## Status machine

```
Idea → Scripted → Queued → Rendering → Ready → Published
```

Side states: `Correcting`, `Escalated`, `Error`, `Scripting`, `In progress`

V5 claim rules:
- Render claims the row (`Status=Rendering` + System Status claim token) **before** the work loop.
- On worker error or poll budget exhaustion, **Render: Release Claim** returns the row to `Queued` (not Error) so the next tick can retry. Failure text is written to Last Feedback.
- **Reaper** sweeps stale Rendering claims (3h window).
- **Human Review** is never auto-ticked. Ready does not mean Published.

---

## Lanes (functional map)

### 1. Script lane
Daily trigger → Show Context: Script → Gate → Get Idea Rows → batch
→ Build Script Prompt (brand-aware, 1200–2000 words, broll array)
→ Token Budget: Script → Write Script (Claude)
→ Parse Script JSON → Build Doctor Prompt → Token Budget: Doctor → Script Doctor
→ Fetch Prior Episodes → Originality Scan
→ Save Script to Airtable → Save Doctor Verdict
→ Script: Fill Run Fields (disclosure, claim validity, thumbnail headline)
→ Script: Write Run Fields → loop

### 2. Promote lane
Cron → Show Context: Promote → Gate → Get Scripted → Promote to Queued

### 3. Render lane
Cron → Show Context: Render → Gate → Reaper + Render Lock (other brand)
→ Anything Still Rendering? → IF Coast Clear → Get Queued (limit 1)
→ Claim Rows → Process Each Video
→ Voice Router: Clone Ready?
  - true → ElevenLabs TTS (Tee Clone), fallback Piper
  - false → Piper TTS (Free) at self-hosted box
→ Upload MP3 → Make Audio Public
→ Plan B-Roll Segments → Pexels Search → Build Movie (POOL_SHARED=false)
→ Start Render (self-hosted worker) → Wait 60s → Ensure Project ID
→ Check Render Status → IF Done / Failed
→ Give Up? (max 75 polls) → Release Claim on fail → Download MP4
→ Upload Video → Mark Ready + Save URL

### 4. Publish lane
Cron → Show Context: Publish → Gate → Get Ready to Publish
→ Preflight → Manifest (Claude) → Offer Engine → Packaging (Claude)
→ Thumb compose → QC (Claude) → OS 28 Publish Gate
→ if cleared: Prep Publish → Share Video → Upload Router (TQO / NCO YouTube)
→ Mark Published
→ parallel: Short Engine, Family IDs, Primitives, Assets, Rules, Publishing matrix, EditForge queue

### 5. Brief lane
Sunday → Show Context: Brief → Get Latest Content → Brief prompt → Claude
→ Assemble Email HTML → Brand Overrides → MailerLite draft (send is optional, disconnected)

### 6. Analytics + signals (daily 05:00)
Fetch published TQO + NCO → YouTube Stats → Performance rows
→ Comments fetch → Classify and Route (deterministic, no model)
→ Signals write → Recurrence check (≥3 same theme → Idea upsert)
→ Winner re-expansion (≥1.5× brand median, ≥7 days old → Idea upsert)

### 7. Repurpose (every 30m)
Due Publishing slots → Plan Drops → Fetch Asset
→ Needs Video? → Find/Download EditForge render → Drop into platform folder
→ or Drop Caption File for text platforms → Mark Handed Off

### 8. Commerce
Gumroad sale webhook → normalise → match offer → dedupe → create customer
→ MailerLite buyer sync → attribute revenue

### 9. Control plane
Manual / webhook Run All (TQO or NCO) · System Pause / Resume · propagate to TSWS 01

---

## Node census

| Type | Count |
|------|------:|
| code | 77 |
| httpRequest | 54 |
| airtable | 15 |
| scheduleTrigger | 12 |
| stickyNote | 11 |
| if | 9 |
| googleDrive | 8 |
| webhook | 7 |
| splitInBatches | 3 |
| noOp | 3 |
| youTube | 2 |
| manualTrigger | 2 |
| executeWorkflow | 2 |
| wait | 1 |
| stopAndError | 1 |
| set | 1 |
| editImage | 1 |
| **Total** | **209** |

---

## Service endpoints (no secrets)

| Role | Endpoint |
|------|----------|
| Piper TTS (free fallback) | `http://150.136.200.85/tts` |
| Music pool | `http://150.136.200.85/music/track{1-5}.mp3` |
| Render worker | `http://129.80.78.29:8080/v2/movies` |
| Job Security Audit CTA | `https://jobsecurityaudit.netlify.app/` |
| Anthropic Messages | `https://api.anthropic.com/v1/messages` |
| Pexels | video search for matched b-roll |
| YouTube Data API | upload + stats + commentThreads |
| MailerLite | draft campaigns |
| Gumroad | sale webhook |

Credentials live only in n8n credential stores. Never in the vault, chat, or repo.

---

## Webhooks

| Path | Method | Purpose |
|------|--------|---------|
| `/webhook/run-tqo-pipeline` | POST | Fire all five TQO lanes |
| `/webhook/run-nco-pipeline` | POST | Fire all five NCO lanes |
| `/webhook/run-tqo` | GET | Browser/bookmark TQO run |
| `/webhook/run-nco` | GET | Browser/bookmark NCO run |
| `/webhook/system-pause` | GET | Global pause flag |
| `/webhook/system-resume` | GET | Clear pause |
| `/webhook/gumroad-sale` | POST | Commerce ingress |

---

## Hard rules carried into the app layer

1. **Human Review is the gate.** Pipeline may set Ready; only a human ticks Human Review before publish.
2. **No auto-publish of the claim release path as success.** Failed render → Queued + Last Feedback.
3. **POOL_SHARED = false.** B-roll is Pexels-matched per segment; pool is retired until verified subject footage exists in the B-Roll Library table.
4. **Script floor 1200 words** (target 1600). Short-form packaging is a separate atomizer, not a truncated flagship.
5. **No em dashes / en dashes** under Tee's name (Devon Canon).
6. **No API keys in repo, memory, or chat** (Devon Canon).
7. **Landing URL is** `https://jobsecurityaudit.netlify.app/` (typo `jobsecurtity` retired).

---

## Related in-repo files

- `src/lib/content/pipeline.ts` — status machine, brands, prompts, triggers
- `src/app/content/page.tsx` — content board UI
- `src/app/api/content/pipeline/route.ts` — API surface
