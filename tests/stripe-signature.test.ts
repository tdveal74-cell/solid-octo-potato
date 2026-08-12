import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyStripeSignature } from "@/lib/billing/stripe-signature";

const SECRET = "whsec_test_secret";
const NOW = 1_800_000_000;

function sign(body: string, timestamp = NOW, secret = SECRET): string {
  const digest = createHmac("sha256", secret).update(`${timestamp}.${body}`, "utf8").digest("hex");
  return `t=${timestamp},v1=${digest}`;
}

describe("Stripe webhook signature", () => {
  const body = '{"id":"evt_1","type":"customer.subscription.updated"}';

  it("accepts a signature Stripe would have produced", () => {
    expect(verifyStripeSignature({ rawBody: body, header: sign(body), secret: SECRET, nowSeconds: NOW }))
      .toEqual({ ok: true });
  });

  it("rejects a body that was altered after signing", () => {
    // The attack this exists to stop: a real captured signature pasted onto a
    // body that grants a different plan.
    const header = sign(body);
    const tampered = body.replace("evt_1", "evt_2");
    const res = verifyStripeSignature({ rawBody: tampered, header, secret: SECRET, nowSeconds: NOW });
    expect(res.ok).toBe(false);
  });

  it("rejects a signature made with a different secret", () => {
    const header = sign(body, NOW, "whsec_someone_elses");
    expect(verifyStripeSignature({ rawBody: body, header, secret: SECRET, nowSeconds: NOW }).ok).toBe(false);
  });

  it("rejects a missing header rather than treating absence as valid", () => {
    const res = verifyStripeSignature({ rawBody: body, header: null, secret: SECRET, nowSeconds: NOW });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/missing/i);
  });

  it("refuses when no signing secret is configured", () => {
    // Otherwise an unset secret would make the HMAC computable by anyone who
    // guessed it was empty.
    const res = verifyStripeSignature({ rawBody: body, header: sign(body), secret: "", nowSeconds: NOW });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/not configured/i);
  });

  it("rejects a replay outside the tolerance window", () => {
    const header = sign(body, NOW - 600);
    const res = verifyStripeSignature({ rawBody: body, header, secret: SECRET, nowSeconds: NOW });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/replay window/i);
  });

  it("accepts a signature inside the window", () => {
    const header = sign(body, NOW - 120);
    expect(verifyStripeSignature({ rawBody: body, header, secret: SECRET, nowSeconds: NOW }).ok).toBe(true);
  });

  it("rejects a timestamp from the future", () => {
    const header = sign(body, NOW + 3600);
    const res = verifyStripeSignature({ rawBody: body, header, secret: SECRET, nowSeconds: NOW });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/future/i);
  });

  it("accepts when any one of several v1 signatures matches", () => {
    // Stripe sends one signature per active secret during a rotation.
    const good = sign(body).split("v1=")[1];
    const header = `t=${NOW},v1=${"0".repeat(64)},v1=${good}`;
    expect(verifyStripeSignature({ rawBody: body, header, secret: SECRET, nowSeconds: NOW }).ok).toBe(true);
  });

  it("ignores a v0 signature — only the v1 scheme counts", () => {
    const digest = createHmac("sha256", SECRET).update(`${NOW}.${body}`, "utf8").digest("hex");
    const res = verifyStripeSignature({
      rawBody: body,
      header: `t=${NOW},v0=${digest}`,
      secret: SECRET,
      nowSeconds: NOW,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/no v1 signature/i);
  });

  it("rejects a header with no timestamp", () => {
    const digest = sign(body).split("v1=")[1];
    const res = verifyStripeSignature({
      rawBody: body,
      header: `v1=${digest}`,
      secret: SECRET,
      nowSeconds: NOW,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.reason).toMatch(/timestamp/i);
  });

  it("is sensitive to whitespace, which is why the raw body must be preserved", () => {
    // Re-serialising the parsed JSON is the classic way to break this: same
    // data, different bytes, dead signature.
    const header = sign(body);
    const reserialised = JSON.stringify(JSON.parse(body), null, 2);
    expect(verifyStripeSignature({ rawBody: reserialised, header, secret: SECRET, nowSeconds: NOW }).ok).toBe(false);
  });
});
