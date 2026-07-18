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
  output: string;
  council: DeliberationResult | null;
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

  return { agentId, route, output, council };
}
