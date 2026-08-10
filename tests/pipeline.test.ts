import { describe, expect, it } from "vitest";
import {
  canTransition,
  assertTransition,
  formatPackagingBlock,
  PIPELINE_STATUSES,
  buildScriptSystemPrompt,
  DEFAULT_AUDIT_LANDING_URL,
} from "../src/lib/content/pipeline";

describe("content pipeline status machine", () => {
  it("allows the happy path Idea → Scripted → Queued → Rendering → Ready → Published", () => {
    expect(canTransition("Idea", "Scripted")).toBe(true);
    expect(canTransition("Scripted", "Queued")).toBe(true);
    expect(canTransition("Queued", "Rendering")).toBe(true);
    expect(canTransition("Rendering", "Ready")).toBe(true);
    expect(canTransition("Ready", "Published")).toBe(true);
  });

  it("rejects skipping stages and reverse-publishing", () => {
    expect(canTransition("Idea", "Ready")).toBe(false);
    expect(canTransition("Published", "Ready")).toBe(false);
    expect(canTransition("Queued", "Published")).toBe(false);
  });

  it("assertTransition throws on illegal moves", () => {
    expect(() => assertTransition("Idea", "Published")).toThrow(/Illegal/);
  });

  it("exposes a complete status catalog", () => {
    expect(PIPELINE_STATUSES).toContain("Idea");
    expect(PIPELINE_STATUSES).toContain("Published");
    expect(PIPELINE_STATUSES).toContain("Escalated");
  });
});

describe("script + packaging helpers", () => {
  it("embeds the audit landing URL in the script system prompt", () => {
    const prompt = buildScriptSystemPrompt("https://example.com/audit");
    expect(prompt).toContain("https://example.com/audit");
    expect(prompt).toContain("The Quiet Operator");
    expect(prompt).toContain("anti-hype");
  });

  it("uses the default audit URL when none is provided", () => {
    const prompt = buildScriptSystemPrompt();
    expect(prompt).toContain(DEFAULT_AUDIT_LANDING_URL);
  });

  it("formats packaging into the Airtable long-text block shape", () => {
    const block = formatPackagingBlock({
      youtube_tags: "ai jobs, mid career",
      pinned_comment: "What would you protect first?",
      tiktok_caption: "Quiet moves. #ai",
      instagram_caption: "Line one\nLine two",
      facebook_caption: "A short paragraph.",
      x_post: "Under 280.",
      thumbnail_text: "STILL TIME",
    });
    expect(block).toContain("YOUTUBE TAGS");
    expect(block).toContain("THUMBNAIL TEXT");
    expect(block).toContain("STILL TIME");
  });
});
