import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.REGISTRATION_LAYOUT_BASE_URL ?? "http://127.0.0.1:3000";
if (!["http://127.0.0.1:3000", "http://127.0.0.1:3001"].includes(origin)) throw new Error("Las pruebas visuales exigen una aplicación local.");
test.use({ baseURL: origin });

test("cambia de postulante a empresa y vuelve sin enviar ningún registro", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", request => { if (request.method() === "POST") submissions.push(request.url()); });
  await page.goto("/registro/candidato");
  const navigation = page.getByRole("navigation", { name: "Tipo de registro" });
  await expect(navigation.getByRole("link", { name: "Soy postulante" })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Soy empresa" }).click();
  await expect(page).toHaveURL(`${origin}/registro/empresa`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Registro de empresas");
  await expect(page.getByLabel("CUIT", { exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Soy empresa" })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Soy postulante" }).click();
  await expect(page).toHaveURL(`${origin}/registro/candidato`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Registro de candidatos");
  await expect(page.getByLabel("DNI", { exact: true })).toBeVisible();
  expect(submissions).toEqual([]);
});

for (const role of ["candidato", "empresa"] as const) {
  test(`${role}: tarjetas simétricas sin scroll en1920×1080`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/registro/${role}`);
    const cards = page.locator("[data-registration-card]");
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toBeVisible();
    await expect(cards.nth(1)).toBeVisible();
    const guide = await cards.nth(0).boundingBox();
    const form = await cards.nth(1).boundingBox();
    expect(Math.abs(guide!.width - form!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(guide!.height - form!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(guide!.y - form!.y)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth <= innerWidth,
      height: document.documentElement.scrollHeight <= innerHeight }))).toEqual({ width: true, height: true });
    for (const input of await page.locator('input:not([type="hidden"]), button').all()) {
      expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    await expect(page.getByRole("link", { name: "Ayuda para verificar mi correo" })).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath(`registro-${role}-1920.png`), fullPage: true });
    await page.setViewportSize({ width: 1920, height: 960 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(960);
    const password = page.getByLabel("Contraseña", { exact: true });
    await password.click();
    await password.press("Tab");
    const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true });
    await expect(toggle).toBeFocused();
    await toggle.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Space");
    await expect(password).toHaveAttribute("type", "password");
  });

  test(`${role}: móvil y ancho equivalente a zoom sin recortar campos`, async ({ page }) => {
    for (const viewport of [{ width: 360, height: 800 }, { width: 960, height: 540 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`/registro/${role}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const input of await page.locator('input:not([type="hidden"])').all()) {
        await input.click();
        await expect(input).toBeFocused();
        await expect(input).toBeInViewport();
      }
      await page.getByRole("link", { name: "Ayuda para verificar mi correo" }).scrollIntoViewIfNeeded();
      await expect(page.getByRole("link", { name: "Ayuda para verificar mi correo" })).toBeInViewport();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });

  test(`${role}: los errores pueden extender el documento y siguen visibles`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/registro/${role}`);
    await page.getByRole("button", { name: role === "candidato" ? "Crear cuenta candidata" : "Crear cuenta de empresa" }).click();
    const errors = page.locator("[data-field-error]");
    await expect(errors).toHaveCount(role === "candidato" ? 5 : 8);
    for (const error of await errors.all()) {
      await error.scrollIntoViewIfNeeded();
      await expect(error).toBeVisible();
      await expect(error).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
