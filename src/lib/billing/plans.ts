export type PlanId = "free" | "operator" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceUsdMonthly: number;
  description: string;
  features: string[];
  /** Stripe Price ID — set in env when live */
  stripePriceEnv?: string;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    priceUsdMonthly: 0,
    description: "Audit, dashboard, and limited Council when a key is present.",
    features: [
      "Job Security Audit",
      "Dashboard",
      "Content pipeline mirror",
      "Council when AI is configured",
    ],
  },
  {
    id: "operator",
    name: "Operator",
    priceUsdMonthly: 49,
    description: "Full Council throughput and content operations for serious operators.",
    features: [
      "Everything in Free",
      "Higher Council volume",
      "Priority models",
      "Content board workflows",
    ],
    stripePriceEnv: "STRIPE_PRICE_OPERATOR",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    priceUsdMonthly: 0,
    description: "Custom limits, teams, and compliance — contact for pricing.",
    features: [
      "Everything in Operator",
      "Teams & roles",
      "Audit exports",
      "SSO (roadmap)",
    ],
  },
];
