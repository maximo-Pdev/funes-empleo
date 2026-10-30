import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

async function signIn(page: Page, role: "candidate" | "admin" | "company") {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill(`${role}1@example.invalid`);
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL({ candidate: /\/dashboard$/, company: /\/empresa$/, admin: /\/admin$/ }[role]);
}

test("registro: resumen de campos vacíos, color, foco, corrección y accesibilidad móvil", async ({ page }) => {
  await page.goto("/?registro=candidato");
  const name = page.getByLabel("Nombre y apellido");
  const email = page.getByLabel("Correo electrónico");
  await page.locator("form").getByRole("button", { name: "Crear cuenta candidata", exact: true }).click();
  await expect(name).toBeFocused();
  await expect(page.getByText("Revisá los 6 campos indicados.")).toBeVisible();
  await expect(page.locator("[data-field-error]")).toHaveText("Confirmá esta opción para continuar.");
  await expect(page.locator("[data-required-marker]")).toHaveCount(6);
  await expect(name).toHaveCSS("border-top-color", "rgb(185, 28, 28)");
  await expect(page.locator("[data-required-marker]").first()).toHaveCSS("color", "rgb(185, 28, 28)");
  await name.fill("Persona ficticia");
  await page.getByLabel("DNI", { exact: true }).fill("99.123.456");
  await email.fill("correo inválido");
  await expect(name).not.toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("DNI", { exact: true })).not.toHaveAttribute("aria-invalid", "true");
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(/Ingresá un correo válido/)).toBeVisible();
  await expect(name).toHaveValue("Persona ficticia");
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("un rechazo real de Server Action no reinicia los datos del registro", async ({ page }) => {
  await page.goto("/?registro=candidato");
  await page.getByLabel("Nombre y apellido").fill(" P");
  await page.getByLabel("DNI", { exact: true }).fill("99123456");
  await page.getByLabel("Correo electrónico").fill("retencion-ficticia@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Validation-2026!");
  await page.getByLabel("Confirmar contraseña").fill("Fictitious-Validation-2026!");
  await page.locator('input[name="termsAccepted"]').check();
  await page.locator("form").getByRole("button", { name: "Crear cuenta candidata", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("Revisá nombre, DNI, correo y contraseña");
  await expect(page.getByLabel("Nombre y apellido")).toHaveValue(" P");
  await expect(page.getByLabel("DNI", { exact: true })).toHaveValue("99123456");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("retencion-ficticia@example.invalid");
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("Fictitious-Validation-2026!");
  await expect(page.getByLabel("Confirmar contraseña")).toHaveValue("Fictitious-Validation-2026!");
});

test("credenciales rechazadas no borran el correo ni la contraseña", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill("inexistente-ficticio@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Wrong-2026!");
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No pudimos iniciar sesión");
  await expect(page.getByLabel("Correo electrónico")).toHaveValue("inexistente-ficticio@example.invalid");
  await expect(page.getByLabel("Contraseña", { exact: true })).toHaveValue("Fictitious-Wrong-2026!");
});

test("administración: contacto alternativo y DNI con mensajes locales sin borrar el nombre", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/candidates/assisted");
  await page.getByLabel("Nombre y apellido").fill("Persona asistida ficticia");
  await page.getByLabel("DNI", { exact: true }).fill("ABC");
  await page.getByRole("button", { name: "Comprobar duplicados y guardar" }).click();
  await expect(page.getByLabel("DNI", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Teléfono", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText(/Ingresá un DNI de 7 u 8 dígitos/)).toBeVisible();
  await expect(page.getByLabel("Nombre y apellido")).toHaveValue("Persona asistida ficticia");
  await page.getByLabel("Teléfono", { exact: true }).fill("3410000000");
  await expect(page.getByLabel("Teléfono", { exact: true })).not.toHaveAttribute("aria-invalid", "true");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("empresa: errores de perfil y grupo de contacto sin guardar ni vaciar otros campos", async ({ page }) => {
  await signIn(page, "company");
  await page.goto("/empresa/perfil");
  const name = await page.getByLabel("Nombre de la empresa").inputValue();
  await page.getByLabel("Correo de contacto").fill("");
  await page.getByLabel("Teléfono de contacto").fill("");
  await page.getByLabel("CUIT", { exact: true }).fill("123");
  await page.getByRole("button", { name: "Guardar perfil", exact: true }).click();
  await expect(page.getByLabel("CUIT", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Correo de contacto")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Nombre de la empresa")).toHaveValue(name);
  await expect(page.getByText(/Ingresá un CUIT de 11 dígitos/)).toBeVisible();
});

test("PDF rechazado: no navega, conserva el archivo elegido y el CV vigente", async ({ page }) => {
  await signIn(page, "candidate");
  await page.goto("/dashboard?section=perfil");
  await expect(page.locator("[data-form-field]").filter({ has: page.getByLabel("Habilidades y experiencia") })).toHaveCSS("grid-column-end", "-1");
  const currentCv = await page.getByRole("link", { name: "Abrir mi CV en otra pestaña" }).getAttribute("href");
  const input = page.getByLabel("Elegir CV");
  await input.setInputFiles({ name: "rechazado-ficticio.pdf", mimeType: "application/pdf", buffer: Buffer.from("PDF ficticio dañado") });
  const response = page.waitForResponse(result => result.url().endsWith("/api/candidate/cv") && result.request().method() === "POST");
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  expect((await response).status()).toBe(422);
  await expect(page.getByText(/El archivo de CV fue rechazado/)).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\?section=perfil$/);
  expect(await input.evaluate(element => (element as HTMLInputElement).files?.[0]?.name)).toBe("rechazado-ficticio.pdf");
  await expect(input).toHaveAttribute("aria-invalid", "true");
  await expect(input).toHaveCSS("border-top-color", "rgb(185, 28, 28)");
  await expect(page.getByRole("link", { name: "Abrir mi CV en otra pestaña" })).toHaveAttribute("href", currentCv!);
});

test("los filtros GET siguen funcionando y no pasan a ser obligatorios", async ({ page }) => {
  await page.goto("/ofertas");
  const form = page.getByRole("form", { name: "Buscar ofertas laborales" });
  await expect(form.locator("[required]")).toHaveCount(0);
  await form.getByRole("searchbox").fill("Administrativo");
  await form.getByRole("button", { name: "Buscar ofertas" }).click();
  await expect(page).toHaveURL(/\/ofertas\?.*q=Administrativo/);
});

test("métricas: un período invertido conserva fechas y muestra el error junto a Hasta", async ({ page }) => {
  await signIn(page, "admin");
  await page.goto("/admin/metrics");
  await page.getByLabel("Desde").fill("2026-10-15");
  await page.getByLabel("Hasta").fill("2026-10-01");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByLabel("Hasta")).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("[data-field-error]")).toContainText("La fecha Hasta debe ser igual o posterior a Desde.");
  await expect(page.getByLabel("Desde")).toHaveValue("2026-10-15");
  await expect(page.getByLabel("Hasta")).toHaveValue("2026-10-01");
  await expect(page).toHaveURL(/\/admin\/metrics$/);
});
