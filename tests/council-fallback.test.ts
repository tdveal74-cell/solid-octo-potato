import { describe, expect, it } from "vitest";
import {
  DEGRADED_NOTICE,
  deliberateOffline,
  isProviderUnavailable,
} from "@/lib/council/fallback";

describe("Council degraded mode", () => {
  it("returns an explicit non-AI readiness review instead of fabricating a verdict", () => {
    const result = deliberateOffline({
      question: "Should this product ship to production this week?",
      debate: true,
    });

    expect(result.execution).toEqual({
      mode: "degraded",
      provider: "offline",
      notice: DEGRADED_NOTICE,
    });
    expect(result.recommendation.decision).toBe("revise");
    expect(result.phase1).toHaveLength(8);
    expect(result.phase1.every((verdict) => verdict.stance === "abstain")).toBe(true);
    expect(result.phase2).toBeNull();
    expect(result.consensus.score).toBe(50);
    expect(result.recommendation.conditions.length).toBeGreaterThan(0);
  });

  it("respects an explicitly selected council set", () => {
    const result = deliberateOffline({
      question: "Should we start with a reversible pilot?",
      councils: ["risk", "quality"],
    });

    expect(result.phase1.map((verdict) => verdict.councilId)).toEqual(["risk", "quality"]);
    expect(result.recommendation.dissent).toHaveLength(2);
  });

  it("recognizes provider outages without hiding unrelated code defects", () => {
    expect(isProviderUnavailable(new Error("Your credit balance is too low"))).toBe(true);
    expect(isProviderUnavailable({ status: 429 })).toBe(true);
    expect(isProviderUnavailable(new Error("Cannot read properties of undefined"))).toBe(false);
  });
});
