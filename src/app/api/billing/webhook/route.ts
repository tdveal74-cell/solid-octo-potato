import { NextRequest, NextResponse } from "next/server";
import { verifyStripeSignature } from "@/lib/billing/stripe-signature";
import { upsertSubscription, writeAuditLog, isDbConfigured } from "@/lib/db/client";
import type { StoredSubscription } from "@/lib/db/client";

/**
 * Stripe's return path.
 *
 * `/api/billing/checkout` builds a real Checkout Session and sends the customer
 * to Stripe — and then nothing listened. A customer could complete payment and
 * this application would never learn it happened: no subscription row, no tier
 * change, nothing. Checkout without a webhook is a one-way door.
 *
 * The success_url is not a substitute. It fires in the customer's browser, so it
 * can be navigated to directly by anyone, never fires if they close the tab, and
 * carries no proof that money moved. Stripe's own guidance is that fulfilment
 * belongs here, behind a signature.
 */

// The signature covers the raw body bytes, so this must never run through a
// body parser that normalises them.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Stripe's price/product tiers mapped onto the schema's `tier` check. */
function tierFor(priceId: string | undefined): StoredSubscription["tier"] {
  if (!priceId) return "operator";
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE) return "enterprise";
  if (priceId === process.env.STRIPE_PRICE_OPERATOR_PRO) return "operator-pro";
  return "operator";
}

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
};

export async function POST(req: NextRequest) {
  // Read the body as text, once, before anything else touches it.
  const rawBody = await req.text();

  const verdict = verifyStripeSignature({
    rawBody,
    header: req.headers.get("stripe-signature"),
    secret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    nowSeconds: Math.floor(Date.now() / 1000),
  });

  if (!verdict.ok) {
    // 400, and no detail about which check failed beyond what we log. An
    // unauthenticated caller learning "the timestamp was fine but the digest
    // was wrong" is being handed a probe.
    console.warn("[billing/webhook] rejected:", verdict.reason);
    return NextResponse.json({ error: "Signature verification failed" }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Body is not JSON" }, { status: 400 });
  }

  // Past this line the request is provably from Stripe.
  const object = event.data?.object ?? {};

  if (!isDbConfigured()) {
    // 500 on purpose. A 2xx tells Stripe the event was handled and it stops
    // retrying — so acknowledging an event we could not persist would silently
    // drop a real payment. Failing makes Stripe redeliver once the database is
    // configured, which is the outcome we want.
    console.error("[billing/webhook] database not configured; refusing to acknowledge", event.type);
    return NextResponse.json({ error: "Storage unavailable" }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscriptionId =
        (object.subscription as string | undefined) ?? (object.id as string | undefined);

      if (!subscriptionId) {
        // Acknowledged: a malformed event will never become well-formed on
        // retry, so asking Stripe to send it again forever helps nobody.
        console.warn("[billing/webhook] no subscription id on", event.type);
        return NextResponse.json({ received: true, ignored: "no subscription id" });
      }

      const items = (object.items as { data?: Array<{ price?: { id?: string } }> } | undefined)?.data;
      const priceId = items?.[0]?.price?.id;
      const periodEnd = object.current_period_end as number | undefined;

      const saved = await upsertSubscription({
        stripeSubscriptionId: subscriptionId,
        stripeCustomerId: (object.customer as string | undefined) ?? null,
        // Set at checkout time via client_reference_id; absent for events that
        // do not carry it, which the schema permits.
        profileId: (object.client_reference_id as string | undefined) ?? null,
        tier: tierFor(priceId),
        status:
          event.type === "customer.subscription.deleted"
            ? "canceled"
            : ((object.status as string | undefined) ?? "active"),
        currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      });

      if (!saved.ok) {
        // Same reasoning as above: do not acknowledge what was not stored.
        console.error("[billing/webhook] persist failed:", saved.reason);
        return NextResponse.json({ error: "Could not record subscription" }, { status: 500 });
      }

      await writeAuditLog({
        action: `billing.${event.type}`,
        target: subscriptionId,
        detail: { eventId: event.id, tier: saved.data.tier, status: saved.data.status },
      });

      return NextResponse.json({ received: true, subscription: saved.data.id });
    }

    default:
      // Acknowledged rather than errored. Stripe sends whatever the endpoint is
      // subscribed to; an unrecognised type is not a failure, and 500-ing on it
      // would put a healthy endpoint into permanent retry.
      return NextResponse.json({ received: true, ignored: event.type });
  }
}
