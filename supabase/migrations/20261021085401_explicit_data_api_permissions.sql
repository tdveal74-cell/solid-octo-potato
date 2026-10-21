-- Explicit Data API contract for the application at 34982f9.
-- No table data or RLS policies are changed.
begin;
set local search_path = public, extensions;

-- Only server operations implemented in src/lib/db/client.ts are exposed.
-- RLS policies are retained; a policy alone is not a reason to grant access.
-- Reset legacy broad defaults for these named application objects only.
revoke all privileges on table
  public.organizations, public.profiles, public.subscriptions,
  public.job_security_audits, public.career_roadmaps, public.deliberations,
  public.agent_runs, public.user_memories, public.knowledge_documents,
  public.knowledge_chunks, public.content_pieces, public.audit_log
from public, anon, authenticated, service_role;

grant usage on schema public to service_role;
grant select, insert on table public.job_security_audits to service_role;
grant select, insert, update on table public.subscriptions to service_role;
grant insert on table public.audit_log to service_role;

-- GENERATED ALWAYS AS IDENTITY does not need a sequence grant for inserts.
-- Do not permit direct nextval/setval calls on the audit-log sequence.
revoke all privileges on sequence public.audit_log_id_seq
from public, anon, authenticated, service_role;

-- No application RPC caller exists yet. PostgreSQL gives PUBLIC EXECUTE by
-- default, independently of the Data API table-default change.
revoke all privileges on function public.match_chunks(vector, integer, uuid)
from public, anon, authenticated, service_role;

commit;
