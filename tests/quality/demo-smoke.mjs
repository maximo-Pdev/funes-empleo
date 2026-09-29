import { execFileSync } from "node:child_process";
import { chromium, expect } from "@playwright/test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const base = "https://funes-empleo-demo.vercel.app";
assert.equal(process.argv[2], "--confirm-fictitious-demo");
// Vercel's CLI owns the authentication and bypass credential. Only the resulting
// scoped browser cookie is held in memory; never write headers/storageState/trace.
const command = "npm.cmd exec --yes --package=vercel@50.35.0 -- vercel curl '/login?x-vercel-set-bypass-cookie=true' --deployment https://funes-empleo-demo.vercel.app --scope pantherium-8487s-projects -- --silent --dump-header - --output NUL";
assert.equal(process.platform, "win32", "Este smoke usa la sesión local de Vercel en Windows.");
let headers;
try {
  headers = execFileSync("powershell.exe", ["-NoProfile", "-Command", command], { encoding: "utf8", timeout: 60000, stdio: ["ignore","pipe","pipe"] });
} catch { throw new Error("VERCEL_TEST_ACCESS_FAILED: revisar la sesión CLI sin publicar encabezados"); }
const cookies = [...headers.matchAll(/^set-cookie:\s*([^=;\s]+)=([^;\r\n]*)/gim)]
  .map(m => ({ name: m[1], value: m[2], url: base, secure: true, httpOnly: true }));
assert(cookies.length > 0, "Vercel no proporcionó acceso de prueba; no desactivar la protección.");
const id = (kind,n) => { const h=createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex"); return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`; };
const browser = await chromium.launch();
try {
  for (const role of ["anonymous","candidate","company","admin"]) {
    const context = await browser.newContext({ baseURL: base });
    await context.addCookies(cookies);
    const page = await context.newPage();
    const errors=[];
    page.on("pageerror", () => errors.push("browser error"));
    await page.goto("/ofertas");
    await expect(page.locator("body")).toContainText(/Oferta ficticia/, { timeout:30000 });
    if (role !== "anonymous") {
      await page.goto("/login");
      await page.getByLabel("Correo electrónico").fill(`${role}1@example.invalid`);
      await page.getByLabel("Contraseña", { exact:true }).fill("Fictitious-Local-Only-2026!");
      await page.getByRole("button",{ name:"Iniciar sesión",exact:true }).click();
      await page.waitForURL("**/account");
      const path = role === "admin" ? "/admin/candidates" : role === "candidate" ? "/candidato/perfil" : "/empresa/perfil";
      await page.goto(path);
      await expect(page.getByRole("heading", { level:1 })).toBeVisible();
      assert.equal(new URL(page.url()).pathname,path);
      assert.doesNotMatch(await page.locator("body").innerText(), /Application error|Ocurrió un problema inesperado/);
      const cv = await context.request.get(`/api/cv/${id("cv",1)}`);
      assert.equal(cv.status(),200,`CV autorizado de ${role}`);
      const manifest = JSON.parse(await readFile("tests/fixtures/acceptance-manifest.json","utf8"));
      assert.equal(createHash("sha256").update(await cv.body()).digest("hex"),manifest.cvSha256);
    } else {
      assert.equal((await context.request.get(`/api/cv/${id("cv",1)}`)).status(),401);
    }
    if (role !== "admin") {
      await page.goto("/admin/candidates");
      await page.waitForURL(/\/(account|session-expired|login)$/);
    }
    assert.equal(errors.length,0,`Errores de navegador ${role}`);
    console.log(`PASS demo: ${role}, navegación, aislamiento y CV.`);
    await context.close();
  }
} finally { await browser.close(); }
