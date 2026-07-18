import { NextResponse } from "next/server";
import { z } from "zod";
import { runAudit } from "@/lib/career/audit";
import { generateRoadmap } from "@/lib/career/roadmap";
import { aiConfigured } from "@/lib/ai/client";

export const maxDuration = 300;

const FactorSchema = z.number().min(0).max(10);

const BodySchema = z.object({
  role: z.string().min(2),
  industry: z.string().optional(),
  yearsExperience: z.number().min(0).max(60).optional(),
  goals: z.string().optional(),
  tasks: z
    .array(
      z.object({
        name: z.string().min(1),
        timeShare: z.number().min(0).max(100),
        factors: z.object({
          routineness: FactorSchema,
          digitalness: FactorSchema,
          creativity: FactorSchema,
          interpersonal: FactorSchema,
          physical: FactorSchema,
        }),
      })
    )
    .min(1)
    .max(20),
  /** When true (and AI is configured), also generate the roadmap. */
  includeRoadmap: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { tasks, includeRoadmap, ...profile } = parsed.data;

  // The audit itself is deterministic — no API key required.
  const audit = runAudit(tasks);

  if (!includeRoadmap) {
    return NextResponse.json({ audit, roadmap: null });
  }
  if (!aiConfigured()) {
    return NextResponse.json(
      { audit, roadmap: null, warning: "Roadmap skipped: ANTHROPIC_API_KEY not configured" },
      { status: 200 }
    );
  }

  try {
    const roadmap = await generateRoadmap({ ...profile, audit });
    return NextResponse.json({ audit, roadmap });
  } catch (err) {
    console.error("[career/audit]", err);
    return NextResponse.json(
      { audit, roadmap: null, warning: "Roadmap generation failed" },
      { status: 200 }
    );
  }
}
