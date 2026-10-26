// Read-only navigation proof: never submit registration forms or reset accounts.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3012";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname));
const browser = await chromium.launch();
const checks = [];
const mutations = [];
const roles = [
  { value: "candidate", query: "candidato", name: "Postulante", label: "Registrarme como postulante", field: "Nombre y apellido" },
  { value: "company", query: "empresa", name: "Empresa", label: "Registrar empresa", field: "Nombre de la empresa" },
];
try {
  for (const width of [1440, 768, 390]) {
    for (const reducedMotion of ["no-preference", "reduce"]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
      await page.route("**/*", route => {
        if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
        mutations.push(route.request().method());
        return route.abort();
      });
      for (const role of roles) {
        await page.goto(baseURL, { waitUntil: "networkidle" });
        const originalURL = page.url();
        await page.getByRole("button", { name: "Registrarse", exact: true }).click();
        await page.getByRole("radio", { name: role.value === "candidate" ? "Empresa" : "Postulante", exact: true }).check();
        const closing = page.getByRole("region", { name: "¿Listo para dar el siguiente paso?" });
        const shortcut = closing.getByRole("link", { name: role.label, exact: true });
        for (const method of ["click", "keyboard"]) {
          await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
          if (method === "click") await shortcut.click();
          else {
            await shortcut.focus();
            await shortcut.press("Enter");
          }
          await page.waitForFunction(value => window.scrollY < 1 && document.activeElement?.id === "acceso" && document.querySelector(`input[name="accountType"][value="${value}"]`)?.checked, role.value);
          assert.equal(page.url(), originalURL, "Same-page shortcut does not navigate or alter the URL");
          assert.equal(await page.getByRole("radio", { name: role.name, exact: true }).isChecked(), true);
          if (method === "click") await page.getByLabel(role.field, { exact: true }).fill("Fixture local");
          else assert.equal(await page.getByLabel(role.field, { exact: true }).inputValue(), "Fixture local", "Repeated activation preserves the current form");
          checks.push({ width, reducedMotion, role: role.value, method, status: "PASS" });
        }
        await page.goto(`${baseURL}/?registro=${role.query}`, { waitUntil: "networkidle" });
        assert.equal(await page.getByRole("radio", { name: role.name, exact: true }).isChecked(), true);
        await page.waitForFunction(() => window.scrollY < 1 && document.activeElement?.id === "acceso");
        checks.push({ width, reducedMotion, role: role.value, method: "canonical-entry", status: "PASS" });
      }
      await page.goto(baseURL, { waitUntil: "networkidle" });
      const metrics = page.getByRole("region", { name: "El portal en números" });
      assert.equal(await metrics.locator("dt").count(), 3);
      assert.equal(await metrics.getByRole("link").count(), 0, "The replaced role guide does not retain duplicate shortcuts");
      await page.close();
    }
  }
  for (const path of ["/registro/candidato", "/registro/empresa"]) {
    for (const method of ["GET", "HEAD"]) {
      const response = await fetch(`${baseURL}${path}`, { method, redirect: "manual" });
      assert.equal(response.status, 404);
      assert.equal(response.headers.get("location"), null);
      await response.arrayBuffer();
    }
  }
  assert.deepEqual(mutations, []);
  console.log(JSON.stringify({ status: "PASS", checks, metricsReplacement: "PASS", retiredRoutes: "PASS", mutations }));
} finally {
  await browser.close();
}
