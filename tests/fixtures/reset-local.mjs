import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { assertLocalTargets, localFixturePassword } from "./credentials.mjs";
import { generateAcceptanceSeed } from "./generate-acceptance-seed.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const fixtureDir = resolve(root, "tests/fixtures");
const manifest = JSON.parse(await readFile(resolve(fixtureDir, "acceptance-manifest.json"), "utf8"));
const cli = resolve(root, "node_modules/supabase/dist/supabase.js");

// Capture diagnostics before output; never print status containing credentials.
function redact(text) {
  return text.replaceAll("Fictitious-Local-Only-2026!", "[LOCAL_FIXTURE_PASSWORD]")
    .replace(/(?:sb_secret_|sb_publishable_)[A-Za-z0-9_-]+/g, "[KEY]")
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT]");
}
function supabase(args, output = "pipe") {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (output === "report") console.log(redact((result.stdout || "") + (result.stderr || "")));
  if (result.error || result.status !== 0) throw new Error(`La operación local de Supabase falló (${args[0]}).`);
  return result.stdout;
}

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }

const args = process.argv.slice(2);
const acceptance = args.includes("--acceptance");
const databaseOnly = args.includes("--database-only");
if (!args.includes("--confirm-local-reset") || args.some(a => !["--confirm-local-reset", "--acceptance", "--database-only"].includes(a)) || (databaseOnly && !acceptance)) {
  throw new Error("Usá --confirm-local-reset; aceptación requiere --acceptance (opcional --database-only).");
}
if (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_APP_URL) assertLocalTargets();
if (process.env.CI !== "true" && process.env.LOCAL_ACCEPTANCE_PROJECT_OWNED !== "funes-empleo") {
  throw new Error("LOCAL_PROJECT_OWNERSHIP_REQUIRED: no reiniciar servicios compartidos; usá CI aislado o confirmá propiedad del proyecto local.");
}
const dataset = acceptance ? manifest.acceptance : manifest.interactive;
const config = await readFile(resolve(root, "supabase/config.toml"), "utf8");
if (!/^project_id = "funes-empleo"$/m.test(config)) throw new Error("Proyecto local inesperado.");
const status = JSON.parse(supabase(["status", "-o", "json"]));
const api = new URL(status.API_URL);
const database = new URL(status.DB_URL);
if (!["127.0.0.1", "localhost"].includes(api.hostname) || api.port !== "54321" ||
    !["127.0.0.1", "localhost"].includes(database.hostname) || database.port !== "54322") {
  throw new Error("El destino no es el Supabase local esperado.");
}
assertLocalTargets({ NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000" });
const localEnv = { NEXT_PUBLIC_SUPABASE_URL: status.API_URL, NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3000" };
const password = localFixturePassword(localEnv);
const template = (await readFile(resolve(root, manifest.interactive.seedFile), "utf8")).replaceAll("\r\n", "\n");
const seed = (await readFile(resolve(root, dataset.seedFile), "utf8")).replaceAll("\r\n", "\n");
const pdf = await readFile(resolve(fixtureDir, manifest.cvDownload.file));
if (sha256(template) !== manifest.interactive.seedSha256 || sha256(seed) !== dataset.seedSha256 ||
    (acceptance && seed !== generateAcceptanceSeed(template)) ||
    sha256(pdf) !== manifest.cvSha256 || pdf.length !== manifest.cvDownload.bytes) {
  throw new Error("El fixture cambió: actualizá el manifiesto y sus expectativas antes de reiniciar.");
}

if (acceptance) {
  supabase(["db", "reset", "--local", "--no-seed"], "report");
  const loaded = spawnSync("docker", ["exec", "-i", "supabase_db_funes-empleo", "psql", "-X", "-q", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], {
    input: "begin; set local funes.fixture_context='isolated-local-acceptance';\n" + seed + "\ncommit;",
    encoding: "utf8", maxBuffer: 16 * 1024 * 1024,
  });
  if (loaded.error || loaded.status !== 0) throw new Error("LOCAL_ACCEPTANCE_LOAD_FAILED: no continuar con fixture parcial.");
  supabase(["test", "db"], "report");
} else {
  supabase(["db", "reset", "--local"], "report");
}
if (databaseOnly) {
  console.log(`Aceptación TEST-ONLY ${dataset.version}: pgTAP completo, hash ${dataset.seedSha256}; sin blobs PDF.`);
  process.exit(0);
}

const secret = status.SECRET_KEY || status.SERVICE_ROLE_KEY;
if (!secret) throw new Error("No hay credencial de servicio local para cargar el PDF ficticio.");
const storage = createClient(status.API_URL, secret, { auth: { persistSession: false } }).storage.from("candidate-cvs");
const fixtureId = (kind, index) => {
  const digest = createHash("md5").update(`funes-demo-v1:${kind}:${index}`).digest("hex");
  return `${digest.slice(0, 8)}-${digest.slice(8, 12)}-${digest.slice(12, 16)}-${digest.slice(16, 20)}-${digest.slice(20)}`;
};
for (let index = 1; index <= dataset.counts.candidates; index++) {
  const path = `${fixtureId("profile", index)}/${fixtureId("cv", index)}.pdf`;
  const { error } = await storage.upload(path, pdf, { contentType: "application/pdf", upsert: false });
  if (error) throw new Error(`No se cargó el CV ficticio ${index}; fixture incompleto.`);
}
const publicKey = status.ANON_KEY || status.PUBLISHABLE_KEY;
if (!publicKey) throw new Error("Falta la clave pública local para verificar Storage.");
async function signedIn(email) {
  const client = createClient(status.API_URL, publicKey, { auth: { persistSession: false } });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error("No se pudo iniciar sesión con una identidad ficticia local.");
  return client;
}
const targetPath = `${fixtureId("profile", 1)}/${fixtureId("cv", 1)}.pdf`;
// Acceptance company1 legitimately receives candidates 1..10 through openings
// 1/51. Candidate11 belongs to company2; the interactive foreign CV is candidate2.
const foreignCandidateNumber = acceptance ? 11 : 2;
const otherPath = `${fixtureId("profile", foreignCandidateNumber)}/${fixtureId("cv", foreignCandidateNumber)}.pdf`;
const candidate = await signedIn("candidate1@example.invalid");
const companyWithReferral = await signedIn("company1@example.invalid");
const companyWithoutReferral = await signedIn("company2@example.invalid");
for (const client of [candidate, companyWithReferral]) {
  const { data, error } = await client.storage.from("candidate-cvs").download(targetPath);
  if (error || !data || sha256(Buffer.from(await data.arrayBuffer())) !== manifest.cvSha256) {
    throw new Error("El dueño o la empresa derivada no puede descargar el CV ficticio exacto.");
  }
}
if (!(await companyWithReferral.storage.from("candidate-cvs").download(otherPath)).error) {
  throw new Error("Storage permitió a company1 descargar el CV extranjero del dataset seleccionado.");
}
if (!(await companyWithoutReferral.storage.from("candidate-cvs").download(targetPath)).error) {
  throw new Error("Storage permitió a company2 descargar el CV target sin derivación propia.");
}
if (!(await companyWithReferral.storage.from("candidate-cvs").createSignedUrl(targetPath, 60)).error) {
  throw new Error("Storage permitió crear una URL firmada reutilizable del CV target.");
}
if (!(await createClient(status.API_URL, publicKey).storage.from("candidate-cvs").download(targetPath)).error) {
  throw new Error("Storage permitió una descarga anónima del CV target.");
}
for (const client of [candidate, companyWithReferral, companyWithoutReferral]) await client.auth.signOut({ scope: "local" });
console.log(`Fixture ${dataset.version} verificado: ${dataset.counts.candidates} candidatos, ${dataset.counts.companies} empresas, ${dataset.counts.offers} ofertas, ${dataset.counts.participations} participaciones; ${dataset.counts.candidates} CV ficticios.`);
console.log(`SHA-256 seed: ${dataset.seedSha256}`);
