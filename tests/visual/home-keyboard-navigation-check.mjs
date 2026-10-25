// Read-only proof: keyboard navigation never submits authentication forms.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
const checks = [];

try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    assert.equal(await page.locator('body > a[href="#contenido"]').count(), 0, "The removed global link is absent from the DOM");
    assert.equal(await page.getByRole("main").count(), 1, "The main landmark is preserved");
    await page.keyboard.press("Tab");
    const firstLink = width < 768
      ? page.getByRole("link", { name: "Ir al sitio de la Municipalidad de Funes" })
      : page.getByRole("navigation", { name: "Accesos principales" }).getByRole("link", { name: "Ofertas", exact: true });
    assert.equal(await firstLink.evaluate(el => el === document.activeElement), true, "Tab starts on existing visible navigation");
    for (const mode of ["login", "candidate", "company"]) {
      if (mode !== "login") await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
      if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      await page.waitForTimeout(600);
      await page.evaluate(() => scrollTo({ top: innerHeight, behavior: "instant" }));
      await page.waitForFunction(() => document.querySelector("header").getAttribute("aria-hidden") === "false");
      const navigation = page.getByRole("navigation", { name: "Navegación principal" });
      await navigation.getByRole("link", { name: "Ofertas", exact: true }).focus();
      await page.keyboard.press("Shift+Tab");
      assert.equal(await page.evaluate(() => document.activeElement.textContent), "Inicio");
      await page.keyboard.press("Enter");
      await page.waitForFunction(() => scrollY === 0);
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(await page.evaluate(() => document.activeElement.id), "contenido", "Home navigation leaves keyboard focus on the main landmark");
      checks.push({ width, mode, keyboardHome: "PASS" });
    }
  }
  await page.goto(`${baseURL}/recover`, { waitUntil: "networkidle" });
  assert.equal(await page.locator('body > a[href="#contenido"]').count(), 0, "Standalone routes also omit the removed global link");
  assert.equal(await page.locator("main#contenido").count(), 1, "Standalone routes keep a single main landmark");
  await page.keyboard.press("Tab");
  assert.equal(await page.locator('header a[href="/"]').first().evaluate(el => el === document.activeElement), true, "Standalone navigation remains keyboard accessible");
  console.log(JSON.stringify({ status: "PASS", checks, globalSkipLink: "removed", mainLandmark: "preserved" }));
} finally {
  await browser.close();
}
