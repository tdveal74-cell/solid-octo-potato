/**
 * How /pricing sells the Operator plan.
 *
 * The live site has no Stripe secret, so the buy control is a Payment Link:
 * a public URL, no API key, and the browser navigates straight there. When
 * STRIPE_SECRET_KEY is set, the page uses the Checkout Session route instead.
 * The link is overridable so a later swap does not require an edit.
 */

export const DEFAULT_OPERATOR_PAYMENT_LINK =
  "https://buy.stripe.com/5kQ28keGi7ti61KeUX04802";

/** Public override. Blank falls through to the live link above. */
export const OPERATOR_PAYMENT_LINK_ENV = "NEXT_PUBLIC_STRIPE_OPERATOR_PAYMENT_LINK";

export type OperatorCheckout =
  | { mode: "payment-link"; href: string }
  | { mode: "api" };

type Env = Record<string, string | undefined>;

export function operatorPaymentLink(env: Env = process.env): string {
  const configured = env[OPERATOR_PAYMENT_LINK_ENV]?.trim();
  return configured || DEFAULT_OPERATOR_PAYMENT_LINK;
}

/** API checkout only when a secret is actually present. Otherwise the link. */
export function operatorCheckout(env: Env = process.env): OperatorCheckout {
  if (env.STRIPE_SECRET_KEY?.trim()) return { mode: "api" };
  return { mode: "payment-link", href: operatorPaymentLink(env) };
}
