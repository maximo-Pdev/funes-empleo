import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { resolveHostedCredentials } from "../fixtures/credentials.mjs";

const credentials = resolveHostedCredentials(["candidate1", "candidate2", "company1", "company2", "admin1"]);

assert.equal(process.argv[2], "--confirm-fictitious-demo");
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, "https://kyjycjojzhwggjuqjnki.supabase.co");
const manifest=JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json","utf8"));
const path="2ea4cdc3-2bde-90ca-b1b3-fe159516a9fd/73acc463-8967-0b2c-54d5-ff2d8cb0dc1b.pdf";
for (const [identity, allowed] of [[null,false],["candidate1",true],["candidate2",false],
  ["company1",true],["company2",false],["admin1",true]]) {
  const c=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {auth:{persistSession:false,autoRefreshToken:false}});
  if(identity) assert(!(await c.auth.signInWithPassword(credentials[identity])).error, "No se pudo autenticar la cuenta ficticia de demo.");
  try {
    const downloaded=await c.storage.from("candidate-cvs").download(path);
    assert.equal(!downloaded.error,allowed,`Descarga: ${identity??"anónimo"}`);
    if(allowed) assert.equal(createHash("sha256").update(Buffer.from(await downloaded.data.arrayBuffer())).digest("hex"),manifest.cvSha256);
    const signed=await c.storage.from("candidate-cvs").createSignedUrl(path,60);
    assert(signed.error && !signed.data,"Debe denegar URL reutilizable incluso al administrador");
    const list=await c.storage.from("candidate-cvs").list(path.split("/")[0]);
    assert(list.error || list.data.length===0,"Debe denegar listados de objetos");
    console.log(`PASS Storage demo: ${identity??"anónimo"}; descarga ${allowed?"exacta":"denegada"}, sin firma/listado.`);
  } finally { if(identity) await c.auth.signOut({scope:"local"}); }
}
