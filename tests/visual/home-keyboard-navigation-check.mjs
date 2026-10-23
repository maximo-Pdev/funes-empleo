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
    const skip = page.locator('body > a[href="#contenido"]');
    await page.keyboard.press("Tab");
    assert.equal(await skip.evaluate(el => el === document.activeElement), true, "Homepage exposes the global skip link first");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.activeElement?.id === "contenido");
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
  await page.goto(`${baseURL}/login`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  assert.equal(await page.locator('body > a[href="#contenido"]').evaluate(el => el === document.activeElement), true, "Other routes preserve their existing keyboard skip link");
  console.log(JSON.stringify({ status: "PASS", checks, standaloneSkipLink: "preserved" }));
} finally {
  await browser.close();
}
