/**
 * The database boundary.
 *
 * `src/lib/db` held exactly one file — `schema.sql` — and nothing in the app
 * read it. `.env.example` advertised `DATABASE_URL` and three Supabase keys that
 * no line of code referenced, so the persistence layer was a document rather
 * than a dependency: the schema described tables that had never been created
 * against a database nothing connected to.
 *
 * Everything here goes through Supabase's PostgREST endpoint with the service
 * role key. That choice is deliberate and has a cost worth naming: the service
 * role bypasses row-level security entirely, so every query in this file has to
 * carry its own ownership filter. In exchange, server-side writes work without
 * a user session — which is what a Stripe webhook needs, since it arrives with
 * no user attached at all.
 *
 * Never import this from a client component. The service role key must not
 * reach a browser bundle.
 */

export type DbConfig = { url: string; serviceKey: string };

export type DbResult<T> = { ok: true; data: T } | { ok: false; reason: string };

/**
 * Read the configuration, or say plainly that it is absent.
 *
 * Returning a verdict rather than throwing keeps the "not configured yet" path
 * a first-class answer. A route can report the gap instead of returning a 500
 * that looks like a crash.
 */
export function dbConfig(): DbConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return { url: url.replace(/\/+$/, ""), serviceKey };
}

export function isDbConfigured(): boolean {
  return dbConfig() !== null;
}

type RestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  /** Path under /rest/v1, e.g. "job_security_audits?select=*". */
  path: string;
  body?: unknown;
  /** Ask PostgREST to return the affected rows rather than an empty body. */
  returnRepresentation?: boolean;
  /** Upsert on conflict with this column list. */
  onConflict?: string;
};

async function rest<T>(opts: RestOptions): Promise<DbResult<T>> {
  const cfg = dbConfig();
  if (!cfg) {
    return {
      ok: false,
      reason: "Database is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    };
  }

  const prefer: string[] = [];
  if (opts.returnRepresentation) prefer.push("return=representation");
  if (opts.onConflict) prefer.push("resolution=merge-duplicates");

  const url = new URL(`${cfg.url}/rest/v1/${opts.path}`);
  if (opts.onConflict) url.searchParams.set("on_conflict", opts.onConflict);

  try {
    const res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: {
        apikey: cfg.serviceKey,
        Authorization: `Bearer ${cfg.serviceKey}`,
        "Content-Type": "application/json",
        ...(prefer.length ? { Prefer: prefer.join(",") } : {}),
      },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: "no-store",
    });

    if (!res.ok) {
      // PostgREST explains itself in the body — a constraint name, a failing
      // check. Carrying it out beats a bare status, which would send the reader
      // to the source to guess which constraint bit.
      const detail = await res.text().catch(() => "");
      return {
        ok: false,
        reason: `Database ${opts.method ?? "GET"} failed: HTTP ${res.status}${detail ? ` — ${detail.slice(0, 300)}` : ""}`,
      };
    }

    const text = await res.text();
    return { ok: true, data: (text ? JSON.parse(text) : null) as T };
  } catch (err) {
    return { ok: false, reason: `Database unreachable: ${(err as Error).message}` };
  }
}

// ── Job Security Audits ───────────────────────────────────────────────────

export type StoredAudit = {
  id: string;
  profile_id: string;
  role_title: string;
  industry: string | null;
  tasks: unknown;
  result: unknown;
  exposure_score: number;
  band: "low" | "moderate" | "elevated" | "high";
  created_at: string;
};

export async function saveAudit(input: {
  profileId: string;
  roleTitle: string;
  industry?: string;
  tasks: unknown;
  result: unknown;
  exposureScore: number;
  band: StoredAudit["band"];
}): Promise<DbResult<StoredAudit>> {
  const res = await rest<StoredAudit[]>({
    method: "POST",
    path: "job_security_audits",
    returnRepresentation: true,
    body: {
      profile_id: input.profileId,
      role_title: input.roleTitle,
      industry: input.industry ?? null,
      tasks: input.tasks,
      result: input.result,
      exposure_score: input.exposureScore,
      band: input.band,
    },
  });
  if (!res.ok) return res;
  const row = res.data?.[0];
  return row ? { ok: true, data: row } : { ok: false, reason: "Insert returned no row" };
}

/**
 * One profile's audits, newest first.
 *
 * The owner filter is in the query rather than applied after fetching. Reading
 * everything and filtering in JS would work here and quietly stop working the
 * moment the table has two users in it.
 */
export async function listAuditsFor(profileId: string, limit = 20): Promise<DbResult<StoredAudit[]>> {
  return rest<StoredAudit[]>({
    path: `job_security_audits?profile_id=eq.${encodeURIComponent(profileId)}&order=created_at.desc&limit=${limit}`,
  });
}

export async function getAudit(id: string): Promise<DbResult<StoredAudit | null>> {
  const res = await rest<StoredAudit[]>({
    path: `job_security_audits?id=eq.${encodeURIComponent(id)}&limit=1`,
  });
  if (!res.ok) return res;
  return { ok: true, data: res.data?.[0] ?? null };
}

// ── Subscriptions ─────────────────────────────────────────────────────────

export type StoredSubscription = {
  id: string;
  profile_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: "operator" | "operator-pro" | "enterprise";
  status: string;
  current_period_end: string | null;
};

/**
 * Record what Stripe says a subscription now is.
 *
 * Upserted on `stripe_subscription_id`, which the schema makes unique. Stripe
 * redelivers webhooks — on its own retry schedule, and again if our response is
 * slow — so the same event arriving twice has to land on the same row rather
 * than creating a duplicate subscription. That is the whole reason this is an
 * upsert and not an insert.
 */
export async function upsertSubscription(input: {
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
  profileId?: string | null;
  tier: StoredSubscription["tier"];
  status: string;
  currentPeriodEnd?: string | null;
}): Promise<DbResult<StoredSubscription>> {
  const res = await rest<StoredSubscription[]>({
    method: "POST",
    path: "subscriptions",
    onConflict: "stripe_subscription_id",
    returnRepresentation: true,
    body: {
      stripe_subscription_id: input.stripeSubscriptionId,
      stripe_customer_id: input.stripeCustomerId ?? null,
      profile_id: input.profileId ?? null,
      tier: input.tier,
      status: input.status,
      current_period_end: input.currentPeriodEnd ?? null,
    },
  });
  if (!res.ok) return res;
  const row = res.data?.[0];
  return row ? { ok: true, data: row } : { ok: false, reason: "Upsert returned no row" };
}

// ── Audit log ─────────────────────────────────────────────────────────────

/**
 * Append to the security audit log.
 *
 * Deliberately never returns a failure that a caller is expected to act on:
 * losing a log line must not fail the operation being logged. The reason is
 * returned so a caller that cares can surface it.
 */
export async function writeAuditLog(entry: {
  actorId?: string | null;
  action: string;
  target?: string | null;
  detail?: unknown;
}): Promise<DbResult<null>> {
  return rest<null>({
    method: "POST",
    path: "audit_log",
    body: {
      actor_id: entry.actorId ?? null,
      action: entry.action,
      target: entry.target ?? null,
      detail: entry.detail ?? null,
    },
  });
}
