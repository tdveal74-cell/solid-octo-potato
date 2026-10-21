import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite-pgvector";
import { Client } from "pg";
import { randomUUID } from "node:crypto";

export interface TestDb {
  exec(sql: string): Promise<unknown>;
  query<T = Record<string, unknown>>(sql: string): Promise<{ rows: T[] }>;
  close(): Promise<void>;
  embedded?: PGlite;
  url?: string;
}

// CI uses native Postgres 17 + pgvector. Local fallback uses real PostgreSQL
// in WASM; pgcrypto isn't available there. This schema only needs the native
// gen_random_uuid(), so only that extension-install statement is skipped.
export async function createTestDb(): Promise<TestDb> {
  if (!process.env.TQO_TEST_POSTGRES_URL) {
    const db = await PGlite.create({ extensions: { vector } });
    return {
      exec: (sql) => db.exec(sql.replace(/^create extension if not exists pgcrypto;\s*$/gmi, "")),
      query: (sql) => db.query(sql),
      close: () => db.close(),
      embedded: db,
    };
  }
  const base = new URL(process.env.TQO_TEST_POSTGRES_URL);
  if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) {
    throw new Error("Database tests accept only a local disposable Postgres server");
  }
  const name = `tqo_permissions_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new Client({ connectionString: base.toString() });
  await admin.connect();
  await admin.query(`create database ${name}`);
  base.pathname = `/${name}`;
  const db = new Client({ connectionString: base.toString() });
  await db.connect();
  return {
    exec: (sql) => db.query(sql),
    query: async <T>(sql: string) => ({ rows: (await db.query(sql)).rows as T[] }),
    url: base.toString(),
    close: async () => {
      await db.end();
      await admin.query(`drop database ${name} with (force)`);
      await admin.end();
    },
  };
}

export const ownerA = "11111111-1111-4111-8111-111111111111";
export const ownerB = "22222222-2222-4222-8222-222222222222";

export async function prepareRoles(db: TestDb, legacyDefaults: boolean) {
  await db.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname='anon') then create role anon; end if;
      if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
      if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role bypassrls; end if;
    end $$;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
    $$;
    grant usage on schema public, auth to anon, authenticated, service_role;
    ${legacyDefaults ? `
      alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
      alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
      alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
    ` : ""}
  `);
}

export async function seed(db: TestDb) {
  await db.exec(`
    insert into profiles (id,email) values ('${ownerA}','a@example.invalid'),('${ownerB}','b@example.invalid');
    insert into job_security_audits (profile_id,role_title,tasks,result,exposure_score,band)
      values ('${ownerA}','Owner A','[]','{}',10,'low'),('${ownerB}','Owner B','[]','{}',80,'high');
    insert into subscriptions (profile_id,stripe_subscription_id,tier)
      values ('${ownerA}','sub_test_a','operator'),('${ownerB}','sub_test_b','operator-pro');
    insert into knowledge_documents (id,owner_id,title,source)
      values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${ownerA}','Private A','test'),
             ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${ownerB}','Private B','test');
    insert into knowledge_chunks (document_id,chunk_index,content)
      values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,'Private chunk A'),
             ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,'Private chunk B');
  `);
}
