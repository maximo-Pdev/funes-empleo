import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

for (const [label, api, app, ownership, expected] of [
  ["rechaza una API alojada", "https://remote.invalid", "http://127.0.0.1:3000", "funes-empleo", /LOCAL_FIXTURE_TARGET_REQUIRED/],
  ["rechaza una aplicación ajena", "http://127.0.0.1:54321", "https://remote.invalid", "funes-empleo", /LOCAL_FIXTURE_TARGET_REQUIRED/],
  ["exige propiedad explícita antes de Docker o SQL", "http://127.0.0.1:54321", "http://127.0.0.1:3000", "", /LOCAL_PROJECT_OWNERSHIP_REQUIRED/],
]) test(`prueba de administradores: ${label}`, () => {
  const result = spawnSync(process.execPath, ["tests/quality/admin-account-concurrency.mjs"], { encoding: "utf8", timeout: 10000,
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: api, NEXT_PUBLIC_APP_URL: app, LOCAL_ACCEPTANCE_PROJECT_OWNED: ownership } });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, expected);
  assert.doesNotMatch(result.stderr, /failed to connect|docker API|psql:/i);
});
