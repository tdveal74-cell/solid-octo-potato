import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClient, MODELS } from "../ai/client";
import { AGENTS, AGENT_IDS, type AgentId } from "../agents/registry";
import { routeByKeywords, type RouteDecision } from "../agents/router";
import { deliberate } from "../council/engine";
import type { DeliberationResult } from "../council/types";

/**
 * META SUPREME X — central orchestration layer.
 *
 * Request lifecycle:
 *   route (keyword pass → LLM fallback) → execute agent → optional Council
 *   escalation for high-stakes agents → response envelope.
 */

export interface OrchestratorRequest {
  input: string;
  /** Force a specific agent, bypassing routing. */
  agentId?: AgentId;
  /** User/session memory injected into the agent context. */
  memory?: string[];
  /**
   * Request Council review for an agent that doesn't escalate by default.
   * Cannot suppress review: an agent's `escalateToCouncil: true` is mandatory
   * and wins over `councilReview: false`.
   */
  councilReview?: boolean;
}

export interface OrchestratorResponse {
  agentId: AgentId;
  route: RouteDecision | { method: "explicit" };
  /** "delivered" — output is the agent's response; "held" — Council blocked it. */
  status: "delivered" | "held";
  /**
   * The agent output when delivered, or a hold notice when the Council decided
   * `reject`/`revise`. The raw blocked text is never returned — inspect
   * `council.recommendation` for the rationale and required revisions.
   */
  output: string;
  /**
   * The deliberation, if the output was reviewed. For held responses its
   * `question` is redacted so the blocked agent text can't leak through it;
   * the verdicts and recommendation are retained.
   */
  council: DeliberationResult | null;
}

/**
 * Council gate: high-stakes output is reviewed *before* delivery. A `reject`
 * or `revise` decision withholds the agent text (replacing it with a notice);
 * `proceed` / `proceed_with_conditions` / no review deliver it unchanged.
 *
 * The withholding is total: the review prompt echoed back in
 * `DeliberationResult.question` embeds the raw agent output, so for held
 * responses that field is redacted too — otherwise the blocked text would
 * leak through the returned `council` payload. The Council's own analysis
 * (verdicts, recommendation) is retained: it explains *why* the output was
 * held and what revisions are required. Pure function so it is unit-testable.
 */
export function applyCouncilGate(
  output: string,
  council: DeliberationResult | null
): { status: "delivered" | "held"; output: string; council: DeliberationResult | null } {
  const decision = council?.recommendation.decision;
  if (council && (decision === "reject" || decision === "revise")) {
    return {
      status: "held",
      output: `This response was held by the META SUPREME X Council (decision: ${decision}). See the council recommendation for the rationale and required revisions before it can be delivered.`,
      council: {
        ...council,
        question:
          "[withheld] The reviewed output was not approved for delivery; see recommendation for details.",
      },
    };
  }
  return { status: "delivered", output, council };
}

const RouteSchema = z.object({
  agentId: z.enum(AGENT_IDS as [AgentId, ...AgentId[]]),
  reason: z.string(),
});

/** LLM routing fallback on the utility model, used when keyword routing is unsure. */
async function routeByModel(input: string): Promise<AgentId> {
  const client = getClient();
  const catalog = AGENT_IDS.map((id) => `- ${id}: ${AGENTS[id].description}`).join("\n");
  const response = await client.messages.parse({
    model: MODELS.UTILITY,
    max_tokens: 512,
    system: `You route user requests to exactly one specialist agent. Available agents:\n${catalog}`,
    messages: [{ role: "user", content: `Route this request:\n\n${input}` }],
    output_config: { format: zodOutputFormat(RouteSchema) },
  });
  if (!response.parsed_output) {
    throw new Error(`Routing model returned unparseable output (stop_reason: ${response.stop_reason})`);
  }
  return response.parsed_output.agentId;
}

async function executeAgent(agentId: AgentId, input: string, memory?: string[]): Promise<string> {
  const client = getClient();
  const agent = AGENTS[agentId];
  const memoryBlock = memory?.length
    ? `\n\nRELEVANT USER MEMORY (from prior sessions — use where relevant, never recite verbatim):\n${memory.map((m) => `- ${m}`).join("\n")}`
    : "";

  const stream = client.messages.stream({
    model: MODELS.PRIMARY,
    max_tokens: 32000,
    thinking: { type: "adaptive" },
    system: agent.systemPrompt + memoryBlock,
    messages: [{ role: "user", content: input }],
  });
  const message = await stream.finalMessage();
  return message.content
    .filter((b): b is Extract<typeof b, { type: "text" }> => b.type === "text")
    .map((b) => b.text)
    .join("");
}

export async function orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse> {
  // 1. Route
  let agentId: AgentId;
  let route: OrchestratorResponse["route"];
  if (request.agentId) {
    agentId = request.agentId;
    route = { method: "explicit" };
  } else {
    const keywordRoute = routeByKeywords(request.input);
    if (keywordRoute.confidence >= 0.5) {
      agentId = keywordRoute.agentId;
      route = keywordRoute;
    } else {
      agentId = await routeByModel(request.input);
      route = { agentId, confidence: 0.9, method: "default" };
    }
  }

  // 2. Execute
  const output = await executeAgent(agentId, request.input, request.memory);

  // 3. Council escalation for high-stakes outputs. Mandatory escalation is a
  //    safety control — callers can add review, never remove it.
  const shouldReview =
    AGENTS[agentId].escalateToCouncil || request.councilReview === true;
  let council: DeliberationResult | null = null;
  if (shouldReview) {
    council = await deliberate({
      question: `The ${AGENTS[agentId].name} produced the following output for a user. Should it be delivered as-is?\n\nUSER REQUEST:\n${request.input}\n\nAGENT OUTPUT:\n${output}`,
      debate: false,
    });
  }

  // 4. Gate delivery on the Council's decision (reject/revise → withhold).
  //    The gate also redacts the council payload so the blocked text can't
  //    leak through DeliberationResult.question.
  const gated = applyCouncilGate(output, council);
  return { agentId, route, status: gated.status, output: gated.output, council: gated.council };
}
