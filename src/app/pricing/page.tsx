import { operatorCheckout } from "@/lib/billing/operator-checkout";
import { PricingView } from "./pricing-view";

/**
 * Request time, not build time. A static prerender would freeze the payment
 * link into the HTML, and a secret added only on the running server would
 * never switch the button to Checkout. The key stays on the server; the
 * client receives the chosen mode.
 */
export const dynamic = "force-dynamic";

export default function PricingPage() {
  return <PricingView checkout={operatorCheckout()} />;
}
