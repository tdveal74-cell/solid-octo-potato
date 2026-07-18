import { describe, expect, it } from "vitest";
import { routeByKeywords } from "@/lib/agents/router";

describe("routeByKeywords", () => {
  it("routes job-security questions to the audit agent", () => {
    const route = routeByKeywords("Will AI take my job as an accountant?");
    expect(route.agentId).toBe("job-security-audit");
    expect(route.method).toBe("keyword");
  });

  it("routes content requests to the content agent", () => {
    const route = routeByKeywords("Write a newsletter about quiet career moves");
    expect(route.agentId).toBe("content");
  });

  it("routes video requests to the video-script agent", () => {
    const route = routeByKeywords("I need a youtube script about quiet career moves");
    expect(route.agentId).toBe("video-script");
  });

  it("more specific trigger phrases win over generic ones in mixed input", () => {
    // "ai exposure" (job-security-audit) is longer/more specific than
    // "script"/"youtube", so a mixed request routes to the audit agent.
    const route = routeByKeywords("a youtube script about ai exposure");
    expect(route.agentId).toBe("job-security-audit");
  });

  it("prefers longer, more specific trigger phrases", () => {
    // "ai exposure" (job-security-audit) should beat generic single words.
    const route = routeByKeywords("Explain ai exposure scoring");
    expect(route.agentId).toBe("job-security-audit");
  });

  it("falls back to research with zero confidence when nothing matches", () => {
    const route = routeByKeywords("xylophone weather patterns");
    expect(route.agentId).toBe("research-intelligence");
    expect(route.confidence).toBe(0);
    expect(route.method).toBe("default");
  });

  it("confidence stays within [0, 1]", () => {
    const route = routeByKeywords(
      "research research research evidence evidence investigate sources find out"
    );
    expect(route.confidence).toBeLessThanOrEqual(1);
    expect(route.confidence).toBeGreaterThan(0);
  });

  it("a single short trigger clears the orchestrator's 0.5 acceptance gate", () => {
    // "help" (customer-success) is a lone 4-char trigger — the keyword pass
    // must be confident enough to be accepted, not silently dropped to the LLM.
    const route = routeByKeywords("Can you help me get value from this?");
    expect(route.agentId).toBe("customer-success");
    expect(route.method).toBe("keyword");
    expect(route.confidence).toBeGreaterThanOrEqual(0.5);
  });

  it("a specific multi-word trigger saturates toward full confidence", () => {
    const route = routeByKeywords("Will AI take my job as an accountant?");
    expect(route.agentId).toBe("job-security-audit");
    expect(route.confidence).toBeGreaterThan(0.9);
  });
});
