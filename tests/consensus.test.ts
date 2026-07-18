import { describe, expect, it } from "vitest";
import {
  aggregateRisk,
  agreementScore,
  buildConsensusReport,
  consensusBand,
  consensusScore,
  detectContradictions,
} from "@/lib/council/consensus";
import type { CouncilVerdict } from "@/lib/council/types";

function verdict(overrides: Partial<CouncilVerdict> & Pick<CouncilVerdict, "councilId">): CouncilVerdict {
  return {
    stance: "endorse",
    confidence: 0.8,
    position: "Test position",
    keyPoints: [],
    risks: [],
    conditions: [],
    ...overrides,
  };
}

describe("consensusScore", () => {
  it("returns 100 for unanimous full-confidence endorsement", () => {
    const verdicts = [
      verdict({ councilId: "research", confidence: 1 }),
      verdict({ councilId: "risk", confidence: 1 }),
      verdict({ councilId: "logic", confidence: 1 }),
    ];
    expect(consensusScore(verdicts)).toBe(100);
  });

  it("returns 0 for unanimous full-confidence opposition", () => {
    const verdicts = [
      verdict({ councilId: "research", stance: "oppose", confidence: 1 }),
      verdict({ councilId: "risk", stance: "oppose", confidence: 1 }),
    ];
    expect(consensusScore(verdicts)).toBe(0);
  });

  it("returns 50 when every council abstains", () => {
    const verdicts = [
      verdict({ councilId: "research", stance: "abstain" }),
      verdict({ councilId: "risk", stance: "abstain" }),
    ];
    expect(consensusScore(verdicts)).toBe(50);
  });

  it("returns 50 for an empty verdict set", () => {
    expect(consensusScore([])).toBe(50);
  });

  it("weights higher-weight councils more heavily", () => {
    // risk (w=1.3) opposes, creative (w=0.9) endorses, equal confidence:
    // the weighted score must land below the 50 midpoint.
    const verdicts = [
      verdict({ councilId: "risk", stance: "oppose", confidence: 0.9 }),
      verdict({ councilId: "creative", stance: "endorse", confidence: 0.9 }),
    ];
    expect(consensusScore(verdicts)).toBeLessThan(50);
  });

  it("discounts low-confidence stances", () => {
    const confident = [
      verdict({ councilId: "research", confidence: 1 }),
      verdict({ councilId: "logic", stance: "oppose", confidence: 0.1 }),
    ];
    const shaky = [
      verdict({ councilId: "research", confidence: 0.1 }),
      verdict({ councilId: "logic", stance: "oppose", confidence: 1 }),
    ];
    expect(consensusScore(confident)).toBeGreaterThan(consensusScore(shaky));
  });

  it("attenuates a lone low-confidence endorsement toward neutral, not certainty", () => {
    // Confidence lives only in the numerator: a single 0.01-confidence
    // endorsement must land near the neutral 50, never at 100.
    const score = consensusScore([verdict({ councilId: "research", confidence: 0.01 })]);
    expect(score).toBeGreaterThan(45);
    expect(score).toBeLessThan(55);
  });

  it("clamps out-of-range confidence instead of exploding", () => {
    const verdicts = [
      verdict({ councilId: "research", confidence: 5 }),
      verdict({ councilId: "logic", confidence: -3, stance: "oppose" }),
    ];
    const score = consensusScore(verdicts);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("consensusBand", () => {
  it("maps agreement values to bands at the documented thresholds", () => {
    expect(consensusBand(95)).toBe("unanimous");
    expect(consensusBand(90)).toBe("unanimous");
    expect(consensusBand(75)).toBe("strong");
    expect(consensusBand(50)).toBe("split");
    expect(consensusBand(20)).toBe("contested");
  });
});

describe("agreementScore", () => {
  it("scores unanimous endorsement as full agreement", () => {
    const verdicts = [
      verdict({ councilId: "research", confidence: 1 }),
      verdict({ councilId: "risk", confidence: 1 }),
    ];
    expect(agreementScore(verdicts)).toBe(100);
  });

  it("scores unanimous OPPOSITION as full agreement too (direction-independent)", () => {
    const oppose = [
      verdict({ councilId: "research", stance: "oppose", confidence: 1 }),
      verdict({ councilId: "risk", stance: "oppose", confidence: 1 }),
    ];
    // Directional support is 0, but the councils fully agree with each other.
    expect(consensusScore(oppose)).toBe(0);
    expect(agreementScore(oppose)).toBe(100);
    expect(consensusBand(agreementScore(oppose))).toBe("unanimous");
  });

  it("scores a full endorse/oppose split as low agreement", () => {
    const split = [
      verdict({ councilId: "research", stance: "endorse", confidence: 1 }),
      verdict({ councilId: "risk", stance: "oppose", confidence: 1 }),
    ];
    expect(agreementScore(split)).toBeLessThan(45);
  });

  it("returns 50 when every council abstains", () => {
    expect(
      agreementScore([verdict({ councilId: "research", stance: "abstain" })])
    ).toBe(50);
  });
});

describe("detectContradictions", () => {
  it("flags endorse vs oppose pairs", () => {
    const verdicts = [
      verdict({ councilId: "strategy", stance: "endorse", position: "Ship it now" }),
      verdict({ councilId: "risk", stance: "oppose", position: "Unbounded downside" }),
    ];
    const contradictions = detectContradictions(verdicts);
    expect(contradictions).toHaveLength(1);
    expect(contradictions[0].councils).toEqual(["strategy", "risk"]);
  });

  it("ignores low-confidence disagreement", () => {
    const verdicts = [
      verdict({ councilId: "strategy", stance: "endorse", confidence: 0.2 }),
      verdict({ councilId: "risk", stance: "oppose", confidence: 0.9 }),
    ];
    expect(detectContradictions(verdicts)).toHaveLength(0);
  });

  it("does not flag conditional endorsement against endorsement", () => {
    const verdicts = [
      verdict({ councilId: "strategy", stance: "endorse" }),
      verdict({ councilId: "quality", stance: "endorse_with_conditions" }),
    ];
    expect(detectContradictions(verdicts)).toHaveLength(0);
  });

  it("flags conditional endorsement against opposition", () => {
    const verdicts = [
      verdict({ councilId: "quality", stance: "endorse_with_conditions" }),
      verdict({ councilId: "ethics", stance: "oppose" }),
    ];
    expect(detectContradictions(verdicts)).toHaveLength(1);
  });
});

describe("aggregateRisk", () => {
  it("returns zero for no flags", () => {
    const result = aggregateRisk([verdict({ councilId: "research" })]);
    expect(result.score).toBe(0);
    expect(result.highestSeverity).toBeNull();
  });

  it("a single critical flag dominates several lows", () => {
    const critical = aggregateRisk([
      verdict({
        councilId: "risk",
        risks: [{ severity: "critical", description: "irreversible data loss" }],
      }),
    ]);
    const lows = aggregateRisk([
      verdict({
        councilId: "risk",
        risks: [
          { severity: "low", description: "a" },
          { severity: "low", description: "b" },
          { severity: "low", description: "c" },
        ],
      }),
    ]);
    expect(critical.score).toBeGreaterThan(lows.score);
    expect(critical.highestSeverity).toBe("critical");
    expect(lows.highestSeverity).toBe("low");
  });

  it("saturates below 100", () => {
    const flags = Array.from({ length: 20 }, (_, i) => ({
      severity: "critical" as const,
      description: `risk ${i}`,
    }));
    const result = aggregateRisk([verdict({ councilId: "risk", risks: flags })]);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(90);
  });
});

describe("buildConsensusReport", () => {
  it("assembles a full report with stance breakdown", () => {
    const verdicts = [
      verdict({ councilId: "research", stance: "endorse" }),
      verdict({ councilId: "strategy", stance: "endorse_with_conditions" }),
      verdict({ councilId: "risk", stance: "oppose" }),
      verdict({ councilId: "creative", stance: "abstain" }),
    ];
    const report = buildConsensusReport(verdicts);
    expect(report.stanceBreakdown).toEqual({
      endorse: 1,
      endorse_with_conditions: 1,
      oppose: 1,
      abstain: 1,
    });
    expect(report.contradictions.length).toBeGreaterThan(0);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(report.agreement).toBeGreaterThanOrEqual(0);
    expect(report.agreement).toBeLessThanOrEqual(100);
    expect(report.band).toBe(consensusBand(report.agreement));
  });
});
