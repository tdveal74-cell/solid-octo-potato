import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createServer as createTcpServer } from "node:net";
import { once } from "node:events";
import { createHmac, randomBytes } from "node:crypto";
import type { AddressInfo } from "node:net";
import type { TestDb } from "./permissions-db";

export async function startTestApi(db: TestDb) {
  if (!db.url) throw new Error("HTTP tests require native disposable PostgreSQL via TQO_TEST_POSTGRES_URL");
  const reservation = createTcpServer();
  reservation.listen(0, "127.0.0.1");
  await once(reservation, "listening");
  const port = (reservation.address() as AddressInfo).port;
  await new Promise<void>(resolve => reservation.close(() => resolve()));
  const secret = randomBytes(32).toString("hex");
  const token = (role: string, sub?: string) => {
    const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const body = `${part({alg:"HS256",typ:"JWT"})}.${part({role,sub,exp:Math.floor(Date.now()/1000)+600})}`;
    return `${body}.${createHmac("sha256",secret).update(body).digest("base64url")}`;
  };
  // All values are local test values. No Supabase credential is read.
  const child = spawn(process.env.POSTGREST_BIN!, ["+RTS", "-N1", "-RTS"], {env:{
    NODE_ENV:"test", PATH:process.env.PATH,
    PGRST_DB_URI:db.url,
    PGRST_DB_SCHEMAS:"public", PGRST_DB_ANON_ROLE:"anon", PGRST_JWT_SECRET:secret,
    PGRST_DB_POOL:"1", PGRST_DB_CHANNEL_ENABLED:"false", PGRST_DB_CONFIG:"false",
    PGRST_DB_PREPARED_STATEMENTS:"false", PGRST_SERVER_HOST:"127.0.0.1", PGRST_SERVER_PORT:String(port),
  }, stdio:["ignore","pipe","pipe"]});
  let logs = "";
  child.stdout.on("data", chunk => { logs += chunk.toString(); });
  child.stderr.on("data", chunk => { logs += chunk.toString(); });
  child.on("error", error => { logs += String(error); });
  const origin = `http://127.0.0.1:${port}`;
  // Supabase's gateway strips /rest/v1 before forwarding to PostgREST.
  const gateway = createServer(async (req, res) => {
    try {
      if (!req.url?.startsWith("/rest/v1/")) { res.writeHead(404).end(); return; }
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(Buffer.from(chunk));
      const body = Buffer.concat(chunks);
      const headers = new Headers();
      for (const key of ["authorization","content-type","prefer"]) {
        if (typeof req.headers[key] === "string") headers.set(key,req.headers[key]);
      }
      const response = await fetch(`${origin}${req.url.slice(8)}`, {
        method:req.method, headers, body:body.length ? body : undefined,
      });
      res.writeHead(response.status, {"content-type":response.headers.get("content-type") ?? "application/json"});
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (error) { res.writeHead(502).end(String(error)); }
  });
  gateway.listen(0,"127.0.0.1");
  await once(gateway,"listening");
  const close = async () => {
    gateway.closeAllConnections();
    await new Promise<void>(resolve => gateway.close(() => resolve()));
    if (child.exitCode === null) {
      const exited = once(child,"exit");
      child.kill("SIGTERM");
      const force = setTimeout(() => child.kill("SIGKILL"),2000);
      await exited;
      clearTimeout(force);
    }
  };
  try {
    let ready = false;
    for (let i=0; i<100; i++) {
      if (child.exitCode !== null) break;
      const response = await fetch(`${origin}/job_security_audits?limit=0`, {
        headers:{Authorization:`Bearer ${token("service_role")}`}, signal:AbortSignal.timeout(500),
      }).catch(() => null);
      if (response?.status === 200) { ready=true; break; }
      await new Promise(resolve => setTimeout(resolve,100));
    }
    if (!ready) throw new Error(`PostgREST did not become ready: ${logs.slice(0,3000)}`);
  } catch (error) { await close(); throw error; }
  return {origin, token, close, logs:() => logs.slice(-4000), gateway:`http://127.0.0.1:${(gateway.address() as AddressInfo).port}`};
}
