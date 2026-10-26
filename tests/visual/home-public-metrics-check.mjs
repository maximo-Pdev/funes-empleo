// Real rendered Home proof. GET/HEAD only; no fixtures or account submissions.
import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
import { join } from "node:path";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3012";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(baseURL).hostname));
const expected = process.env.METRICS_EXPECTED ? JSON.parse(process.env.METRICS_EXPECTED) : null;
const browser = await chromium.launch();
const checks = [];
const mutations = [];
try {
  const page = await browser.newPage();
  await page.route("**/*", route => {
    if (["GET", "HEAD"].includes(route.request().method())) return route.continue();
    mutations.push(route.request().method());
    return route.abort();
  });
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const section = page.getByRole("region", { name: "El portal en números" });
    await section.scrollIntoViewIfNeeded();
    const state = await section.getAttribute("data-metrics-status");
    assert.equal(await section.locator("dt").count(), 3);
    const values = await section.locator("dd").allTextContents();
    if (expected) {
      assert.equal(state, "ready", "The configured backend must supply actual counts");
      assert.deepEqual(values, [expected.candidates, expected.companies, expected.offers].map(value => new Intl.NumberFormat("es-AR").format(value)));
    } else if (state === "ready") {
      assert.ok(values.every(value => /^\d+(\.\d{3})*$/.test(value)));
    } else {
      assert.deepEqual(values, ["—", "—", "—"]);
      assert.ok(await section.getByRole("status").textContent());
    }
    const boxes = await section.locator("dl > div").evaluateAll(elements => elements.map(element => {
      const box = element.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, right: box.right };
    }));
    assert.equal(boxes.length, 3);
    if (width >= 768) assert.ok(boxes.every(box => Math.abs(box.y - boxes[0].y) < 1), "Three desktop columns");
    else assert.ok(boxes.every(box => Math.abs(box.x - boxes[0].x) < 1) && boxes[1].y > boxes[0].y && boxes[2].y > boxes[1].y, "Stacked mobile metrics");
    assert.ok(boxes.every(box => box.x >= 0 && box.right <= width + 1));
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "No horizontal overflow");
    assert.equal(await page.getByRole("heading", { name: "Cada perfil entra por el camino correcto" }).count(), 0);
    assert.equal(await page.getByRole("link", { name: "Registrarme como postulante" }).count(), 1);
    const previewOffers = await page.locator('#ofertas-disponibles a[href^="/ofertas/"]').count();
    if (process.env.MIN_PREVIEW_OFFERS) assert.ok(previewOffers >= Number(process.env.MIN_PREVIEW_OFFERS));
    if (process.env.METRICS_SCREENSHOT_DIR) await section.screenshot({ path: join(process.env.METRICS_SCREENSHOT_DIR, `home-public-metrics-${width}.png`) });
    checks.push({ width, state, values, previewOffers, status: "PASS" });
  }
  assert.deepEqual(mutations, []);
  console.log(JSON.stringify({ status: "PASS", checks, mutations }));
} finally {
  await browser.close();
}
