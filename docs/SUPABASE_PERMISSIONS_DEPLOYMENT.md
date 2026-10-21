# Supabase permission deployment receipt

Date: October 21, 2026.
Authorization: user explicitly requested "Merge & deploy" after reviewing PR #9.

## Deployment

- [PR #9](https://github.com/tdveal74-cell/solid-octo-potato/pull/9) merged to main.
- Reviewed head: `110108a7e6acceb647e531133d14eecf00dfa550`.
- Merge commit: `625e7ad7a339b659a1ac5405c8038f844eaf46a5`.
- Supabase project: `bjdgzpbiyqsjcmzleogs`.
- Recorded migration: `20261021091846_explicit_data_api_permissions`.
- The hosted migration's SQL exactly matches the reviewed SQL after trimming
  surrounding whitespace. No application table data was inserted, updated,
  deleted, or reset. No RLS policy was changed.

The Supabase migration API assigned its execution timestamp, replacing the
pre-deployment local filename timestamp `20261021085401`. The repository file was
renamed to the actual recorded version without changing its SQL. The remote
migration history was not rewritten and the migration was not applied twice.

## Verification

| Check | Result |
|---|---|
| Native PostgreSQL 17.8 + pgvector + PostgREST 16.5 tests | 7 of 7 passed, including authorized and unauthorized HTTP requests |
| Standard test suite, TypeScript, production build | 106 tests passed, typecheck passed, build passed |
| Live effective table permissions | 288 checks across 12 tables, 3 roles and 8 privileges; zero mismatches |
| Live RLS flags | Enabled on all 12 application tables |
| Live ownership and billing policies | All 9 policy definitions unchanged from pre-deployment snapshot |
| Live service-role reads | Read-only queries on audits and subscriptions succeeded |
| Live anonymous Data API access | GET requests with a publishable key to all 12 tables returned HTTP 401 / SQLSTATE 42501 |
| Unused RPC and identity-sequence rights | No EXECUTE on match_chunks or direct sequence access for anon, authenticated, or service_role |
| Application row counts | All 12 tables were empty before and after deployment |
| Hosted migration content | Matches the reviewed permission SQL |

Pre-merge test evidence: [CI run 39574053076](https://github.com/tdveal74-cell/solid-octo-potato/actions/runs/39574053076).
HTTP verification used `limit=0`; it did not retrieve private record contents.
Privileged write paths were exercised in the disposable native test database,
not by inserting synthetic billing or audit rows into the hosted project.

## Website closeout verification

On October 21, Vercel reported the production deployment
`dpl_DjoDJYsPWCcrZVLXQkK2BHC3cJox` as READY, built from merge commit
`625e7ad7a339b659a1ac5405c8038f844eaf46a5`, with the alias
[quiet-operator.vercel.app](https://quiet-operator.vercel.app).
The subsequent receipt-only merge changes no application runtime files.

| Check | Result |
|---|---|
| Public pages | `/`, `/pricing`, `/dashboard`, `/audit`, `/council`, `/content`: HTTP 200 |
| Public API reads | `/api/health` and `/api/agents`: HTTP 200 |
| Invalid checkout plan | HTTP 400; no Checkout Session created |
| Unsigned billing webhook | HTTP 400; signature verification failed |
| Vercel project environment inventory | Only `ANTHROPIC_API_KEY`, targeting preview and production; zero hidden production variables reported |
| Stripe live webhook inventory | No registered webhook endpoints in THE QUIET OPERATOR account |
| Ownerless subscription reproduction | Disposable PostgreSQL rejected the insert with SQLSTATE 23514, `subscriptions_check` |

These were ordinary public HTTPS requests. No deployment-authentication bypass,
real payment, Stripe customer/subscription creation, or hosted database write was
used. Secret values were not decrypted. The health endpoint's `aiConfigured`
response describes AI configuration only; it does not establish billing or
database readiness. HTTP smoke checks do not certify a browser checkout journey.

## Scope and remaining integration limits

The database permission fix is deployed. This change does not require replacing
the web application bundle: no application runtime code changed.

There are no deployed Edge Functions in this Supabase project. Before deployment,
database activity counters and exact counts showed no application rows. This is
not proof of every external consumer's configuration. The Vercel project has no
Supabase or Stripe environment settings, so there is no configured website
Supabase URL to match to the inspected project. Stripe has no registered webhook
endpoint, and the current connector exposes only the live account. A full
browser-session/Stripe-event journey remains unverified. Adding secrets alone is
insufficient: checkout does not establish the profile ownership required by the
subscription schema. The concrete prerequisites and test gates are tracked in
[the billing acceptance checklist](BILLING_INTEGRATION_ACCEPTANCE.md).
GraphQL is not installed and was not enabled or tested. No new paid preview
project or branch was created.

The Security Advisor returned the same pre-existing findings: three intentionally
closed tables have RLS with no policies, and the vector extension is in public.
No new finding was introduced. See
[Supabase's extension guidance](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
before any separate extension relocation.

The original audit records the separate getAudit ownership, organization-policy,
and Stripe event-to-owner issues. Those application behaviors were not changed
by this permission deployment. The Supabase October 30 compatibility work is
complete; this receipt does not claim that live billing has been activated or
certified.
