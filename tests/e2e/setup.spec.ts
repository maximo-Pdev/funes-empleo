import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("base pública en español sin barreras automáticas detectadas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("El empleo en Funes, con acompañamiento municipal.");
  await expect(page.getByRole("link", { name: "Ir al contenido principal", includeHidden: true })).toHaveCount(0);
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("main")).toHaveAttribute("id", "contenido");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Accesos principales" }).getByRole("link", { name: "Ofertas", exact: true })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const path of ["/login", "/registro/candidato", "/registro/empresa", "/recover", "/verification-pending"]) {
  test(`navegación existente sin enlace global en ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("link", { name: "Ir al contenido principal", includeHidden: true })).toHaveCount(0);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveAttribute("id", "contenido");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    await expect(focused).toHaveAttribute("href", "/");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}
