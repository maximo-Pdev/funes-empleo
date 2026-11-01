import { expect, test, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

async function expectAligned(left: Locator, right: Locator) {
  const other = await right.elementHandle();
  expect(other).not.toBeNull();
  // Measure both in one frame: validation can scroll the focused field between
  // two separate protocol calls, changing viewport-relative y without a layout change.
  const [a, b] = await left.evaluate((element, peer) => [element, peer!].map(item => {
    const box = item.getBoundingClientRect();
    return { width: box.width, height: box.height, y: box.y };
  }), other);
  expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(a!.y - b!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(a!.height - b!.height)).toBeLessThanOrEqual(1);
}

for (const status of ["referred", "hired"]) {
  test(`seguimiento ${status}: tarjetas alineadas, también con errores de contacto`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto(`/admin/participations?status=${status}`);
    await page.locator('main a[href^="/admin/participations/"]').first().click();
    const contact = page.getByRole("heading", { name: "Registrar contacto municipal" }).locator("..");
    const history = page.getByRole("region", { name: "Historial de contactos", exact: true });
    for (const width of [1366, 1920, 2560]) {
      await page.setViewportSize({ width, height: 1080 });
      await page.evaluate(() => document.fonts.ready);
      await expectAligned(contact, history);
      await expectAligned(page.getByRole("region", { name: "Preentrevistas", exact: true }), page.getByRole("region", { name: "Respuesta empresarial", exact: true }));
    }
    await page.getByLabel("Resumen interno", { exact: true }).fill("Contacto ficticio pendiente de completar.");
    await page.getByRole("button", { name: "Guardar contacto", exact: true }).click();
    await expect(page.getByLabel("Fecha y hora (Funes)", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Resumen interno", { exact: true })).toHaveValue("Contacto ficticio pendiente de completar.");
    await expectAligned(contact, history);
    expect((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id)).toEqual([]);
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      const a = await contact.boundingBox(), b = await history.boundingBox();
      expect(b!.y).toBeGreaterThanOrEqual(a!.y + a!.height);
      expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  });
}

test("acceso secundario: tarjetas parejas en PC y sin desbordamiento a 320px", async ({ page }) => {
  for (const path of ["/recover", "/verification-expired", "/logout"]) {
    await page.goto(path);
    const introduction = page.getByRole("region", { name: "Portal Municipal de Empleo", exact: true });
    const formCard = page.locator('[data-auth-panels] > section[aria-labelledby="auth-title"] > div').first();
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.evaluate(() => document.fonts.ready);
    await expectAligned(introduction, formCard);
    await page.setViewportSize({ width: 320, height: 900 });
    const a = await introduction.boundingBox(), b = await formCard.boundingBox();
    expect(Math.abs(a!.width - b!.width)).toBeLessThanOrEqual(1);
    expect(b!.y + b!.height).toBeLessThanOrEqual(a!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
