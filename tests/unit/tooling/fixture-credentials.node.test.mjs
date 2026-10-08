import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { assertLocalTargets, localFixturePassword, resolveHostedCredentials } from "../../fixtures/credentials.mjs";

const identities = ["admin1", "admin2", "candidate1", "candidate2", "candidate3", "candidate4", "company1", "company2", "company3", "company4"];
const syntheticCredentials = Object.fromEntries(identities.map(id => [`DEMO_${id.toUpperCase()}_PASSWORD`, `synthetic-${id}`]));
const hostedScripts = [
  ["tests/fixtures/upload-demo-cvs.mjs", ["--confirm-demo=kyjycjojzhwggjuqjnki"]],
  ["tests/fixtures/verify-demo-cvs.mjs", ["--confirm-fictitious-demo", "00000000-0000-4000-8000-000000000001"]],
  ["tests/quality/demo-storage.mjs", ["--confirm-fictitious-demo"]],
  ["tests/quality/demo-smoke.mjs", ["--confirm-fictitious-demo"]],
  ["tests/quality/demo-performance.mjs", ["candidate", "00000000-0000-4000-8000-000000000001", "dpl_synthetic"]],
];
// Native loader intercepts transports before dependencies are installed. No real
// subprocess, browser, HTTP, SQL, or generated SQL file can be reached by scripts.
const loader = `
import { registerHooks } from 'node:module';
// Exercise the Windows-only hosted smoke on Linux CI too; transports stay mocked.
Object.defineProperty(process, 'platform', { value: 'win32' });
const fail = "() => { throw new Error('SIDE_EFFECT_REACHED'); }";
const mocks = {
  '@supabase/supabase-js': 'export const createClient = ' + fail,
  '@playwright/test': 'export const chromium = { launch: ' + fail + ' }; export const expect = ' + fail + '; export const devices = {}; export const defineConfig = v => v;',
  'node:child_process': 'export const execFileSync = ' + fail,
  'node:fs/promises': "import { readFileSync } from 'node:fs'; export async function readFile(p, e) { return readFileSync(p, e); } export const mkdir = " + fail + '; export const writeFile = ' + fail
};
if (process.env.TEST_BROWSER_FAILURE === '1') {
  mocks['node:child_process'] = "export const execFileSync = () => 'set-cookie: synthetic=value\\\\r\\\\n';";
  mocks['@playwright/test'] = \`const page = { goto: async () => {}, locator: () => ({}), getByLabel: name => ({fill: async value => { if (name === 'Contraseña') throw new Error('PRIVATE:' + value); }}) };
    export const chromium = { launch: async () => ({ close: async () => {}, newContext: async () => ({ addCookies: async () => {}, newPage: async () => page }) }) };
    export const expect = () => ({toContainText: async () => {}});\`;
}
registerHooks({
  resolve(s, c, next) { return s in mocks ? { url: 'mock:' + s, shortCircuit: true } : next(s, c); },
  load(u, c, next) { return u.startsWith('mock:') ? { format: 'module', source: mocks[u.slice(5)], shortCircuit: true } : next(u, c); }
});`;
function runIsolated(path, args, extra = {}) {
  // Allowlist only process-launch necessities; no inherited hosted credentials.
  const env = {};
  for (const key of ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "TEMP", "TMP", "PATHEXT"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  Object.assign(env, {
    APP_ENV: "demo", ACCEPTANCE_DEMO_PROJECT_REF: "kyjycjojzhwggjuqjnki",
    NEXT_PUBLIC_SUPABASE_URL: "https://kyjycjojzhwggjuqjnki.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_synthetic", ...extra,
  });
  return spawnSync(process.execPath, ["--import", `data:text/javascript,${encodeURIComponent(loader)}`, path, ...args],
    { env, encoding: "utf8", timeout: 10000 });
}
for (const [path, args] of hostedScripts) {
  test(`${path}: missing credentials stop before transport`, () => {
    const result = runIsolated(path, args);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /DEMO_CREDENTIALS_REQUIRED/);
    assert.doesNotMatch(result.stderr, /SIDE_EFFECT_REACHED/);
  });
  test(`${path}: blank or incomplete credentials stop before transport`, () => {
    // admin1 is required by every actual entrypoint, last in smoke/storage.
    const result = runIsolated(path, args, { ...syntheticCredentials, DEMO_ADMIN1_PASSWORD: " " });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /DEMO_CREDENTIALS_REQUIRED/);
    assert.doesNotMatch(result.stderr, /SIDE_EFFECT_REACHED|synthetic-/);
  });
  test(`${path}: complete synthetic credentials reach only mocked transport`, () => {
    const result = runIsolated(path, args, syntheticCredentials);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /SIDE_EFFECT_REACHED|VERCEL_TEST_ACCESS_FAILED/);
    assert.doesNotMatch(result.stderr, /DEMO_CREDENTIALS_REQUIRED|synthetic-/);
  });
}
for (const [path, args] of hostedScripts.filter(([p]) => /smoke|performance/.test(p))) {
  test(`${path}: browser errors never echo filled credentials`, () => {
    const result = runIsolated(path, args, { ...syntheticCredentials, TEST_BROWSER_FAILURE: "1" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /DEMO_CHECK_FAILED/);
    assert(!result.stderr.includes("synthetic-"));
  });
}
test("hosted reset refuses before SQL generation or filesystem writes", () => {
  const result = runIsolated("tests/fixtures/reset-demo.mjs", ["RESET-FICTITIOUS-DEMO-kyjycjojzhwggjuqjnki", "--prepare-sql"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /HOSTED_RESET_DISABLED/);
  assert.doesNotMatch(result.stderr, /SIDE_EFFECT_REACHED/);
});
test("direct SQL reset replaces the unsafe function with an unconditional refusal", () => {
  const sql = readFileSync("tests/fixtures/reset-demo.sql", "utf8");
  assert.match(sql, /begin\s+raise exception 'HOSTED_RESET_DISABLED/s);
  assert.doesNotMatch(sql, /delete\s+from|truncate\s+|execute\s+seed_sql|lock\s+table/i);
});
test("Playwright accepts a strictly local external-server configuration", () => {
  const result = runIsolated("playwright.config.ts", [], { NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321/",
    NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000", PLAYWRIGHT_EXTERNAL_SERVER: "1" });
  assert.equal(result.status, 0);
});
test("hosted resolver maps exactly ten distinct identities, without role fallback", () => {
  const credentials = resolveHostedCredentials(identities, syntheticCredentials);
  assert.equal(new Set(Object.values(credentials).map(c => c.password)).size, 10);
  for (const id of identities) {
    assert.deepEqual(credentials[id], { email: `${id}@example.invalid`, password: syntheticCredentials[`DEMO_${id.toUpperCase()}_PASSWORD`] });
    for (const value of [undefined, "", " ", "\t\n"]) {
      const invalid = { ...syntheticCredentials, [`DEMO_${id.toUpperCase()}_PASSWORD`]: value,
        DEMO_ADMIN_PASSWORD: "synthetic-shared", DEMO_CANDIDATE_PASSWORD: "synthetic-shared",
        DEMO_COMPANY_PASSWORD: "synthetic-shared", DEMO_PASSWORD: "synthetic-shared" };
      assert.throws(() => resolveHostedCredentials(identities, invalid), { message: /DEMO_CREDENTIALS_REQUIRED/ });
    }
  }
  for (const id of ["unknown", "admin3", "admin4", "candidate5", "company5"]) {
    assert.throws(() => resolveHostedCredentials([id], { ...syntheticCredentials, [`DEMO_${id.toUpperCase()}_PASSWORD`]: "synthetic-extra" }), { message: /DEMO_CREDENTIALS_REQUIRED/ });
  }
  const example = readFileSync(".env.example", "utf8");
  for (const id of identities) assert.match(example, new RegExp(`^DEMO_${id.toUpperCase()}_PASSWORD=$`, "m"));
  assert.doesNotMatch(example, /^DEMO_(ADMIN|CANDIDATE|COMPANY)_PASSWORD=/m);
});
test("hosted four-admin request refuses before any transport, even with all ten credentials", () => {
  const result = runIsolated("tests/quality/demo-performance.mjs", ["concurrent-admins", "00000000-0000-4000-8000-000000000001", "dpl_synthetic"], syntheticCredentials);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /LOCAL_ACCEPTANCE_REQUIRED/);
  assert.doesNotMatch(result.stderr, /SIDE_EFFECT_REACHED|synthetic-/);
});
test("four local admins resolve only behind exact destinations and ownership guard", () => {
  const result = runIsolated("tests/quality/demo-performance.mjs", ["concurrent-admins", "00000000-0000-4000-8000-000000000001", "dpl_synthetic"], {
    APP_ENV: "local", NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
    LOCAL_ACCEPTANCE_PROJECT_OWNED: "funes-empleo",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /SIDE_EFFECT_REACHED/);
  assert.doesNotMatch(result.stderr, /DEMO_CREDENTIALS_REQUIRED|VERCEL_TEST_ACCESS_FAILED/);
});
test("local credentials require exact loopback origins for both destinations", () => {
  const local = { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_APP_URL: "http://localhost:3000/" };
  assertLocalTargets(local);
  assert(typeof localFixturePassword(local) === "string"); // Never snapshot the local password.
  for (const value of [undefined, "", "https://localhost:3000", "http://localhost:3001", "http://localhost:3000.evil.invalid",
    "http://localhost:3000@evil.invalid", "http://evil.invalid@localhost:3000", "http://127.1:3000",
    "http://localhost:3000/path", "http://localhost:3000?x=1", "http://localhost:3000#fragment"]) {
    assert.throws(() => localFixturePassword({ ...local, NEXT_PUBLIC_APP_URL: value }), { message: /LOCAL_FIXTURE_TARGET_REQUIRED/ });
  }
  assert.throws(() => localFixturePassword({ ...local, NEXT_PUBLIC_SUPABASE_URL: "https://remote.invalid" }), { message: /LOCAL_FIXTURE_TARGET_REQUIRED/ });
});
test("all direct E2E consumers use centralized guarded credentials", () => {
  const consumers = ["accounts", "admin-metrics", "assisted-candidate", "candidate-import", "candidate-self-service", "company-offers", "intermediation"];
  for (const name of consumers) {
    const source = readFileSync(`tests/e2e/${name}.spec.ts`, "utf8");
    assert(source.includes("assertLocalTargets"));
    assert(source.includes("localFixturePassword") || source.includes("loginFixture"));
    assert(!source.includes('startsWith("http://127.0.0.1:54321")'));
  }
  const helper = readFileSync("tests/e2e/fixtures/quality.ts", "utf8");
  assert(helper.indexOf("const password = localFixturePassword();") < helper.indexOf('await page.goto("/login")'));
});
for (const extra of [
  { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321.evil.invalid" },
  { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321@evil.invalid" },
  { NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54322" },
  { NEXT_PUBLIC_APP_URL: "https://remote.invalid" },
  { NEXT_PUBLIC_APP_URL: "http://localhost:3000@remote.invalid" },
]) {
  test(`Playwright rejects unsafe external-server target ${Object.keys(extra)[0]}`, () => {
    const result = runIsolated("playwright.config.ts", [], {
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000",
      PLAYWRIGHT_EXTERNAL_SERVER: "1", ...extra,
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /LOCAL_FIXTURE_TARGET_REQUIRED/);
  });
}
