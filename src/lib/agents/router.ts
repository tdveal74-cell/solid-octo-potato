import { AGENTS, AGENT_IDS, type AgentId } from "./registry";

export interface RouteDecision {
  agentId: AgentId;
  /** 0–1 confidence in the routing decision. */
  confidence: number;
  method: "keyword" | "default";
}

/**
 * Deterministic keyword router — the zero-latency, zero-cost first pass of the
 * META SUPREME X routing stack. The orchestrator falls back to an LLM
 * classification (utility model) only when this pass is low-confidence.
 *
 * Scoring: each agent trigger phrase found in the input scores by phrase
 * length (longer, more specific phrases dominate generic ones).
 */
export function routeByKeywords(input: string): RouteDecision {
  const text = input.toLowerCase();
  let best: { agentId: AgentId; score: number } | null = null;

  for (const agentId of AGENT_IDS) {
    let score = 0;
    for (const trigger of AGENTS[agentId].triggers) {
      if (text.includes(trigger)) score += trigger.split(/\s+/).length * trigger.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { agentId, score };
    }
  }

  if (!best) {
    // No trigger matched — default to research, flagged low-confidence so the
    // orchestrator escalates to LLM classification.
    return { agentId: "research-intelligence", confidence: 0, method: "default" };
  }

  // Saturating confidence: a single short trigger ≈ 0.5; multiple/specific ≈ →1.
  const confidence = Math.min(1, best.score / 40);
  return { agentId: best.agentId, confidence, method: "keyword" };
}
