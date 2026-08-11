import { NextRequest, NextResponse } from "next/server";
import { PLANS } from "@/lib/billing/plans";

/**
 * Creates a Stripe Checkout Session when STRIPE_SECRET_KEY is configured.
 * Without keys, returns a clear setup payload (no silent failure).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const planId = typeof body.planId === "string" ? body.planId : "operator";
  const plan = PLANS.find((p) => p.id === planId);

  if (!plan || plan.id === "free") {
    return NextResponse.json(
      { error: "Choose a paid plan", plans: PLANS.map((p) => p.id) },
      { status: 400 },
    );
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message:
        "STRIPE_SECRET_KEY is not set. Add Stripe keys in Vercel env to enable checkout.",
      plan,
    });
  }

  const priceId =
    (plan.stripePriceEnv && process.env[plan.stripePriceEnv]) ||
    process.env.STRIPE_PRICE_OPERATOR;

  if (!priceId) {
    return NextResponse.json({
      ok: false,
      configured: false,
      message: "Stripe Price ID missing (STRIPE_PRICE_OPERATOR).",
      plan,
    });
  }

  const origin = req.headers.get("origin") || "https://quiet-operator.vercel.app";

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancel`,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: data?.error?.message || "Stripe error" },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true, configured: true, url: data.url, id: data.id });
}
