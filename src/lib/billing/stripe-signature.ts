import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Stripe webhook signature.
 *
 * This is the whole security of the webhook. The endpoint has to be public —
 * Stripe calls it from its own infrastructure, so there is no session and no
 * bearer token to check. Without signature verification anyone who learns the
 * URL can POST a `customer.subscription.updated` body and hand themselves an
 * enterprise plan. The signature is what makes the request's *origin* provable,
 * and it is the only thing that does.
 *
 * Stripe signs `${timestamp}.${rawBody}` with HMAC-SHA256 under the endpoint's
 * signing secret and sends it as:
 *
 *     Stripe-Signature: t=1719000000,v1=<hex>,v1=<hex>
 *
 * Notes that matter:
 *
 *  - The signed payload is the **raw body bytes**. Parsing to JSON and
 *    re-serialising changes whitespace and key order, so the HMAC no longer
 *    matches. Callers must hand this the exact string they received.
 *  - There can be more than one `v1` — during a secret rotation Stripe sends a
 *    signature per active secret. Any match is a pass.
 *  - The timestamp is checked against a tolerance. Without it a valid signed
 *    body captured once could be replayed forever; Stripe's own libraries
 *    default to five minutes and so does this.
 */

export type SignatureVerdict = { ok: true } | { ok: false; reason: string };

/** Stripe's own default. Five minutes of clock skew and network latency. */
const DEFAULT_TOLERANCE_SECONDS = 300;

export function verifyStripeSignature(opts: {
  /** The exact body bytes as received — never a re-serialised object. */
  rawBody: string;
  /** The `Stripe-Signature` header, verbatim. */
  header: string | null;
  secret: string;
  /** Seconds since epoch. Injected so the replay window is testable. */
  nowSeconds: number;
  toleranceSeconds?: number;
}): SignatureVerdict {
  const { rawBody, header, secret, nowSeconds } = opts;
  const tolerance = opts.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;

  if (!header) return { ok: false, reason: "Missing Stripe-Signature header" };
  if (!secret) return { ok: false, reason: "STRIPE_WEBHOOK_SECRET is not configured" };

  let timestamp: string | undefined;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [key, value] = part.trim().split("=", 2);
    if (key === "t") timestamp = value;
    // Only the v1 scheme. v0 exists for a different product and must not be
    // accepted here — treating an unknown scheme as valid would be the bug.
    else if (key === "v1" && value) signatures.push(value);
  }

  if (!timestamp || !/^\d+$/.test(timestamp)) {
    return { ok: false, reason: "Signature header carries no usable timestamp" };
  }
  if (signatures.length === 0) {
    return { ok: false, reason: "Signature header carries no v1 signature" };
  }

  const age = nowSeconds - Number(timestamp);
  if (age > tolerance) {
    return { ok: false, reason: `Signature is ${age}s old, past the ${tolerance}s replay window` };
  }
  // A timestamp far in the future is equally suspect — it would extend the
  // replay window rather than close it.
  if (age < -tolerance) {
    return { ok: false, reason: "Signature timestamp is in the future" };
  }

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`, "utf8").digest("hex");

  // Compared without early exit so a wrong signature cannot be discovered a
  // character at a time by measuring how long the rejection took.
  const matched = signatures.some((candidate) => {
    if (candidate.length !== expected.length) return false;
    return timingSafeEqual(Buffer.from(candidate, "utf8"), Buffer.from(expected, "utf8"));
  });

  return matched ? { ok: true } : { ok: false, reason: "No v1 signature matched the computed digest" };
}
