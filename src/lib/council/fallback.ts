import { COUNCILS } from "./councils";
import { buildConsensusReport } from "./consensus";
import {
  COUNCIL_IDS,
  type CouncilId,
  type CouncilVerdict,
  type DeliberationRequest,
  type DeliberationResult,
  type RiskFlag,
} from "./types";

export const DEGRADED_NOTICE =
  "The live Council provider is temporarily unavailable. The Operator completed a deterministic readiness review so the workflow can finish without presenting simulated analysis as a live AI verdict.";

const READINESS: Record<
  CouncilId,
  {
    position: string;
    keyPoints: string[];
    risks: RiskFlag[];
    conditions: string[];
  }
> = {
  research: {
    position: "Live evidence analysis is unavailable. Verify the decision-critical facts and name every assumption before advancing.",
    keyPoints: ["Separate verified evidence from assumptions.", "Identify the missing fact most likely to reverse the decision."],
    risks: [{ severity: "medium", description: "A decision made without verified evidence can optimize for a false premise." }],
    conditions: ["Attach sources for the decision-critical claims."],
  },
  strategy: {
    position: "Live strategic analysis is unavailable. Test timing, opportunity cost, and the best credible alternative.",
    keyPoints: ["Compare the proposal with a delay and a smaller reversible move.", "Name what this choice forecloses."],
    risks: [{ severity: "medium", description: "Committing now may eliminate a stronger sequence or lower-cost option." }],
    conditions: ["Document the next-best alternative and why this timing wins."],
  },
  logic: {
    position: "Live causal analysis is unavailable. Write the premise-to-outcome chain and test its weakest link.",
    keyPoints: ["Make hidden premises explicit.", "Define what evidence would falsify the expected outcome."],
    risks: [{ severity: "medium", description: "An untested causal link can make a coherent plan fail in practice." }],
    conditions: ["State the causal chain and a falsification signal."],
  },
  creative: {
    position: "Live alternative generation is unavailable. Produce at least one materially different framing before committing.",
    keyPoints: ["Challenge the current framing.", "Compare against a constrained pilot or reversible prototype."],
    risks: [{ severity: "low", description: "The current framing may hide a simpler or more valuable option." }],
    conditions: ["Evaluate one materially different alternative."],
  },
  risk: {
    position: "Live failure-mode analysis is unavailable. Bound blast radius and preserve a rollback path.",
    keyPoints: ["Classify reversible and irreversible harm.", "Set stop conditions before execution begins."],
    risks: [{ severity: "high", description: "Proceeding without rollback and stop conditions can turn a recoverable miss into lasting damage." }],
    conditions: ["Define rollback, owner, stop conditions, and maximum acceptable loss."],
  },
  quality: {
    position: "Live quality review is unavailable. Convert the flagship bar into measurable acceptance tests.",
    keyPoints: ["Define complete, shippable, and supportable.", "Require evidence for every acceptance criterion."],
    risks: [{ severity: "medium", description: "A polished demonstration can be mistaken for a production-ready system." }],
    conditions: ["Publish pass/fail acceptance criteria and verification evidence."],
  },
  ethics: {
    position: "Live ethics and safety review is unavailable. Check consent, privacy, honesty, and third-party impact before release.",
    keyPoints: ["Do not overstate what has been verified.", "Identify affected people who did not choose the risk."],
    risks: [{ severity: "high", description: "Unreviewed privacy, consent, or representation choices can create direct user harm." }],
    conditions: ["Record privacy, consent, safety, and claim-substantiation checks."],
  },
  enterprise: {
    position: "Live operating-model analysis is unavailable. Name the owner, recurring cost, controls, and 100× load plan.",
    keyPoints: ["Assign operational ownership.", "Estimate maintenance and compliance burden at scale."],
    risks: [{ severity: "medium", description: "A system without an operating owner becomes a production liability." }],
    conditions: ["Document owner, runbook, cost ceiling, and scale assumptions."],
  },
};

export function isProviderUnavailable(error: unknown): boolean {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = Number((error as { status?: unknown }).status);
    if (
      status === 401 ||
      status === 402 ||
      status === 403 ||
      status === 408 ||
      status === 429 ||
      status >= 500
    ) {
      return true;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  return /anthropic|api[ _-]?key|auth(?:entication|orization)?|billing|credit balance|rate limit|overload|timeout|ECONN/i.test(
    message
  );
}

export function deliberateOffline(
  request: DeliberationRequest,
  notice = DEGRADED_NOTICE
): DeliberationResult {
  const started = Date.now();
  const councilIds = request.councils?.length ? request.councils : COUNCIL_IDS;
  const phase1: CouncilVerdict[] = councilIds.map((councilId) => {
    const readiness = READINESS[councilId];
    return {
      councilId,
      stance: "abstain",
      confidence: 1,
      position: readiness.position,
      keyPoints: readiness.keyPoints,
      risks: readiness.risks,
      conditions: readiness.conditions,
    };
  });
  const consensus = buildConsensusReport(phase1);
  const conditions = [...new Set(phase1.flatMap((verdict) => verdict.conditions))];

  return {
    question: request.question,
    phase1,
    phase2: null,
    consensus,
    recommendation: {
      decision: "revise",
      summary: "Live Council unavailable — readiness review complete",
      rationale:
        "The live model provider could not complete this deliberation. The Council has abstained instead of fabricating model analysis. Use the readiness conditions below to harden the decision, then rerun for a substantive Council verdict when live service resumes.",
      conditions,
      dissent: councilIds.map(
        (id) => `${COUNCILS[id].name} abstained because live model analysis was unavailable.`
      ),
    },
    elapsedMs: Date.now() - started,
    execution: {
      mode: "degraded",
      provider: "offline",
      notice,
    },
  };
}
