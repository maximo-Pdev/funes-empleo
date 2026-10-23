import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("base pública en español sin barreras automáticas detectadas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("El empleo en Funes, con acompañamiento municipal.");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ir al contenido principal" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation", { name: "Accesos principales" }).getByRole("link", { name: "Ofertas", exact: true })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
