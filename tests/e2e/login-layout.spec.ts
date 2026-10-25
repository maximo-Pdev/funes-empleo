import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.REGISTRATION_LAYOUT_BASE_URL ?? "http://127.0.0.1:3000";
if (!["http://127.0.0.1:3000", "http://127.0.0.1:3001"].includes(origin)) throw new Error("Las pruebas visuales exigen una aplicación local.");
test.use({ baseURL: origin });

test("unified login is centered beside the municipal introduction", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await expect(page).toHaveURL(`${origin}/`);
  const card = page.getByRole("region", { name: "Acceso al portal" });
  await expect(card).toBeVisible();
  const guide = await page.getByRole("heading", { level: 1 }).boundingBox();
  const form = (await card.boundingBox())!;
  expect(guide!.x + guide!.width).toBeLessThan(form.x);
  for (const input of await page.locator('input:not([type="hidden"]),button').all()) {
    await expect(input).toBeVisible();
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("login-1920.png"), fullPage: true });
  for (const height of [1080, 960]) {
    await page.setViewportSize({ width: 1920, height });
    await expect.poll(async () => {
      const bounds = (await card.boundingBox())!;
      return Math.abs(bounds.y + bounds.height / 2 - height / 2);
    }).toBeLessThanOrEqual(1);
    expect(Math.abs((await card.boundingBox())!.height - form.height)).toBeLessThanOrEqual(1);
  }
});

test("login móvil, reflow y escritorio bajo: accesos y campos alcanzables con teclado", async ({ page }) => {
  for (const viewport of [{ width: 360, height: 800 }, { width: 960, height: 540 }, { width: 1280, height: 540 }]) {
    await page.setViewportSize(viewport); await page.goto("/");
    const card = page.getByRole("region", { name: "Acceso al portal" });
    await expect(card).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const password = page.getByLabel("Contraseña", { exact: true });
    await password.click(); await password.press("Tab");
    const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true });
    await expect(toggle).toBeFocused(); await toggle.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Space");
    await expect(password).toHaveAttribute("type", "password");
    for (const label of ["Recuperar acceso"]) {
      const link = page.getByRole("link", { name: label }); await link.scrollIntoViewIfNeeded(); await expect(link).toBeInViewport();
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});

test("el diseño mantiene errores visibles y conserva datos sin enviar credenciales inválidas", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", request => { if (request.method() === "POST") submissions.push(request.url()); });
  await page.goto("/");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.locator("[data-field-error]")).toHaveCount(2);
  await expect(page.getByLabel("Correo electrónico")).toBeFocused();
  await page.getByLabel("Correo electrónico").fill("persona-ficticia@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.locator("[data-field-error]")).toContainText("Ingresá al menos 6 caracteres.");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("persona-ficticia@example.invalid");
  expect(submissions).toEqual([]);
});

test("the unified panel switches registration roles without submitting login", async ({ page }) => {
  for (const [role, field] of [["Postulante", "DNI"], ["Empresa", "CUIT"]] as const) {
    await page.goto("/");
    await page.getByRole("button", { name: "Registrarse", exact: true }).click();
    await page.getByRole("radio", { name: role, exact: true }).check();
    await expect(page).toHaveURL(`${origin}/`);
    await expect(page.getByLabel(field, { exact: true })).toBeVisible();
  }
});
