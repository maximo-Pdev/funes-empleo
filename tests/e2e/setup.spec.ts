import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("base pública en español sin barreras automáticas detectadas", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "es-AR");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Portal Municipal de Empleo");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Ir al contenido principal" })).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
