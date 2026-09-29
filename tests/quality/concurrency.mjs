import { spawn, execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

if (process.env.NEXT_PUBLIC_SUPABASE_URL !== "http://127.0.0.1:54321") throw new Error("Concurrencia: solo fixture local.");
const windowsDocker = join(process.env.LOCALAPPDATA || "", "Programs/DockerDesktop/resources/bin/docker.exe");
const docker = existsSync(windowsDocker) ? windowsDocker : "docker";
const container = "supabase_db_funes-empleo";
assert.equal(execFileSync(docker,["ps","--filter",`name=^/${container}$`,"--format","{{.Names}}"],{encoding:"utf8"}).trim(),container);
const args = ["exec","-i",container,"psql","-X","-qAt","-U","postgres","-d","postgres","-v","ON_ERROR_STOP=1"];
const sql = (query) => execFileSync(docker,args,{input:query,encoding:"utf8",timeout:15000}).trim();
const id = (kind,n) => { const h=createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
const session = "ee730000-0000-4000-8000-000000000004";
const actor = id("admin",4), opening = id("opening",78);
function connection() {
  const child=spawn(docker,args,{stdio:["pipe","pipe","pipe"]});
  const state={child,out:"",err:"",done:null};
  child.stdout.on("data",b=>state.out+=b.toString());
  child.stderr.on("data",b=>state.err+=b.toString());
  state.done=new Promise((resolve,reject)=>{ child.on("error",reject); child.on("close",code=>resolve(code)); });
  return state;
}
async function until(predicate,label) {
  const deadline=Date.now()+15000;
  while (!predicate()) { if(Date.now()>deadline) throw new Error(`Barrera no alcanzada: ${label}`); await new Promise(r=>setTimeout(r,100)); }
}
async function race(label,blockingWrite) {
  const baseline=sql(`select version||':'||status from public.job_openings where id='${opening}';`);
  sql(`insert into auth.sessions(id,user_id) values('${session}','${actor}');`);
  const a=connection(), b=connection();
  try {
    a.child.stdin.write(`begin; set local lock_timeout='10s'; ${blockingWrite}; select 'LOCK_HELD';\n`);
    await until(()=>a.out.includes("LOCK_HELD"),"transacción A posee bloqueo");
    b.child.stdin.end(`set application_name='funes_quality_race'; set statement_timeout='20s'; begin;
      set local role authenticated;
      select set_config('request.jwt.claim.sub','${actor}',true);
      select set_config('request.jwt.claims','{"sub":"${actor}","session_id":"${session}"}',true);
      select public.transition_opening('${opening}',${baseline.split(":")[0]},'pause','Prueba ficticia concurrente'); commit;`);
    await until(()=>sql("select count(*) from pg_stat_activity where application_name='funes_quality_race' and wait_event_type='Lock';")==="1","transacción B espera realmente en SQL");
    a.child.stdin.end("commit;\n");
    assert.equal(await a.done,0);
    assert.notEqual(await b.done,0);
    assert.match(b.err,/AUTH_REQUIRED/);
    assert.equal(sql(`select version||':'||status from public.job_openings where id='${opening}';`),baseline);
    console.log(`PASS concurrencia SQL: ${label}; bloqueo observado, rechazo y cero escritura.`);
  } finally {
    if(a.child.exitCode===null) { a.child.stdin.end("rollback;\n"); await a.done; }
    if(b.child.exitCode===null) { b.child.kill(); await b.done; }
    sql(`update public.accounts set status='active',suspended_reason=null,suspended_at=null,suspended_by=null where id='${actor}' and status='suspended'; delete from auth.sessions where id='${session}';`);
  }
}
await race("suspensión en otra transacción",`update public.accounts set status='suspended',suspended_reason='Prueba ficticia concurrente',suspended_at=clock_timestamp(),suspended_by='${id("admin",1)}' where id='${actor}'`);
await race("revocación de sesión en otra transacción",`delete from auth.sessions where id='${session}'`);
