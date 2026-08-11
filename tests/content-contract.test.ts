import { describe, expect, it } from "vitest";
import {
  CONTENT_PIPELINE_CONTRACT,
  PIPELINE_STATUSES,
  BRANDS,
} from "../src/lib/content/pipeline";

/**
 * Contract smoke — does not call live n8n or Airtable.
 * Proves the repo stays locked to TQO FINAL V5 surface area.
 */
describe("TQO FINAL V5 content contract", () => {
  it("locks workflow identity and node count", () => {
    expect(CONTENT_PIPELINE_CONTRACT.workflow).toBe("TQO FINAL V5");
    expect(CONTENT_PIPELINE_CONTRACT.nodes).toBe(209);
  });

  it("includes dual brands", () => {
    expect(BRANDS).toEqual(expect.arrayContaining(["tqo", "nco"]));
  });

  it("exposes a non-empty status machine", () => {
    expect(PIPELINE_STATUSES.length).toBeGreaterThan(3);
  });
});
