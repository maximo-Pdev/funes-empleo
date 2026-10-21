import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const origin = process.env.REGISTRATION_LAYOUT_BASE_URL ?? "http://127.0.0.1:3000";
if (!["http://127.0.0.1:3000", "http://127.0.0.1:3001"].includes(origin)) throw new Error("Las pruebas visuales exigen una aplicación local.");
test.use({ baseURL: origin });

test("login compacto centrado: oficina a la izquierda y registro sobre ingreso a la derecha", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/login");
  const cards = page.locator("[data-login-card]");
  await expect(cards).toHaveCount(2);
  await expect(cards.nth(0)).toBeVisible(); await expect(cards.nth(1)).toBeVisible();
  const guide = await cards.nth(0).boundingBox();
  const form = await cards.nth(1).boundingBox();
  const signup = await page.locator("[data-login-signup]").boundingBox();
  expect(signup!.y + signup!.height).toBeLessThan(form!.y);
  expect(guide!.x + guide!.width).toBeLessThan(signup!.x);
  expect(Math.abs(signup!.x - form!.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(signup!.width - form!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(signup!.y - guide!.y)).toBeLessThanOrEqual(1);
  expect(Math.abs(guide!.width - form!.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(guide!.y + guide!.height - (form!.y + form!.height))).toBeLessThanOrEqual(1);
  for (const input of await page.locator('input:not([type="hidden"]),button').all()) {
    await expect(input).toBeVisible();
    expect((await input.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: test.info().outputPath("login-1920.png"), fullPage: true });
  for (const height of [1080, 960]) {
    await page.setViewportSize({ width: 1920, height });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(height);
    await expect.poll(async () => {
      const guideBounds = (await cards.nth(0).boundingBox())!;
      return Math.abs(guideBounds.height - guide!.height);
    }).toBeLessThanOrEqual(1);
    const guideBounds = (await cards.nth(0).boundingBox())!;
    const formBounds = (await cards.nth(1).boundingBox())!;
    expect(Math.abs(guideBounds.y + guideBounds.height - (formBounds.y + formBounds.height))).toBeLessThanOrEqual(1);
    expect(Math.abs(formBounds.height - form!.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(guideBounds.y - (guide!.y - (1080 - height) / 2))).toBeLessThanOrEqual(1);
    const header = (await page.locator("main > header").boundingBox())!;
    const back = (await page.getByRole("link", { name: "Volver al inicio" }).boundingBox())!;
    const footer = (await page.getByText("Oficina de Empleo de Funes · Entorno de prueba").boundingBox())!;
    const freeAbove = back.y - (header.y + header.height);
    const freeBelow = height - (footer.y + footer.height);
    expect(freeAbove).toBeGreaterThan(40);
    expect(Math.abs(freeAbove - freeBelow)).toBeLessThanOrEqual(5);
  }
});

test("login móvil, reflow y escritorio bajo: accesos y campos alcanzables con teclado", async ({ page }) => {
  for (const viewport of [{ width: 360, height: 800 }, { width: 960, height: 540 }, { width: 1280, height: 540 }]) {
    await page.setViewportSize(viewport); await page.goto("/login");
    await expect(page.locator("[data-login-signup]")).toBeVisible();
    await expect(page.locator("[data-login-card]").nth(0)).toBeVisible();
    await expect(page.locator("[data-login-card]").nth(1)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const signup = (await page.locator("[data-login-signup]").boundingBox())!;
    const guide = (await page.locator("[data-login-card]").nth(0).boundingBox())!;
    const form = (await page.locator("[data-login-card]").nth(1).boundingBox())!;
    expect(signup.y + signup.height).toBeLessThan(form.y);
    if (viewport.width < 1024) {
      expect(form.y + form.height).toBeLessThan(guide.y);
      expect(Math.abs(signup.x - form.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(guide.x - form.x)).toBeLessThanOrEqual(1);
    }
    const password = page.getByLabel("Contraseña", { exact: true });
    await password.click(); await password.press("Tab");
    const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true });
    await expect(toggle).toBeFocused(); await toggle.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Space");
    await expect(password).toHaveAttribute("type", "password");
    for (const label of ["Soy postulante", "Soy empresa", "Recuperar acceso", "Necesito verificar mi correo"]) {
      const link = page.getByRole("link", { name: label }); await link.scrollIntoViewIfNeeded(); await expect(link).toBeInViewport();
    }
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
});

test("el diseño mantiene errores visibles y conserva datos sin enviar credenciales inválidas", async ({ page }) => {
  const submissions: string[] = [];
  page.on("request", request => { if (request.method() === "POST") submissions.push(request.url()); });
  await page.goto("/login");
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page.locator("[data-field-error]")).toHaveCount(2);
  await expect(page.getByLabel("Correo electrónico")).toBeFocused();
  await page.getByLabel("Correo electrónico").fill("persona-ficticia@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("12");
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page.locator("[data-field-error]")).toContainText("Ingresá al menos 6 caracteres.");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("persona-ficticia@example.invalid");
  expect(submissions).toEqual([]);
});

test("la tarjeta superior abre ambos registros sin enviar el login", async ({ page }) => {
  for (const [label, path, title] of [["Soy postulante", "/registro/candidato", "Registro de candidatos"], ["Soy empresa", "/registro/empresa", "Registro de empresas"]] as const) {
    await page.goto("/login");
    await page.getByRole("navigation", { name: "Crear una cuenta" }).getByRole("link", { name: label }).click();
    await expect(page).toHaveURL(`${origin}${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  }
});
