import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfigured } from "@/lib/ai/client";
import { AGENT_IDS, type AgentId } from "@/lib/agents/registry";
import { orchestrate } from "@/lib/orchestrator";

export const maxDuration = 300;

const BodySchema = z.object({
  input: z.string().min(2).max(20000),
  agentId: z.enum(AGENT_IDS as [AgentId, ...AgentId[]]).optional(),
  memory: z.array(z.string().max(2000)).max(50).optional(),
  councilReview: z.boolean().optional(),
});

export async function POST(request: Request) {
  if (!aiConfigured()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const result = await orchestrate(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[orchestrate]", err);
    return NextResponse.json({ error: "Orchestration failed" }, { status: 500 });
  }
}
