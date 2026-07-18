import { describe, expect, it } from "vitest";
import { applyCouncilGate } from "@/lib/orchestrator";
import type { DeliberationResult, FinalRecommendation } from "@/lib/council/types";

function deliberation(
  decision: FinalRecommendation["decision"],
  question = "q"
): DeliberationResult {
  return {
    // The real escalation prompt embeds the raw agent output here.
    question,
    phase1: [],
    phase2: null,
    consensus: {
      score: 50,
      agreement: 50,
      band: "split",
      stanceBreakdown: { endorse: 0, endorse_with_conditions: 0, oppose: 0, abstain: 0 },
      contradictions: [],
      aggregateRisk: { score: 0, highestSeverity: null, flags: [] },
    },
    recommendation: {
      decision,
      summary: "s",
      rationale: "r",
      conditions: [],
      dissent: [],
    },
    elapsedMs: 1,
  };
}

describe("applyCouncilGate", () => {
  it("delivers the agent output when there is no Council review", () => {
    const gated = applyCouncilGate("agent text", null);
    expect(gated.status).toBe("delivered");
    expect(gated.output).toBe("agent text");
  });

  it("delivers the output when the Council approves", () => {
    for (const decision of ["proceed", "proceed_with_conditions"] as const) {
      const gated = applyCouncilGate("agent text", deliberation(decision));
      expect(gated.status).toBe("delivered");
      expect(gated.output).toBe("agent text");
    }
  });

  it("withholds the raw output when the Council rejects or asks for revision", () => {
    for (const decision of ["reject", "revise"] as const) {
      const gated = applyCouncilGate("sensitive raw text", deliberation(decision));
      expect(gated.status).toBe("held");
      // The blocked text must never leak through the gate.
      expect(gated.output).not.toContain("sensitive raw text");
      expect(gated.output).toContain(decision);
    }
  });

  it("blocked text does not leak through any field of the held response", () => {
    const RAW = "SENSITIVE-AGENT-OUTPUT-MARKER-42";
    // Mirror the real escalation prompt, which embeds the raw output in the
    // deliberation question that would otherwise be returned verbatim.
    const council = deliberation("reject", `Review this AGENT OUTPUT:\n${RAW}`);
    const gated = applyCouncilGate(RAW, council);
    expect(gated.status).toBe("held");
    // Serialize the entire returned payload — the marker must appear nowhere.
    expect(JSON.stringify(gated)).not.toContain(RAW);
    // The Council's recommendation is still returned to explain the hold.
    expect(gated.council?.recommendation.decision).toBe("reject");
  });

  it("preserves the council payload verbatim for delivered responses", () => {
    const council = deliberation("proceed", "Review this AGENT OUTPUT:\nfine text");
    const gated = applyCouncilGate("fine text", council);
    expect(gated.status).toBe("delivered");
    expect(gated.council).toBe(council);
  });
});
