import { NextResponse } from "next/server";
import { z } from "zod";
import { aiConfigured } from "@/lib/ai/client";
import { deliberate } from "@/lib/council/engine";
import { COUNCIL_IDS } from "@/lib/council/types";

export const maxDuration = 300;

const BodySchema = z.object({
  question: z.string().min(8, "question must be at least 8 characters"),
  context: z.string().optional(),
  councils: z
    .array(z.enum(COUNCIL_IDS as [string, ...string[]]))
    .nonempty()
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
