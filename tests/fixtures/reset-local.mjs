import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDir = resolve(root, "tests/fixtures");
const manifest = JSON.parse(await readFile(resolve(fixtureDir, "acceptance-manifest.json"), "utf8"));
const cli = resolve(root, "node_modules/supabase/dist/supabase.js");

function supabase(args, output = "pipe") {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: output === "inherit" ? "inherit" : ["ignore", "pipe", "pipe"],
  });
  if (result.error || result.status !== 0) throw new Error(`La operación local de Supabase falló (${args[0]}).`);
  return result.stdout;
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

if (process.argv.slice(2).join(" ") !== "--confirm-local-reset") {
  throw new Error("Este comando destruye el dataset LOCAL ficticio. Usá --confirm-local-reset.");
}
const config = await readFile(resolve(root, "supabase/config.toml"), "utf8");
if (!/^project_id = "funes-empleo"$/m.test(config)) throw new Error("Proyecto local inesperado.");
const status = JSON.parse(supabase(["status", "-o", "json"]));
const api = new URL(status.API_URL);
const database = new URL(status.DB_URL);
if (!["127.0.0.1", "localhost"].includes(api.hostname) || api.port !== "54321" ||
    !["127.0.0.1", "localhost"].includes(database.hostname) || database.port !== "54322") {
  throw new Error("El destino no es el Supabase local esperado.");
}
const pdf = await readFile(resolve(fixtureDir, manifest.cvDownload.file));
if (sha256((await readFile(resolve(root, "supabase/seed.sql"), "utf8")).replaceAll("\r\n", "\n")) !== manifest.seedSha256 ||
    sha256(pdf) !== manifest.cvSha256 || pdf.length !== manifest.cvDownload.bytes) {
  throw new Error("El fixture cambió: actualizá el manifiesto y sus expectativas antes de reiniciar.");
}

supabase(["db", "reset", "--local"], "inherit");
// Post-reset assertions are transactional pgTAP checks against only the local DB.
supabase(["test", "db"], "inherit");

const secret = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
if (!secret) throw new Error("No hay credencial de servicio local para cargar el PDF ficticio.");
const storage = createClient(status.API_URL, secret, { auth: { persistSession: false } }).storage.from("candidate-cvs");
const fixtureId = (kind, index) => {
  const digest = createHash("md5").update(`funes-demo-v1:${kind}:${index}`).digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20)}`;
};
for (let index = 1; index <= manifest.counts.candidates; index++) {
  const path = `${fixtureId("profile", index)}/${fixtureId("cv", index)}.pdf`;
  const { error } = await storage.upload(path, pdf, { contentType: "application/pdf", upsert: false });
  if (error) throw new Error(`No se cargó el CV ficticio ${index}; fixture incompleto.`);
}
const publicKey = status.ANON_KEY || status.PUBLISHABLE_KEY;
if (!publicKey) throw new Error("Falta la clave pública local para verificar Storage.");
async function signedIn(email) {
  const client = createClient(status.API_URL, publicKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password: "Fictitious-Local-Only-2026!" });
  if (error) throw new Error("No se pudo iniciar sesión con una identidad ficticia local.");
  return client;
}
const targetPath = `${fixtureId("profile", 1)}/${fixtureId("cv", 1)}.pdf`;
const otherPath = `${fixtureId("profile", 11)}/${fixtureId("cv", 11)}.pdf`;
const candidate = await signedIn("candidate1@example.invalid");
const companyWithReferral = await signedIn("company1@example.invalid");
const companyWithoutReferral = await signedIn("company2@example.invalid");
for (const client of [candidate, companyWithReferral]) {
  const { data, error } = await client.storage.from("candidate-cvs").download(targetPath);
  if (error || !data || sha256(Buffer.from(await data.arrayBuffer())) !== manifest.cvSha256) {
    throw new Error("El dueño o la empresa derivada no puede descargar el CV ficticio exacto.");
  }
}
if (!(await companyWithReferral.storage.from("candidate-cvs").download(otherPath)).error ||
    !(await companyWithoutReferral.storage.from("candidate-cvs").download(targetPath)).error ||
    !(await companyWithReferral.storage.from("candidate-cvs").createSignedUrl(targetPath, 60)).error ||
    !(await createClient(status.API_URL, publicKey).storage.from("candidate-cvs").download(targetPath)).error) {
  throw new Error("Storage permitió un CV ajeno, una URL firmada o una descarga anónima.");
}
console.log(`Fixture ${manifest.version} verificado: ${manifest.counts.candidates} candidatos, ${manifest.counts.companies} empresas, ${manifest.counts.offers} ofertas, ${manifest.counts.participations} participaciones; ${manifest.counts.candidates} CV ficticios.`);
console.log(`SHA-256 seed: ${manifest.seedSha256}`);
