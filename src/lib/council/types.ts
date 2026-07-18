/**
 * META SUPREME X COUNCIL — core types.
 *
 * A deliberation flows through three phases:
 *   1. INDEPENDENT ANALYSIS — every council analyzes the question in isolation.
 *   2. DEBATE — each council sees the other verdicts and may revise its position.
 *   3. SYNTHESIS — the Supreme Orchestrator scores consensus, surfaces
 *      contradictions and risks, and issues the final recommendation.
 */

export type CouncilId =
  | "research"
  | "strategy"
  | "logic"
  | "creative"
  | "risk"
  | "quality"
  | "ethics"
  | "enterprise";

export const COUNCIL_IDS: CouncilId[] = [
  "research",
  "strategy",
  "logic",
  "creative",
  "risk",
  "quality",
  "ethics",
  "enterprise",
];

export type Stance = "endorse" | "endorse_with_conditions" | "oppose" | "abstain";

export interface CouncilDefinition {
  id: CouncilId;
  name: string;
  mandate: string;
  /** Relative influence on the weighted consensus score (normalized at runtime). */
  weight: number;
  systemPrompt: string;
}

export interface RiskFlag {
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface CouncilVerdict {
  councilId: CouncilId;
  stance: Stance;
  /** 0–1 self-reported confidence in the stance. */
  confidence: number;
  position: string;
  keyPoints: string[];
  risks: RiskFlag[];
  conditions: string[];
}

export interface Contradiction {
  councils: [CouncilId, CouncilId];
  description: string;
}

export interface DeliberationRequest {
  question: string;
  context?: string;
  /** Councils to convene; defaults to all eight. */
  councils?: CouncilId[];
  /** Run the debate phase (phase 2). Defaults to true. */
  debate?: boolean;
}

export interface DeliberationResult {
  question: string;
  phase1: CouncilVerdict[];
  phase2: CouncilVerdict[] | null;
  consensus: ConsensusReport;
  recommendation: FinalRecommendation;
  elapsedMs: number;
}

export interface ConsensusReport {
  /**
   * 0–100 directional SUPPORT for the proposal (100 endorse ↔ 0 oppose).
   * Low confidence attenuates toward the neutral 50.
   */
  score: number;
  /**
   * 0–100 AGREEMENT among councils, independent of direction — unanimous
   * opposition scores as high as unanimous endorsement.
   */
  agreement: number;
  /** Band of `agreement` (not of `score`). */
  band: "unanimous" | "strong" | "split" | "contested";
  stanceBreakdown: Record<Stance, number>;
  contradictions: Contradiction[];
  aggregateRisk: {
    /** 0–100 composite of all risk flags raised. */
    score: number;
    highestSeverity: RiskFlag["severity"] | null;
    flags: RiskFlag[];
  };
}

export interface FinalRecommendation {
  decision: "proceed" | "proceed_with_conditions" | "revise" | "reject";
  summary: string;
  rationale: string;
  conditions: string[];
  dissent: string[];
}
