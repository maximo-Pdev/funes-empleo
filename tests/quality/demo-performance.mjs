import { execFileSync } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { cpus, totalmem, release } from "node:os";
import { assertLocalTargets, localFixturePassword, resolveHostedCredentials } from "../fixtures/credentials.mjs";

const [scenario, resetId, deployment] = process.argv.slice(2);
const localAcceptance = scenario === "concurrent-admins";
if (localAcceptance && process.env.APP_ENV !== "local") throw new Error("LOCAL_ACCEPTANCE_REQUIRED: cuatro admins se prueban en aceptación local aislada, no en la demo interactiva.");
if (localAcceptance) {
  assertLocalTargets();
  if (process.env.CI !== "true" && process.env.LOCAL_ACCEPTANCE_PROJECT_OWNED !== "funes-empleo") throw new Error("LOCAL_PROJECT_OWNERSHIP_REQUIRED: no mutar servicios compartidos.");
}
const credentials = localAcceptance
  ? Object.fromEntries([1,2,3,4].map(n => [`admin${n}`, { email: `admin${n}@example.invalid`, password: localFixturePassword() }]))
  : resolveHostedCredentials(["admin1"]);
assert(["candidate", "openings", "companies", "cv", "import-preview", "import-confirm", "concurrent-admins"].includes(scenario));
assert.match(resetId ?? "", /^[a-f0-9-]{36}$/);
assert.match(deployment ?? "", /^dpl_[A-Za-z0-9]+$/);
if (!localAcceptance) {
  assert.equal(process.env.APP_ENV, "demo");
  assert.equal(process.env.ACCEPTANCE_DEMO_PROJECT_REF, "kyjycjojzhwggjuqjnki");
}
const base = localAcceptance ? "http://127.0.0.1:3000" : "https://funes-empleo-demo.vercel.app";
const fixtures = JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json", "utf8"));
const manifest = { ...fixtures, ...(localAcceptance ? fixtures.acceptance : fixtures.interactive) };
const command = "npm.cmd exec --yes --package=vercel@50.35.0 -- vercel curl '/login?x-vercel-set-bypass-cookie=true' --deployment https://funes-empleo-demo.vercel.app --scope pantherium-8487s-projects -- --silent --dump-header - --output NUL";
let headers = "";
try {
  if (!localAcceptance) headers = execFileSync("powershell.exe", ["-NoProfile", "-Command", command], { encoding: "utf8", timeout: 60000, stdio: ["ignore", "pipe", "pipe"] });
} catch { throw new Error("VERCEL_TEST_ACCESS_FAILED: revisar la sesión CLI sin publicar encabezados"); }
const cookies = [...headers.matchAll(/^set-cookie:\s*([^=;\s]+)=([^;\r\n]*)/gim)]
  .map(m => ({ name: m[1], value: m[2], url: base, secure: true, httpOnly: true }));
assert(localAcceptance || cookies.length > 0);
const id = (kind,n) => { const h=createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
const browser = await chromium.launch();
let milliseconds, limit, batchId, concurrentResults;
try {
  const context = await browser.newContext({ baseURL: base, viewport: { width:1366,height:768 } });
  await context.addCookies(cookies);
  const page = await context.newPage();
  page.setDefaultTimeout(90000);
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(credentials.admin1.email);
  await page.getByLabel("Contraseña",{exact:true}).fill(credentials.admin1.password);
  await page.getByRole("button",{name:"Iniciar sesión",exact:true}).click();
  await page.waitForURL("**/account");
  if (scenario === "concurrent-admins") {
    const pages=[page];
    for (let n=2;n<=4;n++) {
      const individual=await browser.newContext({baseURL:base,viewport:{width:1366,height:768}});
      await individual.addCookies(cookies);
      const p=await individual.newPage(); p.setDefaultTimeout(90000);
      await p.goto("/login");
      await p.getByLabel("Correo electrónico").fill(credentials[`admin${n}`].email);
      await p.getByLabel("Contraseña",{exact:true}).fill(credentials[`admin${n}`].password);
      await p.getByRole("button",{name:"Iniciar sesión",exact:true}).click();
      await p.waitForURL("**/account"); pages.push(p);
    }
    const fixture=manifest.concurrentAdmins;
    await pages[0].goto(`/admin/openings/${id("opening",fixture.openingNumber)}`);
    await pages[0].waitForLoadState("networkidle");
    await pages[0].getByLabel("Decisión",{exact:true}).selectOption("approved");
    await pages[1].goto(`/admin/participations/${id("participation",fixture.preselectionParticipation)}`);
    await pages[1].waitForLoadState("networkidle");
    await pages[1].getByLabel("Acción",{exact:true}).selectOption("preselect");
    await pages[1].getByLabel(/^Motivo interno/).fill("Prueba ficticia concurrente: omisión justificada de preentrevista");
    await pages[2].goto(`/admin/participations/${id("participation",fixture.contactParticipation)}`);
    await pages[2].waitForLoadState("networkidle");
    await pages[2].getByLabel(/^Fecha y hora \(Funes\)/).fill("2026-09-29T12:00");
    await pages[2].getByLabel(/^Resumen interno/).fill(`Contacto ficticio concurrente ${resetId}`);
    await pages[3].goto(`/admin/participations/${id("participation",fixture.outcomeParticipation)}`);
    await pages[3].waitForLoadState("networkidle");
    await pages[3].getByLabel("Acción",{exact:true}).selectOption("confirm_hired");
    await pages[3].getByLabel("Motivo interno",{exact:true}).fill("Resultado ficticio confirmado para prueba concurrente");
    const names=["moderation","preselection","contact","outcome"];
    // All four prepared forms reach this shared barrier before any final click.
    const barrier=performance.now();
    concurrentResults=await Promise.all(pages.map(async (p,n)=>{
      const start=performance.now();
      try {
        await p.getByRole("button",{name:n===0?"Guardar decisión":n===2?"Guardar contacto":"Registrar acción",exact:true}).click();
        if(n===0) await expect(p.getByText("Estado: published",{exact:true})).toBeVisible();
        else if(n===2) await expect(p.getByText(`Contacto ficticio concurrente ${resetId}`,{exact:true})).toBeVisible();
        else await expect(p.getByRole("status").filter({hasText:`Resultado o estado vigente: ${n===1?"Preseleccionada":"Persona contratada"}`})).toBeVisible();
        const duration=performance.now()-start;
        return {action:names[n],admin:n+1,startOffset:start-barrier,milliseconds:duration,limit:5000,pass:duration<=5000};
      } catch { return {action:names[n],admin:n+1,startOffset:start-barrier,milliseconds:performance.now()-start,limit:5000,pass:false,error:"UI_SUCCESS_NOT_OBSERVED"}; }
    }));
    milliseconds=Math.max(...concurrentResults.map(r=>r.milliseconds)); limit=5000;
    if(concurrentResults.some(r=>!r.pass)) process.exitCode=1;
  } else if (scenario === "candidate") {
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
    const entry = scenario === "openings" ? manifest.sc008a.openingList : manifest.sc008a.companyList;
    const title = `${scenario === "openings" ? "Ofertas" : "Empresas"}: ${entry.expectedTotal}`;
    await page.goto(`/admin/${route}?status=${status}&page=1`);
    await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
    const start=performance.now();
    // Interactive lists have only four rows: do not invent a second page or
    // represent this small demo check as a 500/50/100/1000 benchmark.
    await page.goto(`/admin/${route}?status=${status}&page=${entry.page}`);
    await expect(page.getByText(`Página ${entry.page} de ${Math.ceil(entry.expectedTotal / entry.pageSize)}`,{exact:true})).toBeVisible();
    await expect(page.getByRole("heading",{name:title,exact:true})).toBeVisible();
    await expect(page.locator("main li a")).toHaveCount(entry.expectedRows);
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
    await expect(page.getByText("Total: 1000. Aceptables: 1000. Inválidas o categorías sin mapear: 0. Duplicadas: 0.",{exact:true})).toBeVisible();
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
    fixture:manifest.version,seedSha256:manifest.seedSha256,dataset:localAcceptance?"acceptance":"interactive",
    acceptanceBenchmark:localAcceptance,browser:browser.version(),viewport:"1366x768",
    device:{os:process.platform,release:release(),cpu:cpus()[0]?.model,memoryGiB:Math.round(totalmem()/1024**3)},
    connection:"Conexión del operador; sin throttling artificial; estabilidad de red no certificada",milliseconds,limit,
    pass:milliseconds<=limit && !concurrentResults?.some(r=>!r.pass),batchId,concurrentResults,
    variant:concurrentResults?manifest.concurrentAdmins.variant:undefined,
    integrity:"SQL posterior requerido para importaciones/concurrencia; nunca inferirlo del tiempo"}));
  if (milliseconds>limit) process.exitCode=1;
} catch {
  // Playwright call logs may include filled credentials; never propagate them.
  throw new Error("DEMO_CHECK_FAILED: no se completó el control alojado; no publiques trazas ni credenciales.");
} finally { await browser.close(); }
