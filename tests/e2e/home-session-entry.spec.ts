import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

test("visitante conserva la presentación y el acceso inicial", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "El empleo en Funes, con acompañamiento municipal." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Ofertas disponibles" })).toHaveCount(1);
});

for (const [role, destination] of [["candidate", "/dashboard"], ["company", "/empresa"], ["admin", "/admin"]] as const) {
  test(`${role}: Home conserva el hero y adapta la tarjeta al panel`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill(`${role}1@example.invalid`);
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    for (const [width, height] of [[1920, 1080], [1366, 768], [390, 844], [320, 800]] as const) {
      await page.setViewportSize({ width, height });
      const response = await page.goto("/?registro=empresa&acceso=suspendido");
      expect(response?.headers()["cache-control"]).toContain("no-store");
      const heading = page.getByRole("heading", { level: 1, name: "El empleo en Funes, con acompañamiento municipal." });
      const navbar = page.getByRole("banner", { includeHidden: true });
      const access = page.getByRole("region", { name: "Acceso al portal" });
      await expect(heading).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(access).toContainText("Tu sesión está activa. Continuá desde tu panel.");
      await expect(access.getByRole("heading", { name: "Continuá en el portal" })).toBeVisible();
      await expect(access.getByRole("group", { name: "Opciones de acceso" })).toHaveCount(0);
      await expect(access.locator('input:not([type="hidden"]), select, textarea')).toHaveCount(0);
      await expect(access.locator("form")).toHaveCount(1);
      await expect(access.getByRole("button", { name: "Cerrar sesión", exact: true })).toHaveCount(1);
      await expect(access.getByRole("link", { name: "Ver ofertas", exact: true })).toHaveAttribute("href", "/ofertas");
      await expect(page.locator("canvas[data-ribbons]")).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 2, name: "Ofertas disponibles" })).toHaveCount(1);
      await expect(page.getByText("Acceso suspendido", { exact: true })).toHaveCount(0);
      await expect(page.getByText("Ya tenés la sesión iniciada", { exact: true })).toHaveCount(0);
      expect(await page.locator("main").evaluate(element => element.firstElementChild?.id)).not.toBe("ofertas-disponibles");
      const title = await heading.boundingBox();
      expect(title!.y).toBeGreaterThanOrEqual(width < 768 ? 64 : 0);
      expect(title!.y + title!.height).toBeLessThan(height);
      if (width >= 768) {
        await expect(navbar).toHaveAttribute("aria-hidden", "true");
        await expect(navbar).toHaveAttribute("inert", "");
        const card = await access.boundingBox();
        expect(card!.y).toBeGreaterThanOrEqual(0);
        expect(card!.y + card!.height).toBeLessThanOrEqual(height);
      } else {
        await expect(navbar).toHaveAttribute("aria-hidden", "false");
      }
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(navbar.getByRole("link", { name: "Mi cuenta", exact: true, includeHidden: true })).toHaveAttribute("href", destination);
      await expect(access.getByRole("navigation", { name: "Accesos principales" }).getByRole("link")).toHaveAttribute("href", destination);
    }
    await expect.poll(() => page.getByRole("heading", { level: 1 }).evaluate(element => getComputedStyle(element).opacity)).toBe("1");
    expect((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id)).toEqual([]);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "El empleo en Funes, con acompañamiento municipal." })).toBeVisible();
    await page.getByRole("navigation", { name: "Accesos principales" }).getByRole("link").click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    await page.goto("/");
    await page.getByRole("region", { name: "Acceso al portal" }).getByRole("button", { name: "Cerrar sesión", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ingresar", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cerrar sesión", exact: true })).toHaveCount(0);
  });
}
