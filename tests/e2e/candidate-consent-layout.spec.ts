import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { loginFixture } from "./fixtures/quality";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(async ({ page }) => {
  assertLocalTargets();
  await loginFixture(page, "candidate");
  await page.goto("/dashboard?section=cuenta");
  await expect(page.getByRole("region", { name: "Privacidad", exact: true })).toBeVisible();
});

test("privacidad aprovecha PC, apila móvil y conserva lectura completa y teclado", async ({ page }) => {
  test.setTimeout(60000);
  const privacy = page.getByRole("region", { name: "Privacidad", exact: true });
  for (const width of [1920, 1366, 390, 320]) {
    await page.setViewportSize({ width, height: 1080 });
    await page.evaluate(() => document.fonts.ready);
    const box = await privacy.boundingBox();
    expect(box).not.toBeNull();
    if (width >= 1280) {
      expect(box!.width).toBeGreaterThan(width === 1920 ? 1000 : 700);
      const information = await privacy.getByText(/^Al aceptar, autorizás/).boundingBox();
      const decision = await privacy.getByRole("heading", { name: "Gestionar consentimiento" }).boundingBox();
      expect(decision!.x).toBeGreaterThanOrEqual(information!.x + information!.width);
    } else {
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
      const information = await privacy.getByText(/^Si la Oficina confirma una contratación,/).boundingBox();
      const decision = await privacy.getByRole("button", { name: "Retirar consentimiento" }).boundingBox();
      expect(decision!.y).toBeGreaterThan(information!.y + information!.height);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id)).toEqual([]);
  }
  const more = privacy.locator("summary").filter({ hasText: "Más información" });
  await expect(privacy.locator("details")).not.toHaveAttribute("open");
  await more.focus();
  await page.keyboard.press("Enter");
  await expect(privacy.getByText(/durante 30 días/)).toBeVisible();
  await expect(privacy.getByText(/No puede ver tu DNI, domicilio ni notas internas/)).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(privacy.locator("details")).not.toHaveAttribute("open");
  await expect(privacy.getByText("Permiso actual: vigente.", { exact: true })).toBeVisible();
  await expect(privacy.getByRole("button", { name: "Guardar consentimiento" })).toHaveCount(0);
});

test("la confirmación vacía conserva el permiso y explica el error sin enviar una acción", async ({ page }) => {
  const privacy = page.getByRole("region", { name: "Privacidad", exact: true });
  const confirmation = privacy.getByRole("checkbox");
  const submissions: string[] = [];
  page.on("request", request => {
    if (request.method() === "POST" && request.headers()["next-action"]) submissions.push(request.url());
  });
  await expect(confirmation).not.toBeChecked();
  await expect(confirmation).toHaveJSProperty("required", true);
  await privacy.getByRole("button", { name: "Retirar consentimiento" }).click();
  await expect(privacy.getByText("Revisá el campo indicado.", { exact: true })).toBeVisible();
  await expect(confirmation).toHaveAttribute("aria-invalid", "true");
  await expect(confirmation).toBeFocused();
  expect(submissions).toHaveLength(0);
  await expect(privacy.getByText("Permiso actual: vigente.", { exact: true })).toBeVisible();
  await confirmation.check();
  await expect(confirmation).not.toHaveAttribute("aria-invalid", "true");
  expect(submissions).toHaveLength(0);
});
