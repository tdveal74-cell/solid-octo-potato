# Hardware Standard — The Quiet Operator

**Updated:** 2026-08-12

Reference classes, not shopping lists. A class is defined by what it must be able
to finish without the operator waiting on it; specific parts age out, the
obligation does not.

The Quiet Operator has two hardware surfaces with genuinely different demands:
the **app**, which is near-free to run, and the **render worker**, which is the
only part that needs real silicon.

---

## 1. Production (the app)

Next.js on Vercel serverless. There is no machine to specify, but there are
limits that behave like hardware and will bite the same way.

| Constraint | Reality | What it means here |
|---|---|---|
| Function memory | 1–3 GB per invocation | Council deliberation holds eight verdicts in memory; fine, but do not buffer video |
| Function duration | 60s default, 300s max on Pro | **A full eight-council deliberation with a debate round can exceed 60s** |
| Filesystem | read-only except `/tmp`, ephemeral | Never write state to disk; nothing survives the invocation |
| Cold start | ~200–800ms | Acceptable for a considered tool; do not chase it with warming hacks |

The duration limit is the one that matters. A two-phase deliberation across
eight councils is a sequence of model calls, and the wall-clock is the sum. If a
deliberation times out in production, the fix is to move it off the request
path — a job record the client polls — not to trim councils to fit the clock.
Deciding faster by consulting less is precisely the failure this product exists
to prevent.

## 2. Render worker (content pipeline)

The self-hosted worker that renders TQO/NCO video. This is the class that has to
be bought properly.

| Class | Purpose | Floor |
|---|---|---|
| **Bench** | One video at a time, overnight is acceptable | 8 cores / 16 GB / 512 GB NVMe / integrated GPU |
| **Line** | Daily dual-brand cadence without queueing | 12–16 cores / 32 GB / 1 TB NVMe / GPU with NVENC |
| **Room** | Multiple renders in parallel, no waiting | 24+ cores / 64 GB / 2 TB NVMe / discrete GPU, 8 GB+ VRAM |

**NVENC (or equivalent hardware encode) is the single highest-leverage item.**
H.264/HEVC encode on CPU is where a render sits for most of its wall-clock;
moving it to a hardware encoder typically turns a multi-hour render into
minutes. A machine with more cores and no hardware encoder is the wrong trade.

RAM matters second: 16 GB will render 1080p and thrash on 4K. NVMe over SATA is
worth it during scratch-heavy assembly and irrelevant the rest of the time.

**Audio is not a GPU problem.** ElevenLabs is an API call; Piper TTS fallback
runs on CPU and is comfortable inside the Bench class.

## 3. Operator workstation

Whatever runs a browser. The Job Security Audit scores deterministically in the
request path and the Council runs server-side, so the client does no real work.
A Chromebook is a legitimate operator machine, and this is deliberate: the
product should not require the reader to own anything in particular.

## 4. Storage and retention

3-2-1 for rendered masters, because a lost master is unrecoverable work:

- **3** copies — worker scratch, local archive, offsite
- **2** media types — the archive is not another partition on the render NVMe
- **1** offsite — object storage is fine

Scratch is disposable and should be excluded from backup. Airtable holds pipeline
state, not media; a full Airtable export is a small file and belongs in the same
retention schedule.

## 5. What this standard refuses

- **No GPU requirement for the app.** If a code path needs one to serve a page,
  that path is wrong.
- **No render on the request path.** Rendering is a worker job, always.
- **No SKUs.** A class is a floor to hit, not a part number to match.
