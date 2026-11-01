import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { assertLocalTargets } from "../fixtures/credentials.mjs";

// Test the actual migration/recovery SQL with rollback. Never target a working DB.
if (!process.argv.includes("--confirm-isolated-test")) throw Error("LOCAL_RETIREMENT_TEST_REQUIRED");
const owned = process.env.LOCAL_ACCEPTANCE_PROJECT_OWNED;
if (!owned || !/^funes-[a-z0-9-]+-(check|acceptance)$/.test(owned)) throw Error("LOCAL_RETIREMENT_OWNERSHIP_REQUIRED");
assertLocalTargets();
const configured = readFileSync("supabase/config.toml", "utf8").match(/^project_id\s*=\s*"([^"]+)"/m)?.[1];
if (configured !== owned) throw Error("LOCAL_RETIREMENT_PROJECT_REQUIRED");
const windowsDocker = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "Programs", "DockerDesktop", "resources", "bin", "docker.exe");
const docker = windowsDocker && existsSync(windowsDocker) ? windowsDocker : "docker";
const container = `supabase_db_${owned}`;
assert.equal(execFileSync(docker, ["ps", "--filter", `name=^/${container}$`, "--format", "{{.Names}}"], { encoding: "utf8" }).trim(), container);
function sql(query) {
  return execFileSync(docker, ["exec", "-i", container, "psql", "-X", "-qAt", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"],
    { input: query, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], timeout: 60000 }).trim();
}
assert.equal(sql("select count(*) from auth.users where email is null or email not like '%@example.invalid'"), "0", "Synthetic users required");
assert.equal(sql("select count(*) from public.job_categories where version=1 and code in ('DEMO-A','DEMO-B') and active"), "2", "Unretired synthetic fixture required");
const backupExists = sql("select to_regclass('private.demo_category_retirement_backup') is not null") === "t";
if (backupExists) assert.equal(sql("select count(*) from private.demo_category_retirement_backup"), "0", "Pristine test backup required");
function body(path) {
  const source = readFileSync(path, "utf8").trim();
  assert.equal((source.match(/^begin;\r?$/gm) ?? []).length, 1);
  assert.match(source, /\ncommit;$/);
  return source.replace(/^begin;\r?$/m, "").replace(/\ncommit;$/, "");
}
const migration = body("supabase/migrations/20261101120000_retire_demo_job_categories.sql");
const recovery = body("docs/operations/recover-demo-categories.sql");
const parents = ["accounts", "candidate_profiles", "job_openings", "participations", "candidate_consents", "referrals", "cv_documents", "audit_events", "opening_moderation_events", "internal_notes"];
const relations = ["job_categories", "candidate_categories", "opening_categories"];
const tables = [...parents, ...relations];
const snapshots = tables.map(table => `create temp table before_${table} as select to_jsonb(t) as row_snapshot from public.${table} t;`).join("\n");
const target = "select (row_snapshot->>'id')::uuid from before_job_categories where row_snapshot->>'version'='1' and row_snapshot->>'code' in ('DEMO-A','DEMO-B')";
function unchanged(table, currentWhere = "true", beforeWhere = "true") {
  return `not exists((select to_jsonb(t) from public.${table} t where ${currentWhere} except select row_snapshot from before_${table} where ${beforeWhere})
    union all (select row_snapshot from before_${table} where ${beforeWhere} except select to_jsonb(t) from public.${table} t where ${currentWhere}))`;
}
const parentsUnchanged = parents.map(table => unchanged(table)).join(" and ");
const originalsMatch = tables.map(table => unchanged(table)).join(" and ");
const untouched = [unchanged("job_categories", `t.id not in (${target})`, `(row_snapshot->>'id')::uuid not in (${target})`),
  ...["candidate_categories", "opening_categories"].map(table => unchanged(table, `t.category_id not in (${target})`, `(row_snapshot->>'category_id')::uuid not in (${target})`))].join(" and ");
const expectedBackup = `(${relations.map(table => `select row_snapshot from before_${table} where ${table === "job_categories" ? `(row_snapshot->>'id')::uuid` : `(row_snapshot->>'category_id')::uuid`} in (${target})`).join(" union all ")})`;
const actualBackup = "select row_snapshot from private.demo_category_retirement_backup";
const backupExact = `not exists((${expectedBackup} except ${actualBackup}) union all (${actualBackup} except ${expectedBackup}))`;
const emptyBackup = backupExists ? "(select count(*)=0 from private.demo_category_retirement_backup)" : "to_regclass('private.demo_category_retirement_backup') is null";

const result = sql(`begin;
${snapshots}
do $scope$ begin begin
 update public.job_categories set name='Categoría real de conflicto' where code='DEMO-A' and version=1;
 execute $migration$${migration}$migration$; raise exception 'MISSING_NAME_CONFLICT';
exception when others then if sqlerrm<>'DEMO_CATEGORY_NAME_CONFLICT' then raise; end if; end;
end $scope$;
${migration}
do $checks$ begin
  begin update private.demo_category_retirement_backup set reason=reason; raise exception 'MISSING_APPEND_ONLY';
  exception when others then if sqlerrm<>'APPEND_ONLY' then raise; end if; end;
  begin delete from private.demo_category_retirement_backup; raise exception 'MISSING_APPEND_ONLY';
  exception when others then if sqlerrm<>'APPEND_ONLY' then raise; end if; end;
  begin
    insert into public.candidate_categories select (jsonb_populate_record(null::public.candidate_categories,
      jsonb_set(row_snapshot,'{updated_at}',to_jsonb('2030-01-01T00:00:00Z'::text)))).*
      from private.demo_category_retirement_backup where source_table='candidate_categories' limit 1;
    execute $recovery$${recovery}$recovery$; raise exception 'MISSING_RECOVERY_CONFLICT';
  exception when others then if sqlerrm<>'DEMO_CATEGORY_RECOVERY_CONFLICT' then raise; end if; end;
  begin
    insert into public.candidate_categories select (jsonb_populate_record(null::public.candidate_categories,
      jsonb_set(row_snapshot,'{updated_at}',to_jsonb('2030-01-01T00:00:00Z'::text)))).*
      from private.demo_category_retirement_backup where source_table='candidate_categories' limit 1;
    execute $migration$${migration}$migration$; raise exception 'MISSING_BACKUP_CONFLICT';
  exception when others then if sqlerrm<>'DEMO_CATEGORY_BACKUP_CONFLICT' then raise; end if; end;
end $checks$;
${migration}
select jsonb_build_object(
 'retired',not exists(select 1 from public.job_categories where id in (${target}) and active),
 'unassigned',not exists(select 1 from public.candidate_categories where category_id in (${target})) and not exists(select 1 from public.opening_categories where category_id in (${target})),
 'backup_exact',${backupExact}, 'other_categories_unchanged',${untouched}, 'parents_unchanged',${parentsUnchanged},
 'rls',(select relrowsecurity from pg_class where oid='private.demo_category_retirement_backup'::regclass),
 'no_app_grants',not exists(select 1 from unnest(array['anon','authenticated','service_role']) r where has_table_privilege(r,'private.demo_category_retirement_backup','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
 'metadata',not exists(select 1 from private.demo_category_retirement_backup where captured_at is null or captured_by is null or reason='' or migration_version<>'20261101120000'));
${recovery}
select jsonb_build_object('restored_exactly',${originalsMatch});
rollback;`).split("\n").map(line => JSON.parse(line)).reduce((all, row) => ({ ...all, ...row }), {});
// sql() produces two JSON lines. Keep parsing explicit; never print snapshots.
for (const [name, ok] of Object.entries(result)) assert.equal(ok, true, name);

const rollback = JSON.parse(sql(`begin;
${snapshots}
do $failure$ begin begin
 execute $migration$${migration}$migration$;
 raise exception 'INJECTED_RETIREMENT_FAILURE';
exception when others then if sqlerrm<>'INJECTED_RETIREMENT_FAILURE' then raise; end if; end;
end $failure$;
select jsonb_build_object('failure_rolled_back',${originalsMatch},'backup_rolled_back',${emptyBackup});
rollback;`));
assert.equal(rollback.failure_rolled_back, true); assert.equal(rollback.backup_rolled_back, true);
for (const role of ["anon", "authenticated", "service_role"]) {
  assert.throws(() => sql(`begin; ${migration} set local role ${role}; select count(*) from private.demo_category_retirement_backup; rollback;`),
    error => /permission denied/.test(String(error.stderr)), `${role} must not read backup`);
}
const locker = spawn(docker, ["exec", "-i", container, "psql", "-X", "-qAt", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
const lockerClosed = once(locker, "close");
locker.stdin.end("begin; lock table public.accounts in row share mode; select 'LOCK_READY'; select pg_sleep(7); rollback;");
assert.match(String((await once(locker.stdout, "data"))[0]), /LOCK_READY/);
assert.throws(() => sql(`begin; ${migration} rollback;`), error => /lock timeout/.test(String(error.stderr)), "Busy workflow must abort retirement without partial changes");
assert.equal((await lockerClosed)[0], 0);
assert.equal(sql("select count(*) from public.job_categories where version=1 and code in ('DEMO-A','DEMO-B') and active"), "2");
console.log("PASS: exact backup, retirement, immutable private access, untouched records, retry, name/backup/recovery conflicts, workflow lock and atomic rollback; fixture preserved.");
