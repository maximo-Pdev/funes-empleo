// Read-only mobile top-navbar proof. No form submissions or fixture resets.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const checks = [];
try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000", { waitUntil: "networkidle" });
    for (const mode of ["login", "candidate", "company"]) {
      if (mode === "candidate") await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
      if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      const header = page.locator("header[data-home]");
      const geometry = await header.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height, viewport: innerHeight, position: getComputedStyle(el).position, inert: el.inert };
      });
      assert.equal(geometry.position, "fixed");
      assert.equal(geometry.top, 0, "Mobile navbar belongs at the top edge");
      assert.equal(geometry.height, 64);
      assert.equal(geometry.inert, false);
      assert.equal(await header.getAttribute("aria-hidden"), "false");
      await header.getByRole("link", { name: "Ingresar", exact: true }).click();
      await page.waitForFunction(() => document.activeElement.id === "contenido" && scrollY < 2);
      await page.locator("#acceso").evaluate(el => el.scrollIntoView({ behavior: "instant" }));
      await page.waitForFunction(() => Math.abs(document.getElementById("acceso").getBoundingClientRect().top - 88) < 2);
      await page.getByRole("link", { name: "Ver ofertas disponibles", exact: true }).click();
      await page.waitForFunction(() => document.activeElement.id === "ofertas-disponibles" && Math.abs(document.getElementById("ofertas-disponibles").getBoundingClientRect().top) < 2);
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
      const clearance = await page.evaluate(() => {
        const main = document.getElementById("contenido");
        return innerHeight - main.lastElementChild.getBoundingClientRect().bottom;
      });
      assert.ok(clearance >= -1, "The last content remains reachable without a bottom overlay");
      await header.getByRole("link", { name: "Inicio", exact: true }).click();
      await page.waitForFunction(() => document.activeElement.id === "contenido" && scrollY < 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      const introTop = await page.locator("h1").evaluate(el => el.parentElement.firstElementChild.getBoundingClientRect().top + scrollY);
      assert.equal(introTop, 88, "Introduction clears the 64px top navbar by 24px");
      if (process.env.TOP_NAVBAR_SHOT && mode === "login") await page.screenshot({ path: `${process.env.TOP_NAVBAR_SHOT}-${width}.png` });
      checks.push({ width, mode, topNavbar: "PASS", anchors: "PASS", finalClearance: clearance });
    }
  }
  await page.setViewportSize({ width: 768, height: 900 });
  await page.mouse.move(400, 700);
  await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
  await page.waitForFunction(() => document.querySelector("header[data-home]").getBoundingClientRect().top === 0);
  checks.push({ width: 768, desktopTopNavbar: "PASS" });
  console.log(JSON.stringify({ status: "PASS", checks }));
} finally { await browser.close(); }
