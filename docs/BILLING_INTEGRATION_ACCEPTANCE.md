# Billing integration acceptance checklist

Status: open; payment activation is not certified.

## Verified during the October 21 Supabase rollout closeout

The Supabase explicit-permission change is merged and applied (PRs #9 and #10). The production website is READY at https://quiet-operator.vercel.app, deployment `dpl_DjoDJYsPWCcrZVLXQkK2BHC3cJox`, from commit `625e7ad7a339b659a1ac5405c8038f844eaf46a5`. This checklist tracks the separate application integration work needed before billing can be described as end-to-end verified.

### Live configuration evidence

- The Vercel project `prj_t4INEYAuoL0RPEY1cw4or9bNZmfy` lists only `ANTHROPIC_API_KEY`, targeting preview and production. No Supabase URL/service-role key or Stripe secret, price, or webhook settings are present; the response reports zero hidden production variables. Secret values were not decrypted.
- The connected Stripe account is THE QUIET OPERATOR (`acct_1Trbt061jVXy53aN`), live mode. Listing webhook endpoints returned an empty list. No test/sandbox account is available through the current connector.
- Public GETs of /, /pricing, /dashboard, /audit, /council, /content, /api/health and /api/agents returned 200. Health reports AI configured; it does not prove database/billing readiness.
- An invalid checkout plan returned 400. An unsigned webhook returned 400. No Checkout Session, charge, customer, subscription, or hosted database row was created by these checks.

### Code gaps

- There is no authenticated user/profile provisioning journey in `src/`. Checkout sends no `client_reference_id` or subscription ownership metadata.
- The webhook derives `profileId` only from `client_reference_id`, which subscription lifecycle events do not normally carry. `upsertSubscription` writes null when missing, but the database requires a profile or organization. Updates would also erase an existing profile owner.
- Checkout completion is treated as if it contained a full subscription: it defaults tier/status without retrieving the canonical subscription. Unknown price IDs default to Operator.
- Enterprise checkout falls back to the Operator price, and redirect URLs trust the request Origin.
- `getAudit(id)` lacks an owner filter. It has no current HTTP caller; require a trusted session-derived owner before exposing it.

### Acceptance criteria

- [ ] Implement and test a trusted authentication-to-profile mapping before enabling paid checkout; do not accept an arbitrary browser-supplied owner ID or widen anonymous table grants.
- [ ] Require the intended plan's configured price and a trusted application redirect origin.
- [ ] Resolve subscription state and owner reliably for checkout and subscription create/update/delete events, retain ownership, reject unmapped prices, and test replay/out-of-order handling.
- [ ] Test signed events through the route and real PostgREST against a disposable database with two distinct owners; include failed persistence/retries and unauthorized reads/writes.
- [ ] Provision a test/sandbox Stripe integration and isolated application/database configuration; complete the browser checkout and webhook journey there without real charges or production records.
- [ ] Configure the verified production Supabase URL/server-only credential, Stripe prices/secret, and registered webhook signing secret only after the above gates pass; redeploy and verify the exact deployment.
- [ ] Keep RLS, restricted billing grants, and production data intact. Update the deployment receipt with the resulting evidence.

This checklist remains open: the permission rollout is complete, but payment activation is not certified.

GitHub Issues is disabled for this repository (the create-issue API returned HTTP 410). This tracked document preserves the findings and acceptance criteria without changing repository settings.
