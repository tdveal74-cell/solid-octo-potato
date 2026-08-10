import { describe, expect, it } from "vitest";
import {
  canTransition,
  assertTransition,
  PIPELINE_STATUSES,
  STATUS_TRANSITIONS,
  BRANDS,
  N8N_WORKFLOW,
  DEFAULT_AUDIT_LANDING_URL,
  buildScriptSystemPrompt,
  buildPackagingSystemPrompt,
} from "../src/lib/content/pipeline";

describe("pipeline status machine", () => {
  it("allows the happy path", () => {
    expect(canTransition("Idea", "Scripted")).toBe(true);
    expect(canTransition("Scripted", "Queued")).toBe(true);
    expect(canTransition("Queued", "Rendering")).toBe(true);
    expect(canTransition("Rendering", "Ready")).toBe(true);
    expect(canTransition("Ready", "Published")).toBe(true);
  });

  it("allows V5 claim release Rendering → Queued", () => {
    expect(canTransition("Rendering", "Queued")).toBe(true);
  });

  it("blocks illegal jumps", () => {
    expect(canTransition("Idea", "Published")).toBe(false);
    expect(canTransition("Published", "Idea")).toBe(false);
    expect(canTransition("Ready", "Queued")).toBe(false);
  });

  it("assertTransition throws on illegal", () => {
    expect(() => assertTransition("Idea", "Ready")).toThrow(/Illegal/);
  });

  it("covers every status in transitions map", () => {
    for (const s of PIPELINE_STATUSES) {
      expect(STATUS_TRANSITIONS[s]).toBeDefined();
    }
  });
});

describe("brands", () => {
  it("defines TQO and NCO with table ids", () => {
    expect(BRANDS.tqo.tableId).toMatch(/^tbl/);
    expect(BRANDS.nco.tableId).toMatch(/^tbl/);
    expect(BRANDS.tqo.channel).toBe("The Quiet Operator");
    expect(BRANDS.nco.channel).toBe("NCO Forge");
  });

  it("uses corrected audit landing URL", () => {
    expect(DEFAULT_AUDIT_LANDING_URL).toContain("jobsecurityaudit");
    expect(DEFAULT_AUDIT_LANDING_URL).not.toContain("jobsecurtity");
  });
});

describe("workflow mirror", () => {
  it("matches TQO FINAL V5 census", () => {
    expect(N8N_WORKFLOW.name).toBe("TQO FINAL V5");
    expect(N8N_WORKFLOW.nodes).toBe(209);
    expect(N8N_WORKFLOW.active).toBe(true);
  });
});

describe("prompts", () => {
  it("TQO script prompt enforces word floor and audit CTA", () => {
    const p = buildScriptSystemPrompt("tqo");
    expect(p).toMatch(/1200/);
    expect(p).toMatch(/jobsecurityaudit/);
    expect(p).toMatch(/broll/);
  });

  it("NCO script prompt names five pillars", () => {
    const p = buildScriptSystemPrompt("nco");
    expect(p).toMatch(/NCO Forge/);
    expect(p).toMatch(/Five Pillars|FIVE PILLARS/i);
  });

  it("packaging prompts are brand-aware", () => {
    expect(buildPackagingSystemPrompt("nco")).toMatch(/NCO Forge/);
    expect(buildPackagingSystemPrompt("tqo")).toMatch(/Quiet Operator/);
  });
});
