import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";

// One-time bootstrap: only the explicitly authorized, exclusively fictitious demo.
const ref = "kyjycjojzhwggjuqjnki";
assert.equal(process.argv[2], `--confirm-demo=${ref}`);
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, `https://${ref}.supabase.co`);
const manifest = JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json", "utf8"));
const pdf = await readFile(`tests/fixtures/${manifest.cvDownload.file}`);
assert.equal(createHash("sha256").update(pdf).digest("hex"), manifest.cvSha256);
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const login = await client.auth.signInWithPassword({ email: "admin1@example.invalid", password: "Fictitious-Local-Only-2026!" });
assert.equal(login.error, null, "No se pudo autenticar la cuenta ficticia de demo.");
const { data: docs, error } = await client.from("cv_documents").select("id,storage_path,status,validation_result,sha256").order("id");
assert.equal(error, null);
assert.equal(docs.length, 500);
assert(docs.every(d => d.status === "rejected" && d.validation_result === "upload_pending" && d.sha256 === manifest.cvSha256));
let done = 0;
for (const doc of docs) {
  const uploaded = await client.storage.from("candidate-cvs").upload(doc.storage_path, pdf, { contentType: "application/pdf", upsert: false });
  if (uploaded.error) {
    // A resumed bootstrap may encounter an existing object; verify its exact bytes.
    const existing = await client.storage.from("candidate-cvs").download(doc.storage_path);
    assert.equal(existing.error, null, `No se cargó el PDF ficticio ${done + 1}`);
    assert.equal(createHash("sha256").update(Buffer.from(await existing.data.arrayBuffer())).digest("hex"), manifest.cvSha256);
  }
  if (++done % 100 === 0) console.log(`${done}/500 PDF ficticios cargados.`);
}
await client.auth.signOut();
console.log("Carga terminada; verificar los 500 objetos antes de consolidar metadata del fixture.");
