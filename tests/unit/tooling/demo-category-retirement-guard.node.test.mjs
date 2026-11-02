import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

for (const [name, overrides, expected] of [
  ["missing ownership", { LOCAL_ACCEPTANCE_PROJECT_OWNED: "" }, /LOCAL_RETIREMENT_OWNERSHIP_REQUIRED/],
  ["ordinary working project", { LOCAL_ACCEPTANCE_PROJECT_OWNED: "funes-empleo" }, /LOCAL_RETIREMENT_OWNERSHIP_REQUIRED/],
  ["hosted target", { LOCAL_ACCEPTANCE_PROJECT_OWNED: "funes-probe-check", NEXT_PUBLIC_SUPABASE_URL: "https://remote.invalid" }, /LOCAL_FIXTURE_TARGET_REQUIRED/],
  ["unowned configuration", { LOCAL_ACCEPTANCE_PROJECT_OWNED: "funes-probe-check" }, /LOCAL_RETIREMENT_PROJECT_REQUIRED/],
]) {
  test(`retirement SQL test rejects ${name} before Docker or SQL`, () => {
    const result = spawnSync(process.execPath, ["tests/quality/retire-demo-categories.mjs", "--confirm-isolated-test"], {
      encoding: "utf8", env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000", ...overrides },
    });
    assert.notEqual(result.status, 0); assert.match(result.stderr, expected);
  });
}
