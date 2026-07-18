import { NextResponse } from "next/server";
import { AGENTS, AGENT_IDS } from "@/lib/agents/registry";

export function GET() {
  return NextResponse.json({
    agents: AGENT_IDS.map((id) => {
      const a = AGENTS[id];
      return {
        id: a.id,
        name: a.name,
        description: a.description,
        escalateToCouncil: a.escalateToCouncil,
      };
    }),
  });
}
