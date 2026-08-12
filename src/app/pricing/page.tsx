"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/billing/plans";
import {
  Button,
  ButtonLink,
  Card,
  Grid,
  Heading,
  Lede,
  Page,
} from "@/components/ui/primitives";

/** Price line for a plan — free, metered, or "talk to us". */
function priceLabel(plan: (typeof PLANS)[number]): string {
  if (plan.id === "enterprise") return "Custom";
  if (plan.priceUsdMonthly === 0) return "$0";
  return `$${plan.priceUsdMonthly}/mo`;
}

export default function PricingPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function checkout(planId: string) {
    setBusy(planId);
    setMessage(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMessage(data.message || data.error || "Checkout not configured yet.");
    } catch {
      setMessage("Could not reach billing API.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Page>
      <section className="py-16">
        <p className="text-sm text-fog-dim">
          <Link href="/" className="hover:text-fog">
            Quiet Operator
          </Link>
          {" / "}
          Pricing
        </p>
        <Heading level={1} size="lg" className="mt-4">
          Plans
        </Heading>
        <Lede className="mt-2">Loud tools make noise. Quiet operators make moves.</Lede>

        <Grid cols={3} className="mt-10">
          {PLANS.map((plan) => {
            // Brass marks the one plan we are actually asking for. The others
            // are available, not sold.
            const isPrimary = plan.id === "operator";
            return (
              <Card key={plan.id} raised className="flex flex-col p-6">
                <h2 className="text-xl text-fog">{plan.name}</h2>
                <p
                  className={`mt-2 font-[family-name:var(--font-display)] text-2xl tabular-nums ${
                    isPrimary ? "text-brass" : "text-fog"
                  }`}
                >
                  {priceLabel(plan)}
                </p>
                <p className="mt-3 text-sm text-fog-dim">{plan.description}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-fog-dim">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <span aria-hidden className="text-brass-dim">
                        ·
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {isPrimary ? (
                  <Button
                    type="button"
                    disabled={busy === plan.id}
                    onClick={() => checkout(plan.id)}
                    className="mt-6 px-4 py-2.5"
                  >
                    {busy === plan.id ? "Starting…" : "Continue with Stripe"}
                  </Button>
                ) : plan.id === "free" ? (
                  <ButtonLink href="/dashboard" variant="secondary" className="mt-6 px-4 py-2.5">
                    Open dashboard
                  </ButtonLink>
                ) : (
                  <a
                    href="mailto:hello@quietoperator.app"
                    className="mt-6 rounded-sm border border-ink-border px-4 py-2.5 text-center text-sm text-fog transition-colors duration-200 hover:border-brass"
                  >
                    Contact
                  </a>
                )}
              </Card>
            );
          })}
        </Grid>

        {message && (
          <p className="mt-8 rounded-sm border border-ink-border bg-ink-raised p-4 text-sm text-fog-dim">
            {message}
          </p>
        )}
      </section>
    </Page>
  );
}
