import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfigured } from "@/lib/ai/client";
import { deliberate } from "@/lib/council/engine";
import {
  DEGRADED_NOTICE,
  deliberateOffline,
  isProviderUnavailable,
} from "@/lib/council/fallback";
import { COUNCIL_IDS } from "@/lib/council/types";

export const maxDuration = 300;

const BodySchema = z.object({
  question: z.string().min(8, "question must be at least 8 characters").max(4000),
  context: z.string().max(24000).optional(),
  councils: z
    .array(z.enum(COUNCIL_IDS as [string, ...string[]]))
    .nonempty()
    .max(32)
    .transform((ids) => [...new Set(ids)])
    .optional(),
  debate: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const deliberationRequest = {
    question: parsed.data.question,
    context: parsed.data.context,
    councils: parsed.data.councils as never,
    debate: parsed.data.debate,
  };

  if (!aiConfigured()) {
    return NextResponse.json(deliberateOffline(deliberationRequest), {
      headers: { "x-tqo-execution-mode": "degraded" },
    });
  }

  try {
    const result = await deliberate(deliberationRequest);
    return NextResponse.json(result, {
      headers: { "x-tqo-execution-mode": "live" },
    });
  } catch (err) {
    console.error("[council/deliberate]", err);
    if (isProviderUnavailable(err)) {
      return NextResponse.json(
        deliberateOffline(
          deliberationRequest,
          `${DEGRADED_NOTICE} The provider rejected or could not serve the live request.`
        ),
        { headers: { "x-tqo-execution-mode": "degraded" } }
      );
    }
    return NextResponse.json({ error: "Deliberation failed" }, { status: 500 });
  }
}
