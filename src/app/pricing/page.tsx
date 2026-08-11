"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/billing/plans";

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
    <main className="min-h-screen bg-[#07090d] text-[#e8eaef] px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm text-[#9aa3b5]">
          <Link href="/" className="hover:text-white">
            Quiet Operator
          </Link>
          {" / "}
          Pricing
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-tight">Plans</h1>
        <p className="mt-2 text-[#9aa3b5]">
          Loud tools make noise. Quiet operators make moves.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="rounded-2xl border border-white/10 bg-[#10151d] p-6 flex flex-col"
            >
              <h2 className="text-xl text-white">{plan.name}</h2>
              <p className="mt-2 text-2xl text-[#c9a86a]">
                {plan.priceUsdMonthly === 0 && plan.id !== "enterprise"
                  ? "$0"
                  : plan.id === "enterprise"
                    ? "Custom"
                    : `$${plan.priceUsdMonthly}/mo`}
              </p>
              <p className="mt-3 text-sm text-[#9aa3b5]">{plan.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-[#c8cdd8] flex-1">
                {plan.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
              {plan.id === "operator" ? (
                <button
                  type="button"
                  disabled={busy === plan.id}
                  onClick={() => checkout(plan.id)}
                  className="mt-6 rounded-xl bg-[#c9a86a] px-4 py-2.5 text-sm font-medium text-[#07090d] disabled:opacity-60"
                >
                  {busy === plan.id ? "Starting…" : "Continue with Stripe"}
                </button>
              ) : plan.id === "free" ? (
                <Link
                  href="/dashboard"
                  className="mt-6 rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm"
                >
                  Open dashboard
                </Link>
              ) : (
                <a
                  href="mailto:hello@quietoperator.app"
                  className="mt-6 rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm"
                >
                  Contact
                </a>
              )}
            </div>
          ))}
        </div>

        {message && (
          <p className="mt-8 rounded-xl border border-white/10 bg-[#141822] p-4 text-sm text-[#c8cdd8]">
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
