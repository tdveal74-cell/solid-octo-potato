import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClient, MODELS } from "../ai/client";
import { COUNCILS, SUPREME_ORCHESTRATOR_PROMPT } from "./councils";
import { buildConsensusReport } from "./consensus";
import type {
  ConsensusReport,
  CouncilId,
  CouncilVerdict,
  DeliberationRequest,
  DeliberationResult,
  FinalRecommendation,
} from "./types";
import { COUNCIL_IDS } from "./types";

const VerdictSchema = z.object({
  stance: z.enum(["endorse", "endorse_with_conditions", "oppose", "abstain"]),
  confidence: z.number(),
  position: z.string(),
  keyPoints: z.array(z.string()),
  risks: z.array(
    z.object({
      severity: z.enum(["low", "medium", "high", "critical"]),
      description: z.string(),
    })
  ),
  conditions: z.array(z.string()),
});

const RecommendationSchema = z.object({
  decision: z.enum(["proceed", "proceed_with_conditions", "revise", "reject"]),
  summary: z.string(),
  rationale: z.string(),
  conditions: z.array(z.string()),
  dissent: z.array(z.string()),
});

/**
 * Run one council seat against the question. `peerDigest` is present only in
 * the debate phase (phase 2), where the council sees the other verdicts.
 */
async function runCouncil(
  councilId: CouncilId,
  question: string,
  context: string | undefined,
  peerDigest: string | null
): Promise<CouncilVerdict> {
  const client = getClient();
  const council = COUNCILS[councilId];

  const parts: string[] = [`QUESTION UNDER DELIBERATION:\n${question}`];
  if (context) parts.push(`CONTEXT:\n${context}`);
  if (peerDigest) {
    parts.push(
      `DEBATE PHASE — the other councils' independent verdicts follow. Revise your position only where their reasoning genuinely changes your analysis; hold your position where it does not. State explicitly what, if anything, changed your mind.\n\n${peerDigest}`
    );
  }
  parts.push(
    `Deliver your verdict. confidence is 0 to 1. Raise risks only within your mandate ("${council.mandate}").`
  );

  const response = await client.messages.parse({
    model: MODELS.PRIMARY,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: council.systemPrompt,
    messages: [{ role: "user", content: parts.join("\n\n") }],
    output_config: { format: zodOutputFormat(VerdictSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(`Council ${councilId} returned unparseable verdict (stop_reason: ${response.stop_reason})`);
  }
  return { councilId, ...parsed, confidence: Math.min(1, Math.max(0, parsed.confidence)) };
}

function digestVerdicts(verdicts: CouncilVerdict[], exclude?: CouncilId): string {
  return verdicts
    .filter((v) => v.councilId !== exclude)
    .map((v) => {
      const risks = v.risks.map((r) => `[${r.severity}] ${r.description}`).join("; ") || "none raised";
      return `${COUNCILS[v.councilId].name} — ${v.stance} (confidence ${v.confidence.toFixed(2)})\nPosition: ${v.position}\nKey points: ${v.keyPoints.join(" | ")}\nRisks: ${risks}`;
    })
    .join("\n\n");
}

async function synthesize(
  question: string,
  verdicts: CouncilVerdict[],
  consensus: ConsensusReport
): Promise<FinalRecommendation> {
  const client = getClient();
  const contradictionText =
    consensus.contradictions.map((c) => `- ${c.description}`).join("\n") || "none detected";

  const response = await client.messages.parse({
    model: MODELS.PRIMARY,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    system: SUPREME_ORCHESTRATOR_PROMPT,
    messages: [
      {
        role: "user",
        content: `QUESTION:\n${question}\n\nFINAL COUNCIL VERDICTS:\n${digestVerdicts(verdicts)}\n\nCOMPUTED METRICS:\nConsensus score: ${consensus.score}/100 (${consensus.band})\nAggregate risk: ${consensus.aggregateRisk.score}/100 (highest severity: ${consensus.aggregateRisk.highestSeverity ?? "none"})\nContradictions:\n${contradictionText}\n\nIssue the final recommendation.`,
      },
    ],
    output_config: { format: zodOutputFormat(RecommendationSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(`Supreme Orchestrator returned unparseable recommendation (stop_reason: ${response.stop_reason})`);
  }
  return parsed;
}

/**
 * Full META SUPREME X deliberation:
 * independent analysis → (optional) debate → consensus metrics → synthesis.
 */
export async function deliberate(request: DeliberationRequest): Promise<DeliberationResult> {
  const started = Date.now();
  const councilIds = request.councils?.length ? request.councils : COUNCIL_IDS;
  const debate = request.debate !== false;

  // Phase 1 — independent analysis, all councils in parallel.
  const phase1 = await Promise.all(
    councilIds.map((id) => runCouncil(id, request.question, request.context, null))
  );

  // Phase 2 — debate: each council revises with sight of its peers.
  let phase2: CouncilVerdict[] | null = null;
  if (debate && councilIds.length > 1) {
    phase2 = await Promise.all(
      councilIds.map((id) =>
        runCouncil(id, request.question, request.context, digestVerdicts(phase1, id))
      )
    );
  }

  const finalVerdicts = phase2 ?? phase1;
  const consensus = buildConsensusReport(finalVerdicts);
  const recommendation = await synthesize(request.question, finalVerdicts, consensus);

  return {
    question: request.question,
    phase1,
    phase2,
    consensus,
    recommendation,
    elapsedMs: Date.now() - started,
  };
}
