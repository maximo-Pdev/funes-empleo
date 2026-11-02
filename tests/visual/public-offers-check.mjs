// Read-only catalog check. Never resets fixtures or submits a mutation.
import assert from "node:assert/strict";
import path from "node:path";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const baseURL = process.env.VISUAL_BASE_URL ?? "http://127.0.0.1:3000";
const target = new URL(baseURL);
assert.ok(["127.0.0.1", "localhost"].includes(target.hostname), "Local target required");
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
  for (const width of [1366, 360]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${baseURL}/ofertas`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { name: "Ofertas laborales vigentes", exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator("main h1").count(), 1);
    assert.equal(await page.getByRole("complementary").count(), 0);
    assert.equal(await page.getByRole("navigation", { name: "Accesos principales", exact: true }).count(), 0);
    assert.equal(await page.getByText("Con acompañamiento municipal", { exact: true }).count(), 0);
    assert.equal(await page.getByText("¿Necesitás ayuda con tu perfil?", { exact: true }).count(), 0);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "No horizontal overflow");
    const pagination = page.getByRole("navigation", { name: "Páginas de ofertas", exact: true });
    let pageNumbers = 0;
    if (await pagination.count()) {
      const numbered = pagination.getByRole("link", { name: /^Página \d+$/ });
      pageNumbers = await numbered.count();
      const totalText = await page.locator("#listado-title").textContent();
      const total = Number(totalText.match(/\d+/)?.[0]);
      assert.equal(pageNumbers, Math.ceil(total / 10), "Every page has a numeric link");
      assert.equal(await pagination.getByRole("link", { name: "Página 1", exact: true }).getAttribute("aria-current"), "page");
      const heights = await numbered.evaluateAll(links => links.map(link => link.getBoundingClientRect().height));
      assert.ok(heights.every(height => height >= 44), "44px numeric targets");
      const second = pagination.getByRole("link", { name: "Página 2", exact: true });
      if (await second.count()) {
        await second.click();
        await page.waitForURL(url => url.searchParams.get("page") === "2");
        await page.getByRole("link", { name: "Página 2", exact: true }).waitFor();
        assert.equal(await page.getByRole("link", { name: "Página 2", exact: true }).getAttribute("aria-current"), "page");
      }
    }
    const categories = page.locator('main [aria-label="Categorías laborales"]');
    for (const group of await categories.all()) {
      for (const badge of await group.locator('[data-slot="badge"]').all()) {
        if ((await badge.textContent())?.trim() !== "Sin categorías") {
          assert.equal(await badge.locator('svg[aria-hidden="true"]').count(), 1, "Category retains a decorative icon");
        }
      }
    }
    assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations, []);
    if (process.env.VISUAL_SCREENSHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.VISUAL_SCREENSHOT_DIR, `ofertas-${width}.png`), fullPage: true });
    }
    results.push({ width, pageNumbers, categoryGroups: await categories.count(), overflow: false, axe: "pass" });
    const detailHref = await page.locator('main article h3 a[href^="/ofertas/"]').first().getAttribute("href");
    assert.ok(detailHref, "An existing public offer is required for detail proof");
    await page.goto(new URL(detailHref, baseURL).href, { waitUntil: "networkidle" });
    const navbar = page.getByRole("navigation", { name: "Navegación principal", exact: true });
    assert.equal(await navbar.getByRole("link", { name: "Inicio", exact: true }).getAttribute("href"), "/");
    assert.equal(await navbar.getByRole("link", { name: "Ofertas", exact: true }).getAttribute("aria-current"), "page");
    assert.equal(await page.locator('img[src="/brand/logo-funes-gris.svg"]').count(), 0);
    assert.equal(await page.getByRole("complementary").count(), 0);
    assert.equal(await page.getByText("Tu próxima oportunidad", { exact: true }).count(), 0);
    assert.equal(await page.getByText("Con acompañamiento municipal", { exact: true }).count(), 0);
    const canvas = page.locator('[data-slot="public-offer-canvas"]');
    const geometry = await canvas.evaluate(element => {
      const box = element.getBoundingClientRect();
      const main = element.closest("main");
      const application = [...element.querySelectorAll("a")].find(link => link.textContent.includes("Postularme con mi cuenta"));
      const applicationBox = application.getBoundingClientRect();
      const information = [...element.querySelectorAll("section")].filter(section => section.querySelector("h2"));
      return { width: box.width, x: box.x, right: innerWidth - box.right, top: box.top,
        background: getComputedStyle(element).backgroundColor, exterior: getComputedStyle(main).backgroundColor,
        applicationAfterInformation: information.every(section => section.getBoundingClientRect().bottom <= applicationBox.top),
        overflow: document.documentElement.scrollWidth > innerWidth };
    });
    assert.ok(geometry.width <= 1280 && geometry.x >= 16 && Math.abs(geometry.x - geometry.right) < 2);
    assert.ok(geometry.top >= 88 && geometry.applicationAfterInformation && !geometry.overflow);
    assert.equal(geometry.background, "rgb(255, 255, 255)");
    assert.equal(geometry.exterior, "rgb(7, 74, 31)");
    assert.equal(await page.locator("main h1").count(), 1);
    const breadcrumb = page.getByRole("navigation", { name: "Ruta de navegación", exact: true });
    assert.equal(await breadcrumb.locator('[aria-current="page"]').textContent(), await page.locator("h1").textContent());
    assert.deepEqual((await new AxeBuilder({ page }).analyze()).violations, []);
    if (process.env.VISUAL_SCREENSHOT_DIR) {
      await page.screenshot({ path: path.join(process.env.VISUAL_SCREENSHOT_DIR, `oferta-detalle-${width}.png`), fullPage: true });
    }
    await breadcrumb.getByRole("link", { name: "Ofertas", exact: true }).click();
    await page.waitForURL(url => url.pathname === "/ofertas");
    results.push({ width, detail: "pass", breadcrumb: "pass", applicationAfterInformation: true, axe: "pass", geometry });
  }
  console.log(JSON.stringify({ results }, null, 2));
} finally {
  await browser.close();
}
