// Read-only UI proof: all submissions remain client-invalid; non-GET traffic is blocked.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
const checks = [];
let blockedWrites = 0;
try {
  const page = await browser.newPage();
  await page.route("**/*", route => {
    if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
    blockedWrites++;
    return route.abort();
  });
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const header = page.locator("header");
    assert.equal(await header.getAttribute("aria-hidden"), width >= 768 ? "true" : "false");
    const identity = header.locator('a[aria-label="Ir al sitio de la Municipalidad de Funes"] > span');
    assert.equal(await identity.evaluate(el => getComputedStyle(el).display), width < 768 ? "none" : "flex");
    assert.equal(await page.locator("main img").count(), 0);
    assert.equal(await header.locator('a[href="https://funes.gob.ar/"]').count(), 1);
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForTimeout(400);
    assert.notEqual(await header.evaluate(el => getComputedStyle(el).boxShadow), "none");
    const shortcut = header.getByRole("link", { name: "Ingresar", exact: true });
    assert.equal(await shortcut.evaluate(el => getComputedStyle(el).backgroundColor), "rgb(7, 74, 31)");
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt === 0) await shortcut.click();
      else {
        await shortcut.focus();
        await page.keyboard.press("Enter");
      }
      await page.waitForFunction(() => document.activeElement.id === "contenido" && window.scrollY === 0, null, { timeout: 5000 }).catch(async error => {
        console.error(JSON.stringify({ width, attempt, state: await page.evaluate(() => ({ scrollY, active: document.activeElement?.outerHTML.slice(0, 160), hash: location.hash, mainTop: document.querySelector("main").getBoundingClientRect().top, shortcut: document.querySelector("header a:last-child")?.getAttribute("href") })) }));
        throw error;
      });
      await page.waitForTimeout(400);
      await page.evaluate(() => scrollTo({ top: scrollY + 100, behavior: "instant" }));
    }
    for (const mode of ["login", "candidate", "company"]) {
      if (mode === "candidate") await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
      if (mode === "company") await page.getByRole("radio", { name: "Empresa", exact: true }).check();
      const form = page.locator("#acceso form");
      await form.locator('button[type="submit"]').click();
      await page.waitForTimeout(650);
      const count = mode === "login" ? 2 : mode === "candidate" ? 5 : 8;
      assert.equal(await page.getByText("Completá este campo.", { exact: true }).count(), 0);
      assert.equal(await form.locator('[aria-invalid="true"]').count(), count);
      assert.equal(await form.getByText(`Revisá los ${count} campos indicados.`, { exact: true }).count(), 1);
      const fields = await form.locator('[aria-invalid="true"]').evaluateAll(elements => elements.map(el => ({
        color: getComputedStyle(el).borderBottomColor,
        validDescriptions: (el.getAttribute("aria-describedby") ?? "").split(/\s+/).filter(Boolean).every(id => document.getElementById(id)),
      })));
      assert.equal(fields.every(field => field.color === "rgb(185, 28, 28)" && field.validDescriptions), true);
      await form.locator('input[name="email"]').fill("invalid-email");
      assert.equal(await form.getByText("Ingresá un correo válido, por ejemplo nombre@correo.com.", { exact: true }).count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      checks.push({ width, mode, missing: count, status: "PASS" });
    }
    if (process.env.HOME_NAVBAR_SHOT) {
      await page.evaluate(mobile => scrollTo({ top: mobile ? 0 : 100, behavior: "instant" }), width < 768);
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${process.env.HOME_NAVBAR_SHOT}-${width}.png` });
    }
  }
  assert.equal(blockedWrites, 0, "Invalid forms must not attempt server writes");
  console.log(JSON.stringify({ status: "PASS", checks, blockedWrites }));
} finally {
  await browser.close();
}
