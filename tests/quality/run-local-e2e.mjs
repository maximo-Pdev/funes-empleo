import { spawnSync } from "node:child_process";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

// Never reads .env.local or prints CLI status (it contains local credentials).
if (process.argv[2] !== "--confirm-local-reset") {
  throw new Error("Este control restablece solo el fixture LOCAL: indicá --confirm-local-reset.");
}
const playwrightArgs = process.argv.slice(3);
const root = process.cwd();
const cli = resolve(root, "node_modules/supabase/dist/supabase.js");
const status = spawnSync(process.execPath, [cli, "status", "-o", "json"], { encoding: "utf8" });
if (status.status !== 0) throw new Error("Iniciá el Supabase local antes de ejecutar este control.");
const local = JSON.parse(status.stdout);
if (local.API_URL !== "http://127.0.0.1:54321" || new URL(local.DB_URL).port !== "54322" ||
    !["127.0.0.1", "localhost"].includes(new URL(local.DB_URL).hostname)) {
  throw new Error("Destino rechazado: no es el Supabase local aislado.");
}
const key = local.PUBLISHABLE_KEY || local.ANON_KEY;
if (!key) throw new Error("Falta configuración publicable local.");
const env = { ...process.env, APP_ENV: "local", CONSENT_POLICY_VERSION: "demo-not-approved",
  NEXT_PUBLIC_SUPABASE_URL: local.API_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
  NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000", LOCAL_MAILPIT_URL: "http://127.0.0.1:54324",
  QUALITY_FULL_E2E: "1", PLAYWRIGHT_EXTERNAL_SERVER: "0",
  PLAYWRIGHT_JSON_OUTPUT_FILE: resolve(root, "test-results/quality-e2e.json") };
delete env.SUPABASE_SECRET_KEY;
function run(file, args) {
  const result = spawnSync(process.execPath, [resolve(root, file), ...args], { env, stdio: "inherit" });
  if (result.error || result.status !== 0) throw new Error(`Falló el control ${file}.`);
}
run("tests/fixtures/reset-local.mjs", ["--confirm-local-reset", "--acceptance"]);
run("node_modules/next/dist/bin/next", ["build"]);
mkdirSync(resolve(root, "test-results"), { recursive: true });
run("node_modules/@playwright/test/cli.js", ["test", "--workers=1", "--retries=0", "--reporter=list,json", ...playwrightArgs]);
run("tests/quality/concurrency.mjs", []);
const report = JSON.parse(readFileSync(env.PLAYWRIGHT_JSON_OUTPUT_FILE, "utf8"));
if (!report.stats.expected || report.stats.skipped || report.stats.unexpected || report.stats.flaky) {
  throw new Error("E2E incompleto: hubo fallos, omisiones o pruebas inestables.");
}
console.log(`E2E completo: ${report.stats.expected} aprobados; cero omitidos, fallidos o inestables.`);
