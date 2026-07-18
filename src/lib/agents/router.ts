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
 * length (longer, more specific phrases dominate generic ones). Matching is
 * word-boundary aware so "shortage" never matches the "short" trigger.
 */
function matchesTrigger(text: string, trigger: string): boolean {
  const escaped = trigger.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

export function routeByKeywords(input: string): RouteDecision {
  const text = input.toLowerCase();
  let best: { agentId: AgentId; score: number } | null = null;

  for (const agentId of AGENT_IDS) {
    let score = 0;
    for (const trigger of AGENTS[agentId].triggers) {
      if (matchesTrigger(text, trigger)) score += trigger.split(/\s+/).length * trigger.length;
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

  // Any curated-trigger match is a deliberate signal, so it clears the
  // orchestrator's 0.5 acceptance gate; longer/multiple matches saturate
  // toward 1. (`best.score` is words×chars of the matched triggers, so a lone
  // short trigger ≈ 5 → ~0.58, "job security" ≈ 24 → ~0.9.)
  const confidence = Math.min(1, 0.5 + best.score / 60);
  return { agentId: best.agentId, confidence, method: "keyword" };
}
