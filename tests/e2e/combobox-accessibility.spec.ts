import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { loginFixture } from "./fixtures/quality";

test.beforeEach(() => assertLocalTargets());

async function checkPopup(page: Page, triggerName: string, popupName: string, listName: string) {
  const trigger = page.getByRole("combobox", { name: triggerName, exact: true });
  await trigger.click();
  const popup = page.locator('[data-slot="combobox-content"]').filter({ has: page.getByRole("listbox", { name: listName, exact: true }) });
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute("aria-label", popupName);
  expect((await new AxeBuilder({ page }).include('[data-slot="combobox-content"]').analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape");
  await expect(popup).not.toBeVisible();
  await expect(trigger).toBeFocused();
}

test("registro empresarial: selector de localidad abierto tiene nombres y foco accesibles", async ({ page }) => {
  await page.goto("/?registro=empresa");
  await checkPopup(page, "Localidad", "Seleccionar localidad", "Localidades disponibles");
});

test("administración: categorías y localidad abiertas conservan accesibilidad", async ({ page }) => {
  await loginFixture(page, "admin");
  await page.goto("/admin/candidates");
  await checkPopup(page, "Categorías", "Filtrar por categorías", "Categorías disponibles para filtrar");
  await checkPopup(page, "Localidad", "Seleccionar localidad", "Localidades disponibles");
  await page.goto("/admin/atencion-presencial");
  await checkPopup(page, "Categorías laborales", "Seleccionar categorías laborales", "Categorías laborales disponibles");
});

test("empresa: modalidades abiertas tienen nombres y foco accesibles", async ({ page }) => {
  await loginFixture(page, "company");
  await page.goto("/empresa/ofertas/nueva");
  await checkPopup(page, "Modalidad", "Opciones de modalidad", "Valores de modalidad");
});
