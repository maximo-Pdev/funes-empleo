import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";

// Administrative SQL transport only. Does not read .env files or accept arbitrary SQL/projects.
const ref = "kyjycjojzhwggjuqjnki";
const confirmation = `RESET-FICTITIOUS-DEMO-${ref}`;
assert.equal(process.env.APP_ENV, "demo", "Reset requires APP_ENV=demo");
assert.equal(process.env.ACCEPTANCE_DEMO_PROJECT_REF, ref, "Wrong demo project");
assert.equal(process.argv[2], confirmation, "Explicit reset confirmation required");
assert.equal(process.argv[3], "--prepare-sql", "Use the authenticated Supabase MCP maintenance transport");
const manifest = JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json", "utf8"));
const seed = (await readFile("supabase/seed.sql", "utf8")).replaceAll("\r\n", "\n");
assert.equal(createHash("sha256").update(seed).digest("hex"), manifest.seedSha256);
const quote = value => `'${value.replaceAll("'", "''")}'`;
const query = `select private.reset_fictitious_demo('demo',${quote(ref)},${quote(confirmation)},${quote(seed)}) as receipt;`;
await mkdir("test-results", { recursive: true });
await writeFile("test-results/reset-demo-query.sql", query);
console.log("SQL preparado, todavía NO ejecutado. Ejecutar mediante Supabase MCP en el proyecto demo exacto; guardar recibo y verificar los 500 PDF antes de medir.");
