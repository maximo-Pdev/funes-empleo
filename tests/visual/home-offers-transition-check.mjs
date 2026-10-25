// Read-only position proof, including intermediate frames and reduced motion.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch();
const checks = [];
async function sample(page, role) {
  return page.evaluate(value => new Promise(resolve => {
    const action = document.querySelector('a[href="#ofertas-disponibles"]');
    const center = () => { const r = action.getBoundingClientRect(); return r.x + r.width / 2; };
    const frames = [center()];
    const end = performance.now() + 500;
    document.querySelector(`input[name="accountType"][value="${value}"]`).click();
    function tick() {
      frames.push(center());
      if (performance.now() < end) requestAnimationFrame(tick);
      else resolve(frames);
    }
    requestAnimationFrame(tick);
  }), role);
}
try {
  const page = await browser.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Registrarse", exact: true }).first().click();
    await page.waitForTimeout(650);
    const toCompany = await sample(page, "company");
    const toCandidate = await sample(page, "candidate");
    if (width >= 768) {
      assert.ok(Math.abs(toCompany[0] - width / 2) < 2);
      assert.ok(Math.abs(toCompany.at(-1) - width / 4) < 2);
      assert.ok(Math.abs(toCandidate.at(-1) - width / 2) < 2);
      for (const frames of [toCompany, toCandidate]) {
        assert.ok(frames.some(x => x > width / 4 + 2 && x < width / 2 - 2), "Offers shortcut must travel through intermediate positions in both directions");
      }
    } else {
      assert.ok([...toCompany, ...toCandidate].every(x => Math.abs(x - width / 2) < 2), "Mobile shortcut stays centered in document flow");
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    const reduced = await sample(page, "company");
    const action = page.getByRole("link", { name: "Ver ofertas disponibles" });
    assert.equal(await action.evaluate(el => getComputedStyle(el).transitionDuration), "0s");
    assert.ok(reduced.slice(1).every(x => Math.abs(x - (width >= 768 ? width / 4 : width / 2)) < 2));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    checks.push({ width, forward: "PASS", reverse: "PASS", reducedMotion: "PASS" });
  }
  console.log(JSON.stringify({ status: "PASS", checks }));
} finally {
  await browser.close();
}
