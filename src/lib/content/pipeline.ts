/**
 * TQO Content Pipeline — canonical status machine and contracts.
 *
 * Source of truth: n8n workflow **TQO FINAL V5**
 *   id: gsGJQan7a6ZufhYt
 *   nodes: 209 (198 functional + 11 sticky notes)
 *   active: true
 *   timezone: America/New_York
 *
 * Dual brand:
 *   - The Quiet Operator  (table tblx5CcNguOypBjLI)
 *   - NCO Forge           (table tblhtxvB7xouDKpww)
 *   Airtable base: app28z7XnKzjfTXwc
 *
 * Status progression (Airtable):
 *   Idea → Scripted → Queued → Rendering → Ready → Published
 *
 * Side / control states: Correcting, Escalated, Error, Scripting, In progress
 *
 * Production render path (V5):
 *   Voice Router → ElevenLabs Tee Clone (preferred) | Piper TTS free fallback
 *   → Drive upload → Make public → Plan B-Roll + Pexels → Build Movie
 *   → self-hosted render worker (129.80.78.29:8080) → Drive Ready folder
 *   → Human Review gate (never auto-ticked) → OS 28 publish gate → YouTube
 *
 * This module is the in-app source of truth so the Next.js platform and the
 * n8n automation never drift on status rules, script contracts, or packaging.
 */

export const PIPELINE_STATUSES = [
  "Idea",
  "Scripted",
  "Queued",
  "Rendering",
  "Ready",
  "Published",
  "Correcting",
  "Escalated",
  "Error",
  "Scripting",
  "In progress",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

/** Legal transitions. Anything else is rejected. */
export const STATUS_TRANSITIONS: Record<PipelineStatus, readonly PipelineStatus[]> = {
  Idea: ["Scripted", "Scripting", "Escalated"],
  Scripting: ["Scripted", "Escalated", "Error"],
  Scripted: ["Queued", "Correcting", "Escalated"],
  Queued: ["Rendering", "Scripted", "Escalated", "Error"],
  Rendering: ["Ready", "Queued", "Correcting", "Escalated", "Error"], // V5 releases claim → Queued on fail
  Ready: ["Published", "Correcting"],
  Published: [],
  Correcting: ["Scripted", "Queued", "Escalated"],
  Escalated: ["Idea", "Scripted"],
  Error: ["Queued", "Scripted", "Idea"],
  "In progress": ["Scripted", "Queued", "Ready", "Error"],
};

export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: PipelineStatus, to: PipelineStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal pipeline transition: ${from} → ${to}`);
  }
}

// ── Brands ──────────────────────────────────────────────────────────────

export type BrandId = "tqo" | "nco";

export interface BrandContext {
  id: BrandId;
  show: "TQO" | "NCO";
  channel: string;
  tableId: string;
  tagline: string;
  tagline2?: string;
  requiredTags?: string[];
  /** Thumbnail headline word ceiling (brand spec). */
  thumbnailWordCap: number;
}

/** Airtable base shared by both brands. */
export const AIRTABLE_BASE_ID = "app28z7XnKzjfTXwc";

export const BRANDS: Record<BrandId, BrandContext> = {
  tqo: {
    id: "tqo",
    show: "TQO",
    channel: "The Quiet Operator",
    tableId: "tblx5CcNguOypBjLI",
    tagline: "Intelligence for Staying Valuable in the AI Economy.",
    tagline2: "Leverage for the people the AI economy is quietly repricing.",
    thumbnailWordCap: 5,
  },
  nco: {
    id: "nco",
    show: "NCO",
    channel: "NCO Forge",
    tableId: "tblhtxvB7xouDKpww",
    tagline: "Leaders aren't born. They're forged.",
    tagline2: "Military Mindset. Civilian Impact.",
    requiredTags: ["NCO Forge"],
    thumbnailWordCap: 4,
  },
};

// ── Content piece ───────────────────────────────────────────────────────

export interface ContentPiece {
  id: string;
  topic: string;
  status: PipelineStatus;
  brand?: BrandId;
  channel?: string;
  videoTitle?: string;
  script?: string;
  description?: string;
  tags?: string;
  brollKeywords?: string;
  platformPackaging?: string;
  audioUrl?: string;
  videoUrl?: string;
  systemStatus?: string;
  lastFeedback?: string;
  rubricAverage?: number;
  correctionAttempts?: number;
  humanReview?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptOutput {
  title: string;
  script: string;
  description: string;
  /** 8–12 concrete visual search phrases, one per major section, in order. */
  broll: string[];
  tags?: string;
}

export interface PackagingOutput {
  youtube_tags: string;
  pinned_comment: string;
  tiktok_caption: string;
  instagram_caption: string;
  facebook_caption: string;
  x_post: string;
  thumbnail_text: string;
}

/** Corrected landing URL (V5). Old misspelling jobsecurtity is retired. */
export const DEFAULT_AUDIT_LANDING_URL =
  process.env.NEXT_PUBLIC_AUDIT_URL ?? "https://jobsecurityaudit.netlify.app/";

// ── Script system prompts (mirror V5 Build Script Prompt) ───────────────

export function buildScriptSystemPrompt(
  brand: BrandId = "tqo",
  landingUrl: string = DEFAULT_AUDIT_LANDING_URL
): string {
  const ctx = BRANDS[brand];

  if (brand === "nco") {
    return `You are the script writer for NCO Forge — ${ctx.tagline} ${ctx.tagline2 ?? ""} The mission: bridging military and civilian life for today's warfighter. Real-world skills, fitness, mindset, finance and career strategy to dominate in uniform and win in life.

Voice: a seasoned NCO talking to their people. Direct, practical, respectful of service. No ego, no theory for theory's sake, no fear-mongering, no hype. Concrete examples over abstract principles, always. No stolen-valor specifics.

Audience: service members still in uniform, those 6-24 months from separation, recent veterans finding their footing, and families riding the transition with them.

THE HOOK IS EVERYTHING — first 10-15 seconds. Open on the single most specific number, standard, or hard-learned lesson in the topic.

THE FIVE PILLARS — pick the one this topic belongs to and stay in it:
1. Military Foundation  2. Transition Blueprint  3. Financial Freedom
4. Physical & Mental Edge  5. Life After Service

For the given Topic, produce:
1. title — under 60 characters, primary keyword, specific, no clickbait.
2. script — 1200-2000 words spoken narration, target 1600, hard floor 1200. Single narrator. Hook in first 10-15s; 8-12 sections with concrete proof; one action today; calm close.
3. description — 2-3 sentences leading with primary keyword, then this exact line:
NCO Forge — ${ctx.tagline}
4. broll — 8-12 short visual search phrases (2-4 words), one per major section, IN ORDER. Archival and training footage only where military — never phrases that fetch realistic combat violence.

Return ONLY valid JSON: {"title":"...","script":"...","description":"...","broll":["..."]}`;
  }

  return `You are the script writer for The Quiet Operator — ${ctx.tagline} ${ctx.tagline2 ?? ""} A faceless YouTube channel for mid-career professionals (35-50) who sense AI moving toward their jobs and want to quietly build income and leverage before they need it.

Voice: calm, precise, anti-hype, proof-driven, quietly confident. Never fear-monger, never use hype or clickbait, never sound robotic or breathless. Premium and understated — every line earns its place.

THE HOOK IS EVERYTHING. First 10-15 seconds. Open on the single most specific claim, number, or tension. Calm is the weapon.

BEAT STRUCTURE: HOOK (first 3s) → VALUE (promise) → PROOF (receipts) → CTA (one quiet call).

Formats: LISTICLE / NEGATIVE-STOP / TUTORIAL / CONTRARIAN-REFRAME / RECEIPT-STORY. Pick one.

For the given Topic, produce:
1. title — under 60 characters, primary keyword, calm brand voice.
2. script — 1200-2000 words, target 1600, hard floor 1200. Single narrator. 8-12 sections. One action today. Close with one comment-worthy question and the free audit.
3. description — 2-3 sentences leading with primary keyword, then this exact line:
Free Job Security Audit - see how exposed your role really is: ${landingUrl}
4. broll — 8-12 short visual search phrases (2-4 words each), one per major section, IN ORDER. Concrete person, object, or place — never abstract.

Return ONLY valid JSON: {"title":"...","script":"...","description":"...","broll":["..."]}`;
}

export function buildPackagingSystemPrompt(brand: BrandId = "tqo"): string {
  const ctx = BRANDS[brand];
  if (brand === "nco") {
    return [
      `You write platform packaging for ${ctx.channel}. ${ctx.tagline}`,
      "Voice: direct, practical, respectful of service. Doctrine, then reality, then judgment.",
      "youtube_tags MUST contain the exact tag: NCO Forge",
      "Return ONLY a valid JSON object with keys: youtube_tags, pinned_comment, tiktok_caption, instagram_caption, facebook_caption, x_post, thumbnail_text.",
    ].join("\n");
  }
  return [
    `You write platform packaging for ${ctx.channel}. ${ctx.tagline}`,
    "Voice: calm, precise, proof-driven, anti-hype. No exclamation marks, no clickbait, no emojis.",
    "Return ONLY a valid JSON object. Exactly these keys:",
    '"youtube_tags","pinned_comment","tiktok_caption","instagram_caption","facebook_caption","x_post","thumbnail_text"',
  ].join("\n");
}

export function formatPackagingBlock(p: PackagingOutput): string {
  return [
    "YOUTUBE TAGS",
    p.youtube_tags,
    "",
    "PINNED COMMENT",
    p.pinned_comment,
    "",
    "TIKTOK",
    p.tiktok_caption,
    "",
    "INSTAGRAM",
    p.instagram_caption,
    "",
    "FACEBOOK",
    p.facebook_caption,
    "",
    "X",
    p.x_post,
    "",
    "THUMBNAIL TEXT",
    p.thumbnail_text,
  ].join("\n");
}

// ── Pipeline stages (UI) ────────────────────────────────────────────────

export const PIPELINE_STAGES = [
  { status: "Idea" as const, label: "Idea", owner: "Human / audience signals / winner re-expansion" },
  { status: "Scripted" as const, label: "Scripted", owner: "Claude + Script Doctor + Originality Scan" },
  { status: "Queued" as const, label: "Queued", owner: "Promote lane (TQO M/W/F · NCO Tue)" },
  { status: "Rendering" as const, label: "Rendering", owner: "Voice Router → Pexels b-roll → self-hosted worker" },
  { status: "Ready" as const, label: "Ready", owner: "Human Review (manual tick required)" },
  { status: "Published" as const, label: "Published", owner: "OS 28 gate → YouTube · packaging · shorts" },
] as const;

// ── V5 workflow reference ───────────────────────────────────────────────

export const N8N_WORKFLOW = {
  name: "TQO FINAL V5",
  id: "gsGJQan7a6ZufhYt",
  nodes: 209,
  functionalNodes: 198,
  stickyNotes: 11,
  active: true,
  timezone: "America/New_York",
  baseId: AIRTABLE_BASE_ID,
} as const;

/** Production service endpoints referenced by V5 (no secrets). */
export const PIPELINE_SERVICES = {
  piperTts: "http://150.136.200.85/tts",
  renderWorker: "http://129.80.78.29:8080/v2/movies",
  musicBase: "http://150.136.200.85/music/",
  auditLanding: DEFAULT_AUDIT_LANDING_URL,
} as const;

/** Cron / webhook surface of V5. */
export const PIPELINE_TRIGGERS = {
  schedules: [
    { name: "Daily 6am - Script Writer", brand: "tqo", cron: "0 6 * * *" },
    { name: "NCO: Daily 6:30am - Script Writer", brand: "nco", cron: "30 6 * * *" },
    { name: "Mon/Wed/Fri 7am - Promote", brand: "tqo", cron: "0 7 * * 1,3,5" },
    { name: "NCO: Tuesday 7:30am - Promote", brand: "nco", cron: "30 7 * * 2" },
    { name: "Schedule 1 Hour Trigger (Render)", brand: "tqo", cron: "0 * * * *" },
    { name: "NCO: Hourly :30 - Render", brand: "nco", cron: "30 * * * *" },
    { name: "Every 2h - Finish & Publish", brand: "tqo", cron: "0 */2 * * *" },
    { name: "NCO: Odd Hours - Publish", brand: "nco", cron: "0 1-23/2 * * *" },
    { name: "Sunday 9am - Quiet Brief", brand: "tqo", cron: "0 9 * * 0" },
    { name: "NCO: Sunday 10am - Forge Brief", brand: "nco", cron: "0 10 * * 0" },
    { name: "Analytics: Daily 5am", brand: "both", cron: "0 5 * * *" },
    { name: "Repurpose: Every 30m", brand: "both", cron: "*/30 * * * *" },
  ],
  webhooks: [
    { name: "▶ Run All (Webhook)", path: "/webhook/run-tqo-pipeline", method: "POST" },
    { name: "▶ Run All (Webhook NCO)", path: "/webhook/run-nco-pipeline", method: "POST" },
    { name: "▶ Run TQO (Link)", path: "/webhook/run-tqo", method: "GET" },
    { name: "▶ Run NCO (Link)", path: "/webhook/run-nco", method: "GET" },
    { name: "⏸ SYSTEM PAUSE", path: "/webhook/system-pause", method: "GET" },
    { name: "▶ SYSTEM RESUME", path: "/webhook/system-resume", method: "GET" },
    { name: "Gumroad Ping (Sale)", path: "/webhook/gumroad-sale", method: "POST" },
  ],
} as const;
