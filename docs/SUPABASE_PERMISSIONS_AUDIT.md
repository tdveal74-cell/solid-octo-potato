# TQO Data API permission audit

Date: October 21, 2026. Repository baseline: `34982f90a3e52736b9079a7af62612cbb09e1ed2`.

Status: repository correction for review. No hosted database grants, policies,
configuration, migration history, or production rows were changed by this audit.

## Finding and evidence

Supabase's October 20 notice and [official rollout announcement](https://github.com/orgs/supabase/discussions/45329)
confirm that new public-schema tables on existing projects need explicit Data API
grants starting October 30. Existing table grants remain intact. Grants and RLS
are separate controls; a service role's BYPASSRLS attribute does not replace a
table grant. See [Supabase's security guide](https://supabase.com/docs/guides/api/securing-your-api).

The repository had one bootstrap SQL file and no tracked migration directory.
Neither that file nor the two hosted migrations contained explicit grants or
revokes. No open repository PR already addressed this change.

Read-only catalog inspection found all twelve matching application tables in
project `bjdgzpbiyqsjcmzleogs`, PostgreSQL 17.6. All have RLS enabled. Existing
table grants give `anon`, `authenticated`, and `service_role` SELECT, INSERT,
UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER. Creation defaults also remain
broad. This confirms a deployed matching schema, but does not establish which
deployed web application currently uses that project.

The hosted migration history is now captured in the repository, preserving its
version numbers and SQL statements:

- `20260812180827_quiet_operator_initial_schema.sql`
- `20260812180934_pin_match_chunks_search_path.sql`

The second migration pins the RPC search path. The bootstrap file was missing
that fix; it now matches. Historical migrations are not rewritten. The new
permission migration runs after them during a fresh reset or a future upgrade.
It was created using `supabase migration new explicit_data_api_permissions`
with CLI 2.121.0.

## Access contract

There is no browser Supabase client in `src/`. All implemented database requests
go through the server's PostgREST wrapper in `src/lib/db/client.ts`, using
`SUPABASE_SERVICE_ROLE_KEY`. No key values were retrieved, published, or changed.

| Object | Observed caller / purpose | Explicit service_role rights | anon / authenticated |
|---|---|---|---|
| `job_security_audits` | `saveAudit`, `listAuditsFor`, `getAudit` | SELECT, INSERT | None |
| `subscriptions` | `upsertSubscription`, called after Stripe signature verification | SELECT, INSERT, UPDATE | None |
| `audit_log` | `writeAuditLog`, billing webhook | INSERT only | None |
| `organizations`, `profiles` | Schema only; no Data API caller | None | None |
| `career_roadmaps`, `deliberations`, `agent_runs`, `user_memories`, `content_pieces` | Schema only; no persistence caller | None | None |
| `knowledge_documents`, `knowledge_chunks` | No implemented Supabase VectorStore adapter | None | None |
| `match_chunks(vector,integer,uuid)` | No implemented RPC caller | No EXECUTE | No EXECUTE |
| `audit_log_id_seq` | GENERATED ALWAYS AS IDENTITY | No direct sequence rights required | None |

The audit persistence helpers are implemented but the current career HTTP route
does not call them. Their minimal permissions support that existing database
interface without claiming that audit persistence is connected to the UI.
The RAG comment describes Supabase, but its only concrete store in this repository
is the in-memory implementation. That comment is not evidence for granting RPC
or knowledge-table access.

SELECT is necessary for audit insert representations and subscription upsert
representations. UPDATE is necessary for repeated Stripe subscription upserts.
DELETE, TRUNCATE, REFERENCES, TRIGGER, and direct sequence access have no
application justification. Audit-log writes request no returned records.

The new migration first removes legacy broad rights from only these twelve
named tables, the named identity sequence, and the named function, including
PUBLIC privileges. It then grants the listed operations. It does not alter
global default privileges, unrelated tables, other schemas, or any RLS policy.
The SQL is transactional and repeatable. The standalone bootstrap embeds the
same contract and is transactional too.

## Tests and reproduction

`npm run test:db` runs real SQL against disposable PostgreSQL via PGlite by
default. The local fallback is PostgreSQL 18.6 in WASM. It supports pgvector but
not pgcrypto, so that fallback skips only the pgcrypto extension-install line.
The schema uses PostgreSQL's built-in `gen_random_uuid()`. This fallback alone
is not a native Supabase-stack or PostgreSQL 17 certification.

The `database-permissions` CI job uses native PostgreSQL 17 with pgvector and
PostgREST 16.5. It applies all SQL unmodified, including pgcrypto. PostgREST's
download is pinned and SHA-256 verified. No cloud credentials are required.

The suite covers:

- The original schema's SQLSTATE 42501 failure when automatic grants are absent.
- Fresh bootstrap and ordered migrations with both absent and legacy broad
  defaults; repeat application; all 12 tables' grants and RLS flags.
- Upgrade from legacy grants with all existing fixture rows and policies unchanged.
- Identity-backed log insertion with no direct sequence rights.
- Retained RLS ownership filtering for two users, inherited knowledge-chunk
  privacy, denied billing reads, and denied owner reassignment. Temporary grants
  used to exercise those policies are rolled back and never enter the migration.
- Real HTTP calls through the application's database client: audit insertion,
  owner-filtered listing, repeated subscription upserts, and log insertion.
- HTTP denials for anonymous and authenticated roles across all 12 tables;
  rejected billing creation, tier changes and deletion; no-token and invalid-token
  access; no RPC EXECUTE; denied service-role reads on unneeded tables and DELETE
  on subscriptions.

To run the complete HTTP test locally, use a disposable PostgreSQL server with
pgvector and a downloaded PostgREST binary:

```bash
TQO_TEST_POSTGRES_URL=postgresql://postgres:TEST_PASSWORD@127.0.0.1:5432/postgres \
POSTGREST_BIN=/absolute/path/to/postgrest npm run test:db
```

The harness accepts only loopback database hosts, creates unique test databases,
and removes those databases on completion. It never uses `DATABASE_URL` or real
Supabase keys. Without both test variables, the HTTP test is explicitly skipped;
the SQL tests still run. CI supplies both variables.

## Migration process and live checks

For a fresh local Supabase stack, the checked-in config sets
`api.auto_expose_new_tables = false`, matching the upcoming permission model.
Use CLI 2.121.0 with Docker:

```bash
npx --yes supabase@2.121.0 start
npx --yes supabase@2.121.0 db reset --local --no-seed
```

This full Docker/Supabase reset is separate from the native database tests.
For a standalone Supabase-compatible database, the existing bootstrap path is:

```bash
psql -X -v ON_ERROR_STOP=1 "$DATABASE_URL" -f src/lib/db/schema.sql
```

Before any hosted application of this correction:

1. Confirm the deployment's Supabase URL matches the inspected project. Inventory
   external jobs, onboarding/provisioning, and RPC callers not present in this repo.
   The narrowed rights intentionally stop undocumented service-role operations.
2. Confirm the hosted migration history still matches the two captured entries.
   Review `supabase migration list` and `supabase db push --dry-run` after linking
   the correct project. Do not reset the hosted database or repair history merely
   to force it to match.
3. Review the project's Data API enabled/exposed-schema settings. Catalog role
   settings did not reveal that control-plane configuration. `pg_graphql` was not
   installed at audit time; no GraphQL client exists in the repository. GraphQL
   transport behavior has not been tested or enabled by this change.
4. Verify the native database CI and application quality gates, then test a
   preview/staging deployment with real authenticated users and Stripe test
   events before applying the new permission migration to production.

No production migration or deployment is part of this review PR. No rollback
that restores blanket anonymous grants is supplied. If an undocumented required
caller is discovered, add only its justified operation through a reviewed change.

## Existing issues that remain separate

- The service role bypasses RLS. `listAuditsFor` filters by owner, but `getAudit(id)`
  has no owner argument. It currently has no route caller. Do not expose it to
  users without a trusted session-derived owner check.
- The `member org` policy is actually `FOR ALL`, despite its read-only comment;
  the own-profile policy also permits broad row edits if table grants are added.
  These policies are preserved here, and browser grants stay absent. A future
  direct-client access feature needs separate column/organization authorization
  design, including protection of plan and membership fields.
- The billing webhook may receive events without `client_reference_id`, but the
  subscription constraint requires a profile or organization. Valid-profile
  upserts are tested here; Stripe event-to-owner resolution is a separate issue.
- Supabase's live Security Advisor reports the three intentional no-policy tables
  (`subscriptions`, `deliberations`, `audit_log`) and the vector extension in
  public. The no-policy tables must stay closed. Extension relocation is not
  attempted; [Supabase's extension guidance](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)
  requires a separate compatibility review.
