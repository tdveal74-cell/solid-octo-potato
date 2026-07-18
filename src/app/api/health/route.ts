import { NextResponse } from "next/server";
import { aiConfigured, MODELS } from "@/lib/ai/client";
import { AGENT_IDS } from "@/lib/agents/registry";
import { COUNCIL_IDS } from "@/lib/council/types";

export function GET() {
  return NextResponse.json({
    ok: true,
    system: "META SUPREME X",
    aiConfigured: aiConfigured(),
    models: MODELS,
    councils: COUNCIL_IDS.length,
    agents: AGENT_IDS.length,
  });
}
