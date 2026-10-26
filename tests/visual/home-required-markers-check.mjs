// Local read-only proof: incomplete forms must never issue POST requests.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3012";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname));
const browser = await chromium.launch();
const checks = [];
try {
  const page = await browser.newPage();
  const posts = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(request.url()); });
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const mode of ["login", "candidate", "company"]) {
      await page.goto(baseURL, { waitUntil: "networkidle" });
      if (mode !== "login") await page.getByRole("button", { name: "Registrarse", exact: true }).click();
      if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      const form = page.locator("form");
      const markers = form.locator("[data-required-marker]");
      const expected = mode === "login" ? 2 : mode === "candidate" ? 5 : 8;
      assert.equal(await markers.count(), mode === "login" ? 0 : expected);
      if (mode !== "login") assert.ok((await markers.evaluateAll(elements => elements.map(el => getComputedStyle(el).color))).every(color => color === "rgb(134, 141, 152)"));
      const intro = page.getByRole("heading", { level: 1 }).locator("..");
      assert.equal(await intro.locator("a").count(), 0);
      const generated = await form.locator("label").evaluateAll(labels => labels.some(label => getComputedStyle(label, "::after").content.includes("*") || Array.from(label.children).some(child => getComputedStyle(child, "::after").content.includes("*"))));
      assert.equal(generated, false, "No duplicate CSS asterisks");
      await form.locator('button[type="submit"]').click();
      await page.waitForFunction(expected => document.querySelectorAll('form [data-marker-state="missing"]').length === expected, expected);
      assert.ok((await markers.evaluateAll(elements => elements.map(el => getComputedStyle(el).color))).every(color => color === "rgb(185, 28, 28)"));
      await page.getByLabel("Correo electrónico", { exact: true }).fill("invalid-email");
      assert.equal(await form.locator('[data-marker-state="missing"]').count(), expected - 1);
      assert.equal(await page.getByLabel("Correo electrónico", { exact: true }).getAttribute("aria-invalid"), "true", "Nonempty invalid email retains its error, not its missing marker");
      assert.equal(await markers.count(), mode === "login" ? 1 : expected);
      if (mode === "company") assert.equal(await page.getByLabel("Teléfono de contacto", { exact: true }).locator('xpath=ancestor::*[@data-form-field]').locator("[data-required-marker]").count(), 0);
      checks.push({ width, mode, status: "PASS" });
    }
  }
  for (const path of ["/login", "/candidato/perfil", "/candidato/ofertas", "/candidato/postulaciones", "/registro/candidato", "/registro/empresa"]) {
    const response = await page.request.get(`${baseURL}${path}?cv=denied`, { maxRedirects: 0 });
    assert.equal(response.status(), 404);
    assert.equal(response.headers().location, undefined);
  }
  assert.equal(posts.length, 0);
  console.log(JSON.stringify({ status: "PASS", checks, retiredRoutes: "PASS", posts: posts.length }));
} finally {
  await browser.close();
}
