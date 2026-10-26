// Read-only HTTP and browser proof; no credentials, writes or acceptance reset.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3012";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname));
const retired = ["/login", "/candidato/perfil", "/candidato/ofertas", "/candidato/postulaciones", "/registro/candidato", "/registro/empresa", "/account-suspended", "/recovery-invalid", "/session-expired", "/verification-pending"];
const checks = [];
for (const path of retired) {
  for (const query of ["", "?changed=1", "?cv=denied", "?oferta=oferta-ficticia&page=2"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(`${baseURL}${path}${query}`, { method, redirect: "manual" });
      assert.equal(response.status, 404, `${method} ${path}${query}`);
      assert.equal(response.headers.get("location"), null);
      await response.arrayBuffer();
      checks.push({ method, path: `${path}${query}`, status: response.status });
    }
  }
}
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  await page.goto(baseURL);
  assert.equal(await page.getByLabel("Correo electrónico", { exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Ingresar", exact: true }).count(), 1);
  await page.getByRole("link", { name: "Recuperar acceso", exact: true }).click();
  await page.waitForURL(`${baseURL}/recover`);
  assert.equal(new URL(page.url()).pathname, "/recover");
  await page.getByRole("link", { name: "Iniciar sesión", exact: true }).click();
  await page.waitForURL(`${baseURL}/`);
  assert.equal(new URL(page.url()).pathname, "/");
  for (const path of retired) {
    const response = await page.goto(`${baseURL}${path}`);
    assert.equal(response?.status(), 404);
    assert.equal(new URL(page.url()).pathname, path);
  }
  // Account lifecycle states live inside Home's access card, not on their own screens.
  // In `next dev` the previous tree stays behind a hidden hydration wrapper and content has no
  // layout until the client mounts, so wait for exactly one laid-out landmark before asserting.
  const open = async (path) => {
    await page.goto(`${baseURL}${path}`);
    await page.waitForFunction(() => {
      const mains = [...document.querySelectorAll("main")];
      return mains.length === 1 && mains[0].getBoundingClientRect().height > 0;
    });
  };
  await open("/?acceso=suspendido");
  assert.equal(await page.getByRole("heading", { name: "Acceso suspendido", exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Ingresar", exact: true }).count(), 0);
  assert.equal(await page.locator("form").count(), 0);
  await open("/?acceso=sesion-vencida");
  assert.equal(await page.getByRole("heading", { name: "Volvé a iniciar sesión", exact: true }).count(), 1);
  assert.equal(await page.getByLabel("Correo electrónico", { exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Ingresar", exact: true }).count(), 1);
  await open("/?acceso=recuperacion-invalida");
  assert.equal(await page.getByRole("heading", { name: "Enlace de recuperación inválido o vencido", exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Solicitar enlace", exact: true }).count(), 1);
  assert.equal(await page.getByLabel("Contraseña", { exact: true }).count(), 0);
  assert.equal(await page.getByRole("link", { name: "Volver a iniciar sesión", exact: true }).getAttribute("href"), "/");
  await open("/verification-expired");
  assert.equal(await page.getByRole("heading", { level: 1, name: "Enlace de verificación inválido o vencido", exact: true }).count(), 1);
  assert.equal(await page.getByRole("button", { name: "Reenviar verificación", exact: true }).count(), 1);
  console.log(JSON.stringify({ status: "PASS", checks, homepageLogin: "PASS", recoveryReturn: "PASS", accessStates: ["suspendido", "sesion-vencida", "recuperacion-invalida"], browser404: retired }));
} finally {
  await browser.close();
}
