import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.REGISTRATION_LAYOUT_BASE_URL ?? "http://127.0.0.1:3000";
if (!["http://127.0.0.1:3000", "http://127.0.0.1:3001"].includes(origin)) throw new Error("Las pruebas visuales exigen una aplicación local.");
test.use({ baseURL: origin });

// Home is the only registration surface (EXTRA-072): the independent /registro/* pages answer 404,
// so these checks exercise the access card, its shared controls and its validation states.
test("cambia de postulante a empresa y vuelve sin enviar ningún registro", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", request => { if (request.method() === "POST") submissions.push(request.url()); });
  await page.goto("/?registro=candidato");
  await expect(page.getByRole("radio", { name: "Postulante" })).toBeChecked();
  await expect(page.getByLabel("DNI", { exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Empresa" }).check();
  await expect(page.getByLabel("CUIT", { exact: true })).toBeVisible();
  await expect(page.getByLabel("DNI", { exact: true })).toHaveCount(0);
  await page.getByRole("radio", { name: "Postulante" }).check();
  await expect(page.getByLabel("DNI", { exact: true })).toBeVisible();
  expect(submissions).toEqual([]);
});

for (const role of ["candidato", "empresa"] as const) {
  test(`${role}: controles de 44px, sin desborde y accesibles en 1920×1080`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/?registro=${role}`);
    await expect(page.getByRole("region", { name: "Acceso al portal" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    for (const input of await page.locator('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"]), button').all()) {
      expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    const password = page.getByLabel("Contraseña", { exact: true });
    await password.click();
    await password.press("Tab");
    const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true });
    await expect(toggle).toBeFocused();
    await toggle.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Space");
    await expect(password).toHaveAttribute("type", "password");
    await page.screenshot({ path: test.info().outputPath(`home-registro-${role}-1920.png`), fullPage: true });
  });

  test(`${role}: móvil y ancho equivalente a zoom sin recortar campos`, async ({ page }) => {
    for (const viewport of [{ width: 360, height: 800 }, { width: 960, height: 540 }]) {
      await page.setViewportSize(viewport);
      await page.goto(`/?registro=${role}`);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      for (const input of await page.locator('input:not([type="hidden"]):not([type="radio"]):not([type="checkbox"])').all()) {
        await input.click();
        await expect(input).toBeFocused();
        await expect(input).toBeInViewport();
      }
      const submit = page.getByRole("button", { name: role === "candidato" ? "Crear cuenta candidata" : "Crear cuenta de empresa" });
      await submit.scrollIntoViewIfNeeded();
      await expect(submit).toBeInViewport();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });

  test(`${role}: el resumen de campos vacíos extiende el documento y sigue visible`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/?registro=${role}`);
    await page.getByRole("button", { name: role === "candidato" ? "Crear cuenta candidata" : "Crear cuenta de empresa" }).click();
    const count = role === "candidato" ? 5 : 8;
    await expect(page.getByText(`Revisá los ${count} campos indicados.`)).toBeVisible();
    await expect(page.locator("[data-field-error]")).toHaveCount(0);
    const markers = page.locator("[data-required-marker]");
    await expect(markers).toHaveCount(count);
    for (const marker of await markers.all()) {
      await marker.scrollIntoViewIfNeeded();
      await expect(marker).toBeVisible();
      await expect(marker).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
