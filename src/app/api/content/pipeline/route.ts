import { NextResponse } from "next/server";
import {
  PIPELINE_STAGES,
  PIPELINE_STATUSES,
  STATUS_TRANSITIONS,
  canTransition,
  DEFAULT_AUDIT_LANDING_URL,
  BRANDS,
  N8N_WORKFLOW,
  PIPELINE_SERVICES,
  PIPELINE_TRIGGERS,
  AIRTABLE_BASE_ID,
} from "@/lib/content/pipeline";

/**
 * GET /api/content/pipeline
 * Canonical pipeline definition aligned with TQO FINAL V5.
 * Does not call Airtable — live row status stays in n8n/Airtable.
 */
export async function GET() {
  return NextResponse.json({
    workflow: N8N_WORKFLOW,
    auditLandingUrl: DEFAULT_AUDIT_LANDING_URL,
    airtableBaseId: AIRTABLE_BASE_ID,
    brands: BRANDS,
    statuses: PIPELINE_STATUSES,
    stages: PIPELINE_STAGES,
    transitions: STATUS_TRANSITIONS,
    services: PIPELINE_SERVICES,
    triggers: PIPELINE_TRIGGERS,
    productionEngine: {
      scripting: "n8n · Claude + Script Doctor + Originality Scan",
      promote: "n8n · TQO M/W/F · NCO Tue",
      render: "Voice Router (ElevenLabs clone | Piper free) + Pexels + self-hosted worker",
      packaging: "Manifest atomizer + multi-platform packaging",
      humanCheckpoint: "Human Review required before Published (never automatic)",
      analytics: "Daily 5am YouTube stats + comment signal recurrence",
      repurpose: "Every 30m folder drops for platform workflows",
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
