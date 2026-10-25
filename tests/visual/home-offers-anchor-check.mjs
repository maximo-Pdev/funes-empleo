// Read-only full-viewport anchor proof; never submits forms.
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
    for (const motion of ["no-preference", "reduce"]) {
      await page.emulateMedia({ reducedMotion: motion });
      for (const mode of ["login", "candidate", "company"]) {
        await page.goto(baseURL, { waitUntil: "networkidle" });
        if (mode !== "login") await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
        if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
        await page.waitForTimeout(650);
        const action = page.getByRole("link", { name: "Ver ofertas disponibles" });
        if (motion === "reduce") {
          await action.focus();
          await page.keyboard.press("Enter");
        } else await action.click();
        await page.waitForFunction(() => {
          const target = document.getElementById("ofertas-disponibles");
          return location.hash === "#ofertas-disponibles" && Math.abs(target.getBoundingClientRect().top - parseFloat(getComputedStyle(target).scrollMarginTop)) < 1;
        });
        const geometry = await page.locator("#ofertas-disponibles").evaluate(el => ({
          top: el.getBoundingClientRect().top,
          height: el.getBoundingClientRect().height,
          viewport: innerHeight,
          heroBottom: el.previousElementSibling.getBoundingClientRect().bottom,
          focus: document.activeElement.id,
        }));
        assert.ok(Math.abs(geometry.top) < 1, `Next screen must start at viewport top: ${JSON.stringify(geometry)}`);
        assert.ok(geometry.heroBottom <= 1, "No hero area remains visible above the next screen");
        assert.ok(geometry.height >= geometry.viewport);
        assert.equal(geometry.focus, "ofertas-disponibles");
        checks.push({ width, motion, mode, top: geometry.top, status: "PASS" });
      }
    }
  }
  console.log(JSON.stringify({ status: "PASS", checks }));
} finally {
  await browser.close();
}
