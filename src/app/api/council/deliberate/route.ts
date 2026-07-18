import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfigured } from "@/lib/ai/client";
import { deliberate } from "@/lib/council/engine";
import { COUNCIL_IDS } from "@/lib/council/types";

export const maxDuration = 300;

const BodySchema = z.object({
  question: z.string().min(8, "question must be at least 8 characters").max(4000),
  context: z.string().max(24000).optional(),
  // Duplicates are removed so a crafted request can't multiply council
  // fan-out; post-dedupe length is bounded by the 8 distinct council ids.
  councils: z
    .array(z.enum(COUNCIL_IDS as [string, ...string[]]))
    .nonempty()
    .max(32)
    .transform((ids) => [...new Set(ids)])
    .optional(),
  debate: z.boolean().optional(),
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
    const result = await deliberate({
      question: parsed.data.question,
      context: parsed.data.context,
      councils: parsed.data.councils as never,
      debate: parsed.data.debate,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error("[council/deliberate]", err);
    return NextResponse.json({ error: "Deliberation failed" }, { status: 500 });
  }
}
