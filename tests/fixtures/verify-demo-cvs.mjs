import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

assert.equal(process.argv[2], "--confirm-fictitious-demo");
assert.match(process.argv[3] ?? "", /^[a-f0-9-]{36}$/, "Supply the SQL reset receipt ID");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, "https://kyjycjojzhwggjuqjnki.supabase.co");
const manifest = JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json", "utf8"));
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });
const { error } = await client.auth.signInWithPassword({ email: "admin1@example.invalid", password: "Fictitious-Local-Only-2026!" });
assert.equal(error, null);
const id = (kind,n) => { const h=createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
let next = 1, verified = 0;
try {
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next <= 500) {
      const n = next++;
      const { data, error: downloadError } = await client.storage.from("candidate-cvs").download(`${id("profile",n)}/${id("cv",n)}.pdf`);
      assert.equal(downloadError, null, `CV ficticio ${n} no descargable`);
      const bytes = Buffer.from(await data.arrayBuffer());
      assert.equal(bytes.length, manifest.cvDownload.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), manifest.cvSha256);
      verified++;
    }
  }));
  assert.equal(verified, 500);
  console.log(JSON.stringify({ resetId: process.argv[3], at: new Date().toISOString(), cvVerified: verified,
    cvSha256: manifest.cvSha256, bytesEach: manifest.cvDownload.bytes }));
} finally { await client.auth.signOut({ scope: "local" }); }
