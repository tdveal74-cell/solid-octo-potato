import { operatorCheckout } from "@/lib/billing/operator-checkout";
import { PricingView } from "./pricing-view";

/**
 * Server component so STRIPE_SECRET_KEY is read here and never in the browser.
 * The client view only receives the already-chosen mode.
 */
export default function PricingPage() {
  return <PricingView checkout={operatorCheckout()} />;
}
