import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";

const read = path => readFileSync(path, "utf8").replaceAll("\r\n", "\n");
const hash = text => createHash("sha256").update(text).digest("hex");
test("interactive and acceptance datasets have independent counts, inputs and hash proofs", () => {
  const m = JSON.parse(read("tests/fixtures/acceptance-manifest.json"));
  assert.deepEqual(m.interactive.counts, { administrators: 2, candidates: 4, activeCandidates: 4, companies: 4, offers: 8, participations: 8, confirmedHires: 4, fullyCoveredOffers: 4 });
  assert.deepEqual(m.acceptance.counts, { administrators: 4, candidates: 500, activeCandidates: 400, companies: 50, offers: 100, participations: 1000, confirmedHires: 50, fullyCoveredOffers: 20 });
  assert.equal(m.interactive.seedFile, "supabase/seed.sql");
  assert.equal(m.acceptance.seedFile, "tests/fixtures/acceptance-seed.sql");
  assert.equal(m.acceptance.localOnly, true);
  assert.deepEqual({ interactive: hash(read(m.interactive.seedFile)), acceptance: hash(read(m.acceptance.seedFile)) },
    { interactive: m.interactive.seedSha256, acceptance: m.acceptance.seedSha256 });
  assert.equal(m.acceptance.sc008a.openingList.expectedTotal, 80);
  assert.equal(m.acceptance.sc008a.companyList.expectedTotal, 50);
  assert.equal(m.acceptance.sc008a.openingList.pageSize, 10);
  assert.equal(m.acceptance.concurrentAdmins.administrators, 4);
  assert.equal(new Set([m.acceptance.concurrentAdmins.preselectionParticipation, m.acceptance.concurrentAdmins.contactParticipation, m.acceptance.concurrentAdmins.outcomeParticipation]).size, 3);
  const pdf = readFileSync(`tests/fixtures/${m.cvDownload.file}`);
  assert.equal(hash(pdf), m.cvSha256);
  assert.equal(pdf.length, m.cvDownload.bytes);
});
test("acceptance SQL is generated from the default template and cannot silently drift", async () => {
  const { generateAcceptanceSeed } = await import("../../fixtures/generate-acceptance-seed.mjs");
  const generated = generateAcceptanceSeed(read("supabase/seed.sql"));
  assert.equal(generated, read("tests/fixtures/acceptance-seed.sql"));
  assert.match(generated, /TEST-ONLY/);
  assert.match(generated, /LOCAL_ACCEPTANCE_REQUIRED/);
  assert.throws(() => generateAcceptanceSeed("unexpected template"), /FIXTURE_TEMPLATE_CHANGED/);
});
// Bind all thirteen actual pgTAP queries and their literal expectations to the
// explicitly selected acceptance manifest. This is a source contract, not SQL execution.
const acceptance = JSON.parse(read("tests/fixtures/acceptance-manifest.json")).acceptance;
const sqlCounts = read("supabase/tests/002_fixture_counts.test.sql");
const countAssertions = [...sqlCounts.matchAll(/select is\(\(([\s\S]*?)\),(\d+)::bigint,'([^']*)'\);/g)];
const normalizeSql = sql => sql.replace(/\s+/g, " ").trim();
const openingPage = acceptance.sc008a.openingList;
const companyPage = acceptance.sc008a.companyList;
const search = acceptance.sc008a.candidateSearch;
const countContracts = [
  ["administrators", "select count(*) from public.accounts where role='admin'", acceptance.counts.administrators],
  ["candidates", "select count(*) from public.candidate_profiles", acceptance.counts.candidates],
  ["active candidates", "select count(*) from public.candidate_profiles where status='active'", acceptance.counts.activeCandidates],
  ["companies", "select count(*) from public.company_profiles", acceptance.counts.companies],
  ["openings", "select count(*) from public.job_openings", acceptance.counts.offers],
  ["participations", "select count(*) from public.participations", acceptance.counts.participations],
  ["confirmed hires", "select count(*) from public.participations where status='hired'", acceptance.counts.confirmedHires],
  ["fully covered openings", `select count(*) from public.job_openings o where
    (select count(*) from public.participations p where p.opening_id=o.id and p.status='hired')>=o.vacancies`, acceptance.counts.fullyCoveredOffers],
  ["candidate search", `select count(*) from public.candidate_profiles p join public.candidate_categories cc on cc.candidate_id=p.id
    join public.job_categories jc on jc.id=cc.category_id
    where p.display_name ilike '%${search.term}%' and jc.code='${search.categoryCode}' and p.availability='${search.availability}'`, search.expectedTotal],
  ["published openings", `select count(*) from public.job_openings where status='${openingPage.status}'`, openingPage.expectedTotal],
  ["opening page", `select count(*) from (select id from public.job_openings where status='${openingPage.status}' order by title,id
    limit ${openingPage.pageSize} offset ${(openingPage.page - 1) * openingPage.pageSize}) q`, openingPage.expectedRows],
  ["active companies", `select count(*) from public.company_profiles where status='${companyPage.status}'`, companyPage.expectedTotal],
  ["company page", `select count(*) from (select id from public.company_profiles where status='${companyPage.status}' order by legal_name,id
    limit ${companyPage.pageSize} offset ${(companyPage.page - 1) * companyPage.pageSize}) q`, companyPage.expectedRows],
];
test("pgTAP fixture coverage contains exactly the thirteen acceptance count assertions", () => {
  assert.equal(countAssertions.length, 13);
  assert.equal(countContracts.length, 13);
});
for (const [index, [name, query, expected]] of countContracts.entries()) {
  test(`pgTAP acceptance count contract: ${name}`, () => {
    const actual = countAssertions[index];
    assert(actual, "Missing strict acceptance count assertion");
    assert.equal(normalizeSql(actual[1]), normalizeSql(query), "Actual pgTAP query must retain its filters/joins/pagination");
    assert.equal(Number(actual[2]), expected, "Expected count must match the acceptance manifest, never observed DB counts");
  });
}

// Intercept the real reset entrypoint's first subprocess. No Docker/CLI/Auth runs.
const loader = `import {registerHooks} from 'node:module'; registerHooks({
 resolve(s,c,n) {return s==='node:child_process'?{url:'mock:child',shortCircuit:true}:n(s,c)},
 load(u,c,n) {return u==='mock:child'?{format:'module',source:"export const spawnSync=()=>{throw new Error('SIDE_EFFECT_REACHED')}",shortCircuit:true}:n(u,c)}
});`;
for (const target of ["https://remote.invalid", "http://127.1:54321", "http://localhost:54321@remote.invalid"]) {
  test(`acceptance reset entrypoint rejects nonexact local target ${target} before transport`, () => {
    const env = { NEXT_PUBLIC_SUPABASE_URL: target, NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000", LOCAL_ACCEPTANCE_PROJECT_OWNED: "funes-empleo" };
    for (const key of ["PATH", "Path", "SystemRoot", "TEMP", "TMP"]) if (process.env[key]) env[key] = process.env[key];
    const r = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(loader)}`, "tests/fixtures/reset-local.mjs", "--confirm-local-reset", "--acceptance", "--database-only"], { env, encoding: "utf8" });
    assert.equal(r.status, 1);
    assert.match(r.stderr, /LOCAL_FIXTURE_TARGET_REQUIRED/);
    assert.doesNotMatch(r.stderr, /SIDE_EFFECT_REACHED/);
  });
}
test("reset requires isolated-project ownership before any subprocess", () => {
  const env = { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000" };
  for (const key of ["PATH", "Path", "SystemRoot", "TEMP", "TMP"]) if (process.env[key]) env[key] = process.env[key];
  const r = spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(loader)}`, "tests/fixtures/reset-local.mjs", "--confirm-local-reset", "--acceptance"], { env, encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /LOCAL_PROJECT_OWNERSHIP_REQUIRED/);
  assert.doesNotMatch(r.stderr, /SIDE_EFFECT_REACHED/);
});
test("dataset parameter blocks preserve approved volumes and outcome distribution", () => {
  const m = JSON.parse(read("tests/fixtures/acceptance-manifest.json"));
  for (const d of [m.interactive, m.acceptance]) {
    const sql = read(d.seedFile);
    const p = Object.fromEntries([...sql.matchAll(/(\w+) integer:=(\d+)/g)].map(x => [x[1], Number(x[2])]));
    assert.deepEqual([p.administrators, p.candidates, p.companies, p.openings, p.participations, p.active_candidates],
      [d.counts.administrators, d.counts.candidates, d.counts.companies, d.counts.offers, d.counts.participations, d.counts.activeCandidates]);
    assert.equal(p.fully_hired_openings * p.vacancies + p.partially_hired_openings, d.counts.confirmedHires);
    assert.equal(p.fully_hired_openings, d.counts.fullyCoveredOffers);
    assert.equal(p.participations % p.openings, 0);
    assert.match(sql, /opening_n:=1\+\(\(i-1\)\/\(participations\/openings\)\)/);
    assert.match(sql, /slot<=vacancies/);
  }
});
test("real CI entrypoints explicitly select acceptance, never default demo seeding", () => {
  const p = JSON.parse(read("package.json"));
  assert.match(p.scripts["test:db"], /reset-local\.mjs --confirm-local-reset --acceptance --database-only/);
  assert.match(p.scripts["test:tooling"], /tooling\/\*\.node\.test\.mjs/);
  const runner = read("tests/quality/run-local-e2e.mjs");
  assert.match(runner, /"--confirm-local-reset", "--acceptance"/);
  const reset = read("tests/fixtures/reset-local.mjs");
  assert.match(reset, /"--no-seed"/);
  assert.match(reset, /LOCAL_ACCEPTANCE_PROJECT_OWNED/);
});
