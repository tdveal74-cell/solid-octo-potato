import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import PricingPage from "@/app/pricing/page";
import {
  DEFAULT_OPERATOR_PAYMENT_LINK,
  operatorCheckout,
  operatorPaymentLink,
} from "@/lib/billing/operator-checkout";

const LIVE_OPERATOR_LINK = "https://buy.stripe.com/5kQ28keGi7ti61KeUX04802";

function operatorBuyTag(html: string): string {
  const tag = html.match(/<a\b[^>]*>Continue with Stripe<\/a>/)?.[0];
  expect(tag, html).toBeTruthy();
  return tag as string;
}

function hrefOf(tag: string): string | undefined {
  return tag.match(/href="([^"]*)"/)?.[1];
}

describe("Operator payment link", () => {
  const previous = {
    secret: process.env.STRIPE_SECRET_KEY,
    link: process.env.NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK,
  };

  afterEach(() => {
    if (previous.secret === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = previous.secret;
    if (previous.link === undefined) delete process.env.NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK;
    else process.env.NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK = previous.link;
  });

  it("defaults to the live Operator Payment Link", () => {
    expect(DEFAULT_OPERATOR_PAYMENT_LINK).toBe(LIVE_OPERATOR_LINK);
    expect(operatorPaymentLink({})).toBe(LIVE_OPERATOR_LINK);
    expect(operatorCheckout({})).toEqual({
      mode: "payment-link",
      href: LIVE_OPERATOR_LINK,
    });
  });

  it("lets NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK replace the default", () => {
    const override = "https://buy.stripe.com/test_override";
    expect(
      operatorPaymentLink({ NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK: override }),
    ).toBe(override);
    expect(operatorPaymentLink({ NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK: "  " })).toBe(
      LIVE_OPERATOR_LINK,
    );
  });

  it("uses the Checkout Session route only when STRIPE_SECRET_KEY is set", () => {
    expect(operatorCheckout({ STRIPE_SECRET_KEY: "sk_test_present" })).toEqual({ mode: "api" });
    expect(operatorCheckout({ STRIPE_SECRET_KEY: "   " }).mode).toBe("payment-link");
  });

  it("renders the Operator button as that exact payment link", () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK;

    const html = renderToStaticMarkup(createElement(PricingPage));
    const href = hrefOf(operatorBuyTag(html));

    expect(href).toBe(LIVE_OPERATOR_LINK);
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="mailto:hello@quietoperator.app"');
  });

  it("keeps the API button when a secret key is configured", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_present";
    delete process.env.NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK;

    const html = renderToStaticMarkup(createElement(PricingPage));

    expect(html).not.toContain("buy.stripe.com");
    expect(html).toContain("<button");
    expect(html).toContain("Continue with Stripe");
    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="mailto:hello@quietoperator.app"');
  });
});
