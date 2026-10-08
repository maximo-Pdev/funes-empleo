import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const interactiveParameters = ` administrators integer:=2; candidates integer:=4; companies integer:=4;
 openings integer:=8; participations integer:=8; active_candidates integer:=4;
 published_openings integer:=4; vacancies integer:=1; fully_hired_openings integer:=4; partially_hired_openings integer:=0;`;
const acceptanceParameters = ` administrators integer:=4; candidates integer:=500; companies integer:=50;
 openings integer:=100; participations integer:=1000; active_candidates integer:=400;
 published_openings integer:=80; vacancies integer:=2; fully_hired_openings integer:=20; partially_hired_openings integer:=10;`;
export function generateAcceptanceSeed(template) {
  const sql = template.replaceAll("\r\n", "\n");
  if (sql.split(interactiveParameters).length !== 2) throw new Error("FIXTURE_TEMPLATE_CHANGED: revisá el bloque de parámetros.");
  return `-- GENERATED TEST-ONLY acceptance fixture. Never load into hosted/demo/default environments.
-- Source: supabase/seed.sql; regenerate with tests/fixtures/generate-acceptance-seed.mjs --write.
do $guard$ begin
 if current_setting('funes.fixture_context',true) is distinct from 'isolated-local-acceptance'
 then raise exception 'LOCAL_ACCEPTANCE_REQUIRED'; end if;
end $guard$;
` + sql.replace(interactiveParameters, acceptanceParameters);
}
// Pure import for tests; explicit generation updates only the two declared outputs.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] !== "--write") throw new Error("Usá --write para regenerar fixture y hashes.");
  const template = readFileSync("supabase/seed.sql", "utf8").replaceAll("\r\n", "\n");
  const acceptance = generateAcceptanceSeed(template);
  const path = "tests/fixtures/acceptance-manifest.json";
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const hash = sql => createHash("sha256").update(sql).digest("hex");
  manifest.interactive.seedSha256 = hash(template);
  manifest.acceptance.seedSha256 = hash(acceptance);
  writeFileSync("tests/fixtures/acceptance-seed.sql", acceptance);
  writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
}
