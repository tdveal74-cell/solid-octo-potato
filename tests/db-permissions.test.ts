import { describe, expect, it, vi } from "vitest";
import { startTestApi } from "./helpers/permissions-api";
import { saveAudit, listAuditsFor, upsertSubscription, writeAuditLog } from "../src/lib/db/client";
import { readFileSync, readdirSync } from "node:fs";
import { createTestDb, prepareRoles, seed, ownerA, ownerB, type TestDb } from "./helpers/permissions-db";

export const migrationFiles = readdirSync("supabase/migrations").filter(f => f.endsWith(".sql")).sort();
export const migrations = migrationFiles.map(f => readFileSync(`supabase/migrations/${f}`, "utf8"));
export const schema = readFileSync("src/lib/db/schema.sql", "utf8");
export const permissionMigration = migrations.at(-1)!;
export const tables = ["organizations", "profiles", "subscriptions", "job_security_audits", "career_roadmaps",
  "deliberations", "agent_runs", "user_memories", "knowledge_documents", "knowledge_chunks", "content_pieces", "audit_log"];

async function catalog(db: TestDb) {
  return (await db.query(`select tablename, policyname, cmd, roles, qual, with_check
    from pg_policies where schemaname='public' order by tablename,policyname`)).rows;
}

async function verifyContract(db: TestDb) {
  const result = await db.query<{ role: string; table_name: string; privilege: string; allowed: boolean }>(`
    select r.role, t.table_name, p.privilege,
      has_table_privilege(r.role, 'public.' || t.table_name, p.privilege) as allowed
    from unnest(array['anon','authenticated','service_role']) r(role)
    cross join unnest(array[${tables.map(t => `'${t}'`).join(",")}]) t(table_name)
    cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(privilege)
  `);
  for (const row of result.rows) {
    const expected = row.role === "service_role" && (
      (row.table_name === "job_security_audits" && ["SELECT","INSERT"].includes(row.privilege)) ||
      (row.table_name === "subscriptions" && ["SELECT","INSERT","UPDATE"].includes(row.privilege)) ||
      (row.table_name === "audit_log" && row.privilege === "INSERT"));
    expect(row.allowed, `${row.role} ${row.privilege} ${row.table_name}`).toBe(expected);
  }
  expect((await db.query(`select relname from pg_class where relnamespace='public'::regnamespace
    and relkind='r' and relrowsecurity`)).rows).toHaveLength(12);
  for (const role of ["anon", "authenticated", "service_role"]) {
    expect((await db.query<{allowed: boolean}>(`select has_function_privilege('${role}',
      'public.match_chunks(vector,integer,uuid)', 'EXECUTE') as allowed`)).rows[0].allowed).toBe(false);
    for (const privilege of ["USAGE", "SELECT", "UPDATE"]) {
      expect((await db.query<{allowed: boolean}>(`select has_sequence_privilege('${role}',
        'public.audit_log_id_seq', '${privilege}') as allowed`)).rows[0].allowed).toBe(false);
    }
  }
}

describe("explicit Data API permissions", () => {
  it("reproduces the missing-grant failure under the new defaults", async () => {
    const db = await createTestDb();
    try {
      await prepareRoles(db, false);
      for (const migration of migrations.slice(0,-1)) await db.exec(migration);
      await db.exec("set role service_role");
      await expect(db.query("select * from job_security_audits")).rejects.toMatchObject({code:"42501"});
      await db.exec("reset role");
    } finally { await db.close(); }
  },60000);
  it.runIf(Boolean(process.env.POSTGREST_BIN && process.env.TQO_TEST_POSTGRES_URL))("real PostgREST: application requests succeed and private data stays closed", async () => {
    const db = await createTestDb();
    let api: Awaited<ReturnType<typeof startTestApi>> | undefined;
    try {
      await prepareRoles(db, false);
      for (const migration of migrations) await db.exec(migration);
      await seed(db);
      api = await startTestApi(db);
      vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL",api.gateway);
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY",api.token("service_role"));
      const saved = await saveAudit({profileId:ownerA,roleTitle:"New private audit",tasks:[],result:{},exposureScore:20,band:"low"});
      expect(saved.ok,JSON.stringify(saved)).toBe(true);
      const listed = await listAuditsFor(ownerA);
      expect(listed.ok,JSON.stringify(listed)).toBe(true);
      if (listed.ok) {
        expect(listed.data).toHaveLength(2);
        expect(listed.data.every(row => row.profile_id===ownerA)).toBe(true);
      }
      const input = {stripeSubscriptionId:"sub_test_new",profileId:ownerA,tier:"operator" as const,status:"active"};
      const first = await upsertSubscription(input);
      const second = await upsertSubscription({...input,status:"canceled"});
      expect(first.ok,JSON.stringify(first)).toBe(true);
      expect(second.ok,JSON.stringify(second)).toBe(true);
      if (first.ok && second.ok) expect(second.data.id).toBe(first.data.id);
      expect(await writeAuditLog({action:"permissions.test"})).toEqual({ok:true,data:null});
      for (const role of ["anon", "authenticated"]) {
        const headers = {Authorization:`Bearer ${api.token(role,role==="authenticated" ? ownerA : undefined)}`,"Content-Type":"application/json"};
        for (const table of tables) {
          const response = await fetch(`${api.origin}/${table}?select=*`,{headers});
          const text = await response.text();
          expect([401,403,404],`${role} reads ${table}: ${text}\n${api.logs()}`).toContain(response.status);
          expect(text).not.toContain("Private chunk");
          expect(text).not.toContain("sub_test_");
        }
        for (const method of ["POST","PATCH","DELETE"]) {
          const response = await fetch(`${api.origin}/subscriptions?profile_id=eq.${ownerA}`,{
            method,headers,body:method==="DELETE" ? undefined : JSON.stringify({profile_id:ownerA,tier:"enterprise"}),
          });
          expect([401,403,404],`${role} ${method} billing`).toContain(response.status);
        }
      }
      for (const role of ["anon","authenticated","service_role"]) {
        const response = await fetch(`${api.origin}/rpc/match_chunks`, {method:"POST",
          headers:{Authorization:`Bearer ${api.token(role,ownerA)}`,"Content-Type":"application/json"},
          body:JSON.stringify({query_embedding:`[${Array(1536).fill(0).join(",")}]`}),
        });
        expect([401,403,404],`${role} unneeded RPC`).toContain(response.status);
      }
      const unauthenticated = await fetch(`${api.origin}/subscriptions`);
      expect([401,403,404]).toContain(unauthenticated.status);
      const badToken = await fetch(`${api.origin}/subscriptions`,{headers:{Authorization:"Bearer invalid"}});
      expect(badToken.status).toBe(401);
      for (const path of ["audit_log","profiles","knowledge_documents"]) {
        const response = await fetch(`${api.origin}/${path}`,{headers:{Authorization:`Bearer ${api.token("service_role")}`}});
        expect([403,404],`service cannot read ${path}`).toContain(response.status);
      }
      const cannotDelete = await fetch(`${api.origin}/subscriptions?stripe_subscription_id=eq.sub_test_new`,{
        method:"DELETE",headers:{Authorization:`Bearer ${api.token("service_role")}`},
      });
      expect(cannotDelete.status).toBe(403);
    } finally {
      vi.unstubAllEnvs();
      if (api) await api.close();
      await db.close();
    }
  },60000);
  for (const source of ["bootstrap", "migrations"]) {
    for (const legacy of [false, true]) {
      it(`${source}: fresh creation, repeat application, ${legacy ? "legacy broad" : "no automatic"} grants`, async () => {
        const db = await createTestDb();
        try {
          await prepareRoles(db, legacy);
          if (source === "bootstrap") await db.exec(schema);
          else for (const migration of migrations) await db.exec(migration);
          await seed(db);
          const policies = await catalog(db);
          const before = (await db.query("select * from subscriptions order by stripe_subscription_id")).rows;
          await db.exec(source === "bootstrap" ? schema : permissionMigration);
          await verifyContract(db);
          expect(await catalog(db)).toEqual(policies);
          expect((await db.query("select * from subscriptions order by stripe_subscription_id")).rows).toEqual(before);
          expect((await db.query<{proconfig: string[]}>("select proconfig from pg_proc where proname='match_chunks'")).rows[0].proconfig).toContain("search_path=public");
          // The identity sequence stays private while the real insert succeeds.
          await db.exec("set role service_role; insert into audit_log(action) values ('test.insert'); reset role;");
          expect((await db.query("select * from audit_log")).rows).toHaveLength(1);
        } finally { await db.close(); }
      }, 60000);
    }
  }

  it("upgrades legacy ACLs without changing data or ownership policies", async () => {
    const db = await createTestDb();
    try {
      await prepareRoles(db, true);
      for (const migration of migrations.slice(0, -1)) await db.exec(migration);
      await seed(db);
      const policies = await catalog(db);
      const before = await Promise.all(tables.map(t => db.query(`select * from ${t} order by id`)));
      await db.exec(permissionMigration);
      await verifyContract(db);
      expect(await catalog(db)).toEqual(policies);
      for (let i = 0; i < tables.length; i++) {
        expect((await db.query(`select * from ${tables[i]} order by id`)).rows).toEqual(before[i].rows);
      }
      // Test retained RLS separately with temporary, rolled-back grants. These
      // are test-only capabilities; the migration never grants browser access.
      await db.exec(`begin;
        grant select,insert,update on job_security_audits to authenticated;
        grant select on knowledge_documents,knowledge_chunks,subscriptions to authenticated;
        set local role authenticated;
        select set_config('request.jwt.claim.sub','${ownerA}',true);`);
      expect((await db.query("select profile_id from job_security_audits")).rows).toEqual([{profile_id: ownerA}]);
      expect((await db.query("select content from knowledge_chunks")).rows).toEqual([{content: "Private chunk A"}]);
      expect((await db.query("select * from subscriptions")).rows).toEqual([]);
      await db.exec("savepoint bad_owner");
      await expect(db.exec(`update job_security_audits set profile_id='${ownerB}' where profile_id='${ownerA}'`)).rejects.toMatchObject({code:"42501"});
      await db.exec("rollback to savepoint bad_owner; rollback;");
      await verifyContract(db);
    } finally { await db.close(); }
  }, 60000);
});
