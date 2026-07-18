import Anthropic from "@anthropic-ai/sdk";

/**
 * Central Anthropic client factory for the META SUPREME X intelligence system.
 *
 * Model tiers:
 *  - PRIMARY  — council deliberation, agent execution, final recommendations
 *  - UTILITY  — classification, routing hints, summarization, cheap fan-out
 */
export const MODELS = {
  PRIMARY: process.env.QO_MODEL_PRIMARY || "claude-opus-4-8",
  UTILITY: process.env.QO_MODEL_UTILITY || "claude-haiku-4-5",
} as const;

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic();
  }
  return _client;
}

/** True when an API key (or auth token) is resolvable — used to gate live routes. */
export function aiConfigured(): boolean {
  return Boolean(
    process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
  );
}
