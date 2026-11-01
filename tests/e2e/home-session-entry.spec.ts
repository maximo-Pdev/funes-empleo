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
  test(`${role}: Home empieza en ofertas sin hero y conserva acceso al panel`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill(`${role}1@example.invalid`);
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
    for (const [width, height] of [[1920, 1080], [1366, 768], [390, 844], [320, 800]] as const) {
      await page.setViewportSize({ width, height });
      const response = await page.goto("/?registro=empresa&acceso=suspendido");
      expect(response?.headers()["cache-control"]).toContain("no-store");
      const heading = page.getByRole("heading", { level: 1, name: "Ofertas disponibles" });
      const navbar = page.getByRole("banner");
      await expect(heading).toBeVisible(); await expect(navbar).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("region", { name: "Acceso al portal" })).toHaveCount(0);
      await expect(page.getByText("Ya tenés la sesión iniciada", { exact: true })).toHaveCount(0);
      expect(await page.locator("main").evaluate(element => element.firstElementChild?.id)).toBe("ofertas-disponibles");
      const banner = await navbar.boundingBox(), title = await heading.boundingBox();
      expect(title!.y).toBeGreaterThanOrEqual(banner!.y + banner!.height);
      expect(title!.y + title!.height).toBeLessThan(height);
      expect(await page.evaluate(() => window.scrollY)).toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(navbar.getByRole("link", { name: "Mi cuenta", exact: true })).toHaveAttribute("href", destination);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id)).toEqual([]);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1, name: "Ofertas disponibles" })).toBeVisible();
    await page.getByRole("link", { name: "Mi cuenta", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${destination}$`));
  });
}
