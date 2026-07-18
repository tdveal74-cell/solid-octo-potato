import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClient, MODELS } from "../ai/client";
import { AGENTS } from "../agents/registry";
import type { AuditResult } from "./audit";

/**
 * Career roadmap generation — the qualitative layer on top of the
 * deterministic audit engine. Produces a skill-gap analysis and a phased
 * learning path grounded in the audit's task-level numbers.
 */

export interface RoadmapRequest {
  role: string;
  industry?: string;
  yearsExperience?: number;
  goals?: string;
  audit: AuditResult;
}

const RoadmapSchema = z.object({
  headline: z.string(),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      why: z.string(),
      priority: z.enum(["now", "next", "later"]),
    })
  ),
  phases: z.array(
    z.object({
      name: z.string(),
      horizon: z.string(),
      actions: z.array(z.string()),
      successSignal: z.string(),
    })
  ),
  learningPath: z.array(
    z.object({
      topic: z.string(),
      format: z.string(),
      estimatedWeeks: z.number(),
    })
  ),
});

export type CareerRoadmap = z.infer<typeof RoadmapSchema>;

export async function generateRoadmap(request: RoadmapRequest): Promise<CareerRoadmap> {
  const client = getClient();
  const { audit } = request;
  const taskTable = audit.tasks
    .map((t) => `- ${t.name}: exposure ${t.exposure}/100, ${t.timeShare}% of time → ${t.classification}`)
    .join("\n");

  const response = await client.messages.parse({
    model: MODELS.PRIMARY,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: AGENTS["career-intelligence"].systemPrompt,
    messages: [
      {
        role: "user",
        content: `Build a career roadmap grounded in this completed Job Security Audit.

ROLE: ${request.role}${request.industry ? `\nINDUSTRY: ${request.industry}` : ""}${
          request.yearsExperience != null ? `\nEXPERIENCE: ${request.yearsExperience} years` : ""
        }${request.goals ? `\nSTATED GOALS: ${request.goals}` : ""}

AUDIT RESULTS (deterministic engine):
Overall AI exposure: ${audit.exposureScore}/100 (${audit.band})
Task breakdown:
${taskTable}
Human-leverage tasks (concentrate here): ${audit.humanLeverage.join(", ")}
Automation front (delegate/automate first): ${audit.automationFront.join(", ")}

Requirements: the roadmap must shift time from the automation front toward human-leverage tasks; skill gaps must map to specific tasks in the audit; phases must have observable success signals, not vibes.`,
      },
    ],
    output_config: { format: zodOutputFormat(RoadmapSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(`Roadmap generation returned unparseable output (stop_reason: ${response.stop_reason})`);
  }
  return parsed;
}
