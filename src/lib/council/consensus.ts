import { COUNCILS } from "./councils";
import type {
  ConsensusReport,
  Contradiction,
  CouncilVerdict,
  RiskFlag,
  Stance,
} from "./types";

/** Numeric position of each stance on the endorse↔oppose axis. */
const STANCE_VALUE: Record<Stance, number> = {
  endorse: 1,
  endorse_with_conditions: 0.5,
  oppose: -1,
  abstain: 0,
};

const SEVERITY_WEIGHT: Record<RiskFlag["severity"], number> = {
  low: 1,
  medium: 3,
  high: 7,
  critical: 15,
};

const SEVERITY_ORDER: RiskFlag["severity"][] = ["low", "medium", "high", "critical"];

/**
 * Weighted, confidence-adjusted consensus score in [0, 100].
 *
 * 100 = every non-abstaining council fully endorses at full confidence;
 * 0   = every non-abstaining council opposes at full confidence;
 * 50  = perfectly split or universally abstaining.
 */
export function consensusScore(verdicts: CouncilVerdict[]): number {
  const active = verdicts.filter((v) => v.stance !== "abstain");
  if (active.length === 0) return 50;

  let weightedSum = 0;
  let weightTotal = 0;
  for (const v of active) {
    const councilWeight = COUNCILS[v.councilId]?.weight ?? 1;
    const confidence = clamp01(v.confidence);
    const w = councilWeight * confidence;
    weightedSum += STANCE_VALUE[v.stance] * w;
    weightTotal += w;
  }
  if (weightTotal === 0) return 50;
  // Map [-1, 1] → [0, 100]
  return round1(((weightedSum / weightTotal + 1) / 2) * 100);
}

export function consensusBand(score: number): ConsensusReport["band"] {
  if (score >= 90) return "unanimous";
  if (score >= 70) return "strong";
  if (score >= 45) return "split";
  return "contested";
}

/**
 * Structural contradiction detection: any pair of councils on opposite ends of
 * the stance axis (one endorsing, one opposing) with meaningful confidence is
 * a contradiction the Supreme Orchestrator must resolve explicitly.
 */
export function detectContradictions(verdicts: CouncilVerdict[]): Contradiction[] {
  const out: Contradiction[] = [];
  const MIN_CONFIDENCE = 0.4;
  for (let i = 0; i < verdicts.length; i++) {
    for (let j = i + 1; j < verdicts.length; j++) {
      const a = verdicts[i];
      const b = verdicts[j];
      if (clamp01(a.confidence) < MIN_CONFIDENCE || clamp01(b.confidence) < MIN_CONFIDENCE) continue;
      const product = STANCE_VALUE[a.stance] * STANCE_VALUE[b.stance];
      if (product < 0) {
        const [pro, con] = STANCE_VALUE[a.stance] > 0 ? [a, b] : [b, a];
        out.push({
          councils: [a.councilId, b.councilId],
          description: `${COUNCILS[pro.councilId].name} endorses ("${truncate(pro.position)}") while ${COUNCILS[con.councilId].name} opposes ("${truncate(con.position)}").`,
        });
      }
    }
  }
  return out;
}

/**
 * Aggregate all raised risk flags into a 0–100 composite using a saturating
 * curve — many low-severity flags matter, but a single critical dominates.
 */
export function aggregateRisk(verdicts: CouncilVerdict[]): ConsensusReport["aggregateRisk"] {
  const flags = verdicts.flatMap((v) => v.risks);
  if (flags.length === 0) {
    return { score: 0, highestSeverity: null, flags: [] };
  }
  const raw = flags.reduce((sum, f) => sum + SEVERITY_WEIGHT[f.severity], 0);
  // Saturating map: raw 15 (one critical) ≈ 63; raw 30 ≈ 86; asymptote 100.
  const score = round1(100 * (1 - Math.exp(-raw / 15)));
  const highestSeverity = flags.reduce<RiskFlag["severity"]>(
    (max, f) =>
      SEVERITY_ORDER.indexOf(f.severity) > SEVERITY_ORDER.indexOf(max) ? f.severity : max,
    "low"
  );
  return { score, highestSeverity, flags };
}

export function buildConsensusReport(verdicts: CouncilVerdict[]): ConsensusReport {
  const score = consensusScore(verdicts);
  const stanceBreakdown: Record<Stance, number> = {
    endorse: 0,
    endorse_with_conditions: 0,
    oppose: 0,
    abstain: 0,
  };
  for (const v of verdicts) stanceBreakdown[v.stance]++;
  return {
    score,
    band: consensusBand(score),
    stanceBreakdown,
    contradictions: detectContradictions(verdicts),
    aggregateRisk: aggregateRisk(verdicts),
  };
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function truncate(s: string, max = 120): string {
  return s.length <= max ? s : s.slice(0, max - 1) + "…";
}
