import { NextResponse } from "next/server";
import {
  PIPELINE_STAGES,
  PIPELINE_STATUSES,
  STATUS_TRANSITIONS,
  canTransition,
  DEFAULT_AUDIT_LANDING_URL,
} from "@/lib/content/pipeline";

/**
 * GET /api/content/pipeline
 * Returns the canonical pipeline definition so the UI and n8n stay aligned.
 * Does not call Airtable — status of live rows stays in n8n/Airtable.
 */
export async function GET() {
  return NextResponse.json({
    name: "TQO Content Pipeline",
    auditLandingUrl: DEFAULT_AUDIT_LANDING_URL,
    statuses: PIPELINE_STATUSES,
    stages: PIPELINE_STAGES,
    transitions: STATUS_TRANSITIONS,
    productionEngine: {
      scripting: "n8n · Daily 6am · Claude",
      promote: "n8n · Mon/Wed/Fri 7am",
      render: "n8n · ElevenLabs TTS + JSON2Video",
      packaging: "n8n · Platform Packaging Pipeline",
      humanCheckpoint: "Ready → Published (never automatic)",
    },
    note: "Live row status lives in Airtable. This endpoint is the contract, not the queue.",
  });
}

/**
 * POST /api/content/pipeline
 * Validate a proposed status transition without touching external systems.
 * Body: { from: PipelineStatus, to: PipelineStatus }
 */
export async function POST(request: Request) {
  let body: { from?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const from = body.from as keyof typeof STATUS_TRANSITIONS;
  const to = body.to as keyof typeof STATUS_TRANSITIONS;

  if (!PIPELINE_STATUSES.includes(from as never) || !PIPELINE_STATUSES.includes(to as never)) {
    return NextResponse.json(
      { error: "Unknown status", valid: PIPELINE_STATUSES },
      { status: 400 },
    );
  }

  const allowed = canTransition(from, to);
  return NextResponse.json({
    from,
    to,
    allowed,
    nextAllowed: STATUS_TRANSITIONS[from],
  });
}
