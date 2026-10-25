// Read-only proof of navbar return delay and interaction retention.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const checks = [];
try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const motion of ["no-preference", "reduce"]) {
    await page.emulateMedia({ reducedMotion: motion });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000", { waitUntil: "networkidle" });
    const header = page.locator("header[data-home]");
    assert.equal(await header.getAttribute("data-visible"), "false");
    await page.mouse.move(700, 800);
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("header[data-home]").dataset.visible === "true");
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(1000);
    assert.equal(await header.getAttribute("aria-hidden"), "false");
    await page.waitForFunction(() => document.querySelector("header[data-home]").dataset.visible === "false", undefined, { timeout: 1800 });
    assert.equal(await header.getAttribute("inert"), "");
    await page.evaluate(() => scrollTo({ top: 200, behavior: "instant" }));
    await page.waitForFunction(() => document.querySelector("header[data-home]").dataset.visible === "true" && getComputedStyle(document.querySelector("header[data-home]")).transform === "matrix(1, 0, 0, 1, 0, 0)");
    await header.hover();
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(2400);
    assert.equal(await header.getAttribute("aria-hidden"), "false");
    await page.mouse.move(700, 800);
    await page.waitForFunction(() => document.querySelector("header[data-home]").dataset.visible === "false");
    await page.setViewportSize({ width: 390, height: 900 });
    await page.waitForFunction(() => document.querySelector("header[data-home]").dataset.visible === "true");
    await page.waitForTimeout(3200);
    assert.equal(await header.getAttribute("aria-hidden"), "false");
    checks.push({ motion, initialHidden: true, returnDelay: "PASS", hoverRetention: "PASS", mobileVisible: true });
  }
  console.log(JSON.stringify({ status: "PASS", checks }));
} finally {
  await browser.close();
}
