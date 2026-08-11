# The Quiet Operator — Complete

**Live:** https://quiet-operator.vercel.app

## Shipped

- Council · agents · career audit · content V5 board
- Production AI (`aiConfigured: true`)
- Pricing page + Stripe Checkout API (activates when Stripe env vars are set)
- DB schema ready for Supabase (`src/lib/db/schema.sql`)

## Your keys to flip live billing

```
STRIPE_SECRET_KEY=
STRIPE_PRICE_OPERATOR=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

Then open `/pricing` → Operator → Checkout.
