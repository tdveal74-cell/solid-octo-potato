/**
 * TQO Content Pipeline — canonical status machine and types.
 *
 * Aligned with the live n8n workflows in Drive:
 *   - TQO-Content-Pipeline.json
 *   - TQO - Platform Packaging Pipeline.json
 *
 * Status progression (Airtable):
 *   Idea → Scripted → Queued → Rendering → Ready → Published
 *
 * Side states: Correcting, Escalated
 *
 * The n8n engine remains the production renderer (ElevenLabs + JSON2Video).
 * This module is the in-app source of truth for status rules, script contracts,
 * and packaging shape so the platform and the automation never drift.
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
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

/** Legal transitions. Anything else is rejected. */
export const STATUS_TRANSITIONS: Record<PipelineStatus, readonly PipelineStatus[]> = {
  Idea: ["Scripted", "Escalated"],
  Scripted: ["Queued", "Correcting", "Escalated"],
  Queued: ["Rendering", "Scripted", "Escalated"],
  Rendering: ["Ready", "Correcting", "Escalated"],
  Ready: ["Published", "Correcting"],
  Published: [],
  Correcting: ["Scripted", "Queued", "Escalated"],
  Escalated: ["Idea", "Scripted"],
};

export function canTransition(from: PipelineStatus, to: PipelineStatus): boolean {
  return (STATUS_TRANSITIONS[from] ?? []).includes(to);
}

export function assertTransition(from: PipelineStatus, to: PipelineStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal pipeline transition: ${from} → ${to}`);
  }
}

export interface ContentPiece {
  id: string;
  topic: string;
  status: PipelineStatus;
  videoTitle?: string;
  script?: string;
  description?: string;
  tags?: string;
  platformPackaging?: string;
  audioUrl?: string;
  videoUrl?: string;
  channel?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScriptOutput {
  title: string;
  script: string;
  description: string;
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

/** Default Job Security Audit landing used in script descriptions. */
export const DEFAULT_AUDIT_LANDING_URL =
  process.env.NEXT_PUBLIC_AUDIT_URL ?? "https://jobsecurtityaudit.netlify.app/";

/**
 * System prompt for the TQO script writer.
 * Mirrors the n8n "Build Script Prompt" node voice contract.
 */
export function buildScriptSystemPrompt(landingUrl: string = DEFAULT_AUDIT_LANDING_URL): string {
  return `You are the script writer for The Quiet Operator, a faceless YouTube channel for mid-career professionals (35-50) who sense AI moving toward their jobs and want to quietly build income and leverage before they need it.

Voice: calm, precise, anti-hype, proof-driven, quietly confident. Never fear-monger, never use hype or clickbait, never sound robotic or breathless. Premium and understated — every line earns its place. No filler, no "in today's fast-paced world," no "like and subscribe."

For the given Topic, produce:

1. title — under 60 characters, specific and intriguing without clickbait, in the calm brand voice.

2. script — a long-form spoken narration of 360–420 words, target 390. Hard ceiling 420 words. Single narrator, natural spoken rhythm, no on-screen directions or headings. Structure for retention: a sharp hook in the first 15 seconds that names a real tension and promises what is coming; then 4 to 6 distinct sections, each making one clear point backed by a concrete example, a number, a mini-story, or a proof point, with smooth spoken transitions; at least one specific action the viewer can take; and a calm, resonant close that lands the core idea. Depth, not padding.

3. description — 2 to 3 sentences on the video's value, then this exact line on its own:
Free Job Security Audit - see how exposed your role really is: ${landingUrl}

Return ONLY a valid JSON object, no markdown fences, no commentary, in exactly this shape: {"title": "...", "script": "...", "description": "..."}`;
}

export function buildPackagingSystemPrompt(): string {
  return [
    "You write platform packaging for The Quiet Operator, a faceless YouTube channel for mid-career professionals (35-50) quietly building income and leverage before AI reaches their jobs.",
    "Voice: calm, precise, proof-driven, anti-hype. No exclamation marks, no clickbait, no emojis.",
    "Return ONLY a valid JSON object. No markdown fences, no commentary. Exactly these keys:",
    "{",
    '"youtube_tags":"12-18 comma-separated SEO tags",',
    '"pinned_comment":"1-2 sentences inviting discussion + Free Job Security Audit mention",',
    '"tiktok_caption":"under 150 chars, 3-5 hashtags",',
    '"instagram_caption":"2-3 short lines, 5-8 hashtags",',
    '"facebook_caption":"1-2 short paragraphs",',
    '"x_post":"under 280 chars, no hashtags",',
    '"thumbnail_text":"3-5 words, high contrast concept"',
    "}",
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

/** Pipeline stages the in-app UI can show without calling external services. */
export const PIPELINE_STAGES = [
  { status: "Idea" as const, label: "Idea", owner: "Human / capture" },
  { status: "Scripted" as const, label: "Scripted", owner: "Claude (n8n daily 6am)" },
  { status: "Queued" as const, label: "Queued", owner: "n8n Mon/Wed/Fri promote" },
  { status: "Rendering" as const, label: "Rendering", owner: "ElevenLabs + JSON2Video" },
  { status: "Ready" as const, label: "Ready to publish", owner: "Human checkpoint" },
  { status: "Published" as const, label: "Published", owner: "Human / publisher" },
] as const;
