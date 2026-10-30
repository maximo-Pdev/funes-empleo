// Test-only: explicit ownership and loopback guards, never hosted data.
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assertLocalTargets } from "../fixtures/credentials.mjs";

assertLocalTargets();
const project = readFileSync("supabase/config.toml", "utf8").match(/^project_id\s*=\s*"(funes-[a-z0-9-]+)"/m)?.[1];
if (!project || process.env.LOCAL_ACCEPTANCE_PROJECT_OWNED !== project) throw new Error("LOCAL_PROJECT_OWNERSHIP_REQUIRED");
const windowsDocker = join(process.env.LOCALAPPDATA || "", "Programs/DockerDesktop/resources/bin/docker.exe");
const docker = existsSync(windowsDocker) ? windowsDocker : "docker";
const container = `supabase_db_${project}`;
assert.equal(execFileSync(docker, ["ps", "--filter", `name=^/${container}$`, "--format", "{{.Names}}"], { encoding: "utf8", timeout: 10000 }).trim(), container);
const args = ["exec", "-i", container, "psql", "-X", "-qAt", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"];
const sql = query => execFileSync(docker, args, { input: query, encoding: "utf8", timeout: 15000 }).trim();
assert.equal(sql("select count(*) from auth.users where email is null or email not like '%@example.invalid'"), "0", "Solo identidades ficticias.");
const fixtureId = number => {
  const h = createHash("md5").update(`funes-demo-v1:admin:${number}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};
const first = fixtureId(1), second = fixtureId(2), firstSession = randomUUID(), secondSession = randomUUID();
const snapshot = () => JSON.parse(sql("select jsonb_object_agg(id,jsonb_build_object('status',status,'version',version)) from public.accounts where role='admin'"));
const baseline = snapshot();
assert.equal(baseline[first]?.status, "active"); assert.equal(baseline[second]?.status, "active");
const activeBefore = Object.values(baseline).filter(account => account.status === "active").length;
const auditBefore = Number(sql(`select count(*) from public.audit_events where entity_id='${second}' and action='account_suspended'`));
const actorAuditBefore = Number(sql(`select count(*) from public.audit_events where entity_id='${second}' and action='account_suspended' and actor_account_id='${first}' and occurred_at is not null`));
const authenticate = (actor, session) => `set local role authenticated; select set_config('request.jwt.claim.sub','${actor}',true); select set_config('request.jwt.claims','{"sub":"${actor}","session_id":"${session}"}',true);`;
const appName = `admin_guard_${randomUUID().replaceAll("-", "")}`;
function connection() {
  const child = spawn(docker, args, { stdio: ["pipe", "pipe", "pipe"] });
  const state = { child, out: "", err: "", done: null };
  child.stdout.on("data", value => { state.out += value.toString(); });
  child.stderr.on("data", value => { state.err += value.toString(); });
  state.done = new Promise((resolve, reject) => { child.on("error", reject); child.on("close", resolve); });
  return state;
}
async function until(predicate, label) {
  const deadline = Date.now() + 15000;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error(`Barrera no alcanzada: ${label}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
let a, b;
try {
  sql(`insert into auth.sessions(id,user_id) values('${firstSession}','${first}'),('${secondSession}','${second}')`);
  a = connection(); b = connection();
  a.child.stdin.write(`begin; set local statement_timeout='25s'; ${authenticate(first, firstSession)}
    select public.change_account_status('${second}',${baseline[second].version},'suspend','Prueba ficticia concurrente',true);
    select 'ADMIN_LOCK_HELD';\n`);
  await until(() => a.out.includes("ADMIN_LOCK_HELD"), "primera suspensión sin confirmar");
  b.child.stdin.end(`set application_name='${appName}'; begin; set local statement_timeout='25s'; ${authenticate(second, secondSession)}
    select public.change_account_status('${first}',${baseline[first].version},'suspend','Prueba ficticia cruzada',true); commit;`);
  await until(() => sql(`select count(*) from pg_stat_activity where application_name='${appName}' and wait_event_type='Lock' and wait_event='advisory'`) === "1", "segunda decisión espera bloqueo SQL");
  a.child.stdin.end("commit;\n");
  assert.equal(await a.done, 0); assert.notEqual(await b.done, 0);
  assert.match(b.err, /AUTH_REQUIRED/);
  const after = snapshot();
  assert.equal(after[first].status, "active"); assert.equal(after[first].version, baseline[first].version);
  assert.equal(after[second].status, "suspended"); assert.equal(after[second].version, baseline[second].version + 1);
  assert.equal(Object.values(after).filter(account => account.status === "active").length, activeBefore - 1);
  for (const [id, account] of Object.entries(baseline)) if (id !== second) assert.deepEqual(after[id], account);
  assert.equal(Number(sql(`select count(*) from public.audit_events where entity_id='${second}' and action='account_suspended'`)), auditBefore + 1);
  assert.equal(sql(`select count(*) from public.audit_events where entity_id='${second}' and action='account_suspended' and actor_account_id='${first}' and occurred_at is not null`), String(actorAuditBefore + 1));
  console.log("PASS: bloqueo advisory observado, suspensión cruzada rechazada, actor revalidado, un administrador conservado y auditoría única.");
} finally {
  for (const state of [a, b]) if (state && state.child.exitCode === null) { state.child.kill(); await state.done; }
  // Restore the fictitious account through the real audited workflow, never erase audit.
  if (snapshot()[second].status === "suspended") {
    const version = snapshot()[second].version;
    sql(`begin; ${authenticate(first, firstSession)} select public.change_account_status('${second}',${version},'reactivate','Fin de prueba ficticia concurrente',true); commit;`);
  }
  sql(`delete from auth.sessions where id in ('${firstSession}','${secondSession}')`);
  assert.equal(Object.values(snapshot()).filter(account => account.status === "active").length, activeBefore);
}
