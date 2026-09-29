import { execFileSync } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const [scenario, resetId, deployment] = process.argv.slice(2);
assert(["candidate", "openings", "companies", "cv", "import-preview", "import-confirm"].includes(scenario));
assert.match(resetId ?? "", /^[a-f0-9-]{36}$/);
assert.match(deployment ?? "", /^dpl_[A-Za-z0-9]+$/);
assert.equal(process.env.APP_ENV, "demo");
assert.equal(process.env.ACCEPTANCE_DEMO_PROJECT_REF, "kyjycjojzhwggjuqjnki");
const base = "https://funes-empleo-demo.vercel.app";
const manifest = JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json", "utf8"));
const command = "npm exec --yes --package=vercel@50.35.0 -- vercel curl '/login?x-vercel-set-bypass-cookie=true' --deployment https://funes-empleo-demo.vercel.app --scope pantherium-8487s-projects -- --silent --dump-header - --output NUL";
const headers = execFileSync("powershell.exe", ["-NoProfile", "-Command", command], { encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "pipe"] });
const cookies = [...headers.matchAll(/^set-cookie:\s*([^=;\s]+)=([^;\r\n]*)/gim)]
  .map(m => ({ name: m[1], value: m[2], url: base, secure: true, httpOnly: true }));
assert(cookies.length > 0);
const id = (kind,n) => { const h=createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
const browser = await chromium.launch();
let milliseconds, limit, batchId;
try {
  const context = await browser.newContext({ baseURL: base, viewport: { width:1366,height:768 } });
  await context.addCookies(cookies);
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña",{exact:true}).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button",{name:"Iniciar sesión",exact:true}).click();
  await page.waitForURL("**/account");
  if (scenario === "candidate") {
    await page.goto("/admin/candidates");
    await page.getByLabel("Término",{exact:true}).fill(manifest.sc008a.candidateSearch.term);
    await page.getByLabel("Categoría",{exact:true}).selectOption({label:"Categoría ficticia B"});
    await page.getByLabel("Disponibilidad",{exact:true}).fill("available");
    const start=performance.now();
    await page.getByRole("button",{name:"Buscar candidatos",exact:true}).click();
    await expect(page.getByRole("heading",{name:"Resultados: 1",exact:true})).toBeVisible();
    await expect(page.getByRole("link",{name:manifest.sc008a.candidateSearch.term,exact:true})).toBeVisible();
    milliseconds=performance.now()-start; limit=3000;
  } else if (["openings","companies"].includes(scenario)) {
    const route=scenario==="openings"?"openings":"empresas", status=scenario==="openings"?"published":"active";
    const title=scenario==="openings"?"Ofertas: 80":"Empresas: 50";
    await page.goto(`/admin/${route}?status=${status}&page=1`);
    await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
    const start=performance.now();
    await page.getByRole("link",{name:"Siguiente",exact:true}).click();
    await page.waitForURL(/page=2/);
    await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
    await expect(page.locator("main li a")).toHaveCount(10);
    milliseconds=performance.now()-start; limit=3000;
  } else if (scenario === "cv") {
    const start=performance.now();
    const response=await context.request.get(`/api/cv/${id("cv",1)}`);
    const bytes=await response.body();
    milliseconds=performance.now()-start; limit=10000;
    assert.equal(response.status(),200); assert.equal(bytes.length,manifest.cvDownload.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"),manifest.cvSha256);
  } else {
    await page.goto("/admin/imports/new");
    const rows=Array.from({length:1000},(_,n)=>`Persona ficticia CSV ${n+1},${98000001+n},performance${n+1}@example.invalid,,Funes,DEMO-A,Prueba ficticia,available,PERF_${n+1}`);
    const csv="nombre,dni,email,telefono,localidad,categorias,experiencia,disponibilidad,referencia\n"+rows.join("\n");
    await page.getByLabel("CSV ficticio",{exact:true}).setInputFiles({name:"performance-ficticio.csv",mimeType:"text/csv",buffer:Buffer.from(csv)});
    await page.getByLabel("Confirmo que contiene solo datos ficticios").check();
    const previewStart=performance.now();
    await page.getByRole("button",{name:"Previsualizar",exact:true}).click();
    await expect(page.getByText("Listo para confirmar",{exact:true})).toBeVisible({timeout:90000});
    milliseconds=performance.now()-previewStart; limit=30000;
    batchId=page.url().split("/").pop(); assert.match(batchId,/^[a-f0-9-]{36}$/);
    // Confirmation has its own separately reset run; its prerequisite preview is outside its clock.
    if (scenario === "import-confirm") {
      const start=performance.now();
      await page.getByRole("button",{name:"Confirmar importación",exact:true}).click();
      await expect(page.getByText("Importación completada",{exact:true})).toBeVisible({timeout:90000});
      milliseconds=performance.now()-start; limit=60000;
    }
  }
  console.log(JSON.stringify({scenario,resetId,deployment,url:base,at:new Date().toISOString(),
    fixture:manifest.version,seedSha256:manifest.seedSha256,browser:browser.version(),viewport:"1366x768",
    device:process.platform,connection:"Conexión del operador; sin throttling artificial",milliseconds,limit,
    pass:milliseconds<=limit,batchId,integrity:"SQL posterior requerido para importaciones; nunca inferirlo del tiempo"}));
  if (milliseconds>limit) process.exitCode=1;
} finally { await browser.close(); }
