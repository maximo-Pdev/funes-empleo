import { expect, test } from "@playwright/test";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.beforeEach(() => assertLocalTargets());

test("inicio muestra diez ofertas recientes con vecinos y navegación circular desktop/móvil", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const expected = JSON.parse(runLocalMaintenanceSql(`select jsonb_agg(title order by published_at desc,id desc)
    from (select title,published_at,id from private.public_offer_rows order by published_at desc,id desc limit 10) recent`)) as string[];
  expect(expected.length).toBeGreaterThan(2);
  await page.goto("/");
  const cards = page.locator('[data-slot="coverflow-card"]');
  await expect(cards).toHaveCount(expected.length);
  await expect(cards.first().getByRole("heading")).toHaveText(expected[0]!);
  const offset = (index: number) => cards.nth(index).evaluate(element => (element as HTMLElement).style.getPropertyValue("--r"));
  expect(await offset(expected.length - 1)).toBe("1");
  expect(await offset(expected.length - 2)).toBe("2");
  const carousel = page.getByRole("region", { name: "Carrusel de ofertas recientes", exact: true });
  await carousel.hover();
  await carousel.screenshot({ path: "test-results/carousel-circular-first.png" });
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await expect.poll(() => offset(expected.length - 1)).toBe("0");
  expect(await offset(0)).toBe("-1");
  expect(await offset(1)).toBe("-2");
  await carousel.screenshot({ path: "test-results/carousel-circular-last.png" });
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect.poll(() => offset(0)).toBe("0");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(cards).toHaveCount(0);
  await expect(page.locator('[data-slot="carousel-item"]').first().getByRole("heading")).toHaveText(expected[0]!);
  const previous = carousel.getByRole("button", { name: "Anterior", exact: true });
  await expect(previous).toBeEnabled();
  await previous.click();
  await carousel.locator('[data-slot="carousel-content"]').scrollIntoViewIfNeeded();
  await expect(carousel.locator('[data-slot="carousel-item"]').last()).toBeInViewport({ ratio: 0.9 });
  await carousel.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(carousel.locator('[data-slot="carousel-item"]').first()).toBeInViewport({ ratio: 0.9 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [1440, 390]) {
  test(`carrusel automático ${width}px: tres segundos, solo flechas y retorno automático tras hover`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const carousel = page.getByRole("region", { name: "Carrusel de ofertas recientes", exact: true });
    await expect(carousel.getByRole("button")).toHaveCount(2);
    await expect(carousel.getByRole("button", { name: /pausar|reanudar/i })).toHaveCount(0);
    const position = () => width > 767
      ? carousel.locator('[data-slot="coverflow-card"]').first().evaluate(element => (element as HTMLElement).style.getPropertyValue("--r"))
      : carousel.locator('[data-slot="carousel-content"] > div').evaluate(element => (element as HTMLElement).style.transform);
    await expect(carousel.getByRole("button", { name: "Siguiente", exact: true })).toBeEnabled();
    const initial = await position();
    await page.mouse.move(0, 0);
    await expect.poll(position, { timeout: 5000 }).not.toBe(initial);
    await carousel.hover();
    await page.waitForTimeout(1000);
    const hovered = await position();
    await page.waitForTimeout(3200);
    expect(await position()).toBe(hovered);
    await page.mouse.move(0, 0);
    await expect.poll(position, { timeout: 5000 }).not.toBe(hovered);
    await carousel.screenshot({ path: `test-results/carousel-three-seconds-${width}.png` });
  });
}

test("carrusel respeta reduced-motion sin botón adicional", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const carousel = page.getByRole("region", { name: "Carrusel de ofertas recientes", exact: true });
  await expect(carousel.getByRole("button")).toHaveCount(2);
  const first = carousel.locator('[data-slot="coverflow-card"]').first();
  await page.waitForTimeout(3200);
  expect(await first.evaluate(element => (element as HTMLElement).style.getPropertyValue("--r"))).toBe("0");
  await carousel.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect.poll(() => first.evaluate(element => (element as HTMLElement).style.getPropertyValue("--r"))).toBe("1");
});
for (const path of ["/admin/candidates", "/admin/atencion-presencial"]) {
  test(`filtros GET de ${path}: categorías múltiples, localidad opcional e historial de navegación`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await page.goto(`${path}?page=2`);
    const form = page.getByRole("search");
    for (const width of [360, 1366]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} sin filtros a ${width}px`).toBe(true);
    }
    await expect(form).toHaveAttribute("method", "get");
    await expect(form).toHaveAttribute("action", path);
    await form.getByLabel("Búsqueda por palabra", { exact: true }).fill("Persona ficticia");
    await form.getByLabel("Categorías", { exact: true }).click();
    await page.getByRole("option", { name: "Categoría ficticia A", exact: true }).click();
    await page.getByRole("option", { name: "Categoría ficticia B", exact: true }).click();
    await page.keyboard.press("Escape");
    await form.getByRole("button", { name: "Buscar candidatos", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}\\?`));
    const params = new URL(page.url()).searchParams;
    expect(params.getAll("categoryId")).toHaveLength(2);
    expect(params.getAll("categoryId").every(value => /^rub-[a-f0-9]{24}$/.test(value))).toBe(true);
    expect(params.has("page")).toBe(false);
    expect(params.get("locality")).toBe("");
    await expect(form.getByLabel("Categorías", { exact: true })).toContainText("2 seleccionadas");
    for (const width of [360, 1366]) {
      await page.setViewportSize({ width, height: 800 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${path} filtrado a ${width}px`).toBe(true);
    }
    await page.reload();
    await expect(form.getByLabel("Búsqueda por palabra", { exact: true })).toHaveValue("Persona ficticia");
    await expect(form.getByLabel("Categorías", { exact: true })).toContainText("2 seleccionadas");
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${path}\\?page=2$`));
    await page.goForward();
    await expect(form.getByLabel("Categorías", { exact: true })).toContainText("2 seleccionadas");
  });
}
