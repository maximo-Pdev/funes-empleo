import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const registration of [
  { path: "/registro/candidato", button: "Crear cuenta candidata" },
  { path: "/registro/empresa", button: "Crear cuenta de empresa" },
]) {
  test(`confirmación y controles de contraseña en ${registration.path}`, async ({ page }) => {
    await page.goto(registration.path);
    const password = page.getByLabel("Contraseña", { exact: true });
    const confirmation = page.getByLabel("Confirmar contraseña", { exact: true });
    await expect(password).toHaveAttribute("type", "password");
    await expect(confirmation).toHaveAttribute("required", "");
    await password.fill("Fictitious-First-Only!");
    await password.press("Tab");
    const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true });
    await expect(toggle).toBeFocused();
    await toggle.press("Enter");
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Space");
    await expect(password).toHaveAttribute("type", "password");
    await expect(password).toHaveValue("Fictitious-First-Only!");
    await confirmation.fill("Fictitious-Different-Only!");
    await page.getByRole("button", { name: "Mostrar confirmación de contraseña", exact: true }).click();
    await expect(confirmation).toHaveAttribute("type", "text");
    await expect(password).toHaveAttribute("type", "password");

    if (registration.path.endsWith("candidato")) {
      await page.getByLabel("Nombre y apellido").fill("Persona ficticia");
      await page.getByLabel("DNI", { exact: true }).fill("99000001");
    } else {
      await page.getByLabel("Nombre de la empresa").fill("Empresa ficticia");
      await page.getByLabel("CUIT", { exact: true }).fill("30999999997");
      await page.getByLabel("Persona responsable").fill("Responsable ficticio");
      await page.getByLabel("Actividad", { exact: true }).fill("Servicios");
      await page.getByLabel("Localidad", { exact: true }).fill("Funes");
    }
    await page.getByLabel("Correo electrónico", { exact: true }).fill("registro@example.invalid");
    await page.getByRole("button", { name: registration.button, exact: true }).click();
    await expect(confirmation).toBeFocused();
    await expect(confirmation).toHaveJSProperty("validationMessage", "Las contraseñas deben coincidir.");
    await expect(password).toHaveValue("Fictitious-First-Only!");
    await expect(page.getByLabel("Correo electrónico", { exact: true })).toHaveValue("registro@example.invalid");

    await page.locator("form").evaluate(form => form.setAttribute("novalidate", ""));
    await page.getByRole("button", { name: registration.button, exact: true }).click();
    await expect(page.locator("[data-field-error]")).toContainText("Las contraseñas deben coincidir");
    await expect(confirmation).toHaveAttribute("aria-invalid", "true");
    await expect(confirmation).toBeFocused();
    await expect(page).toHaveURL(registration.path);

    await page.setViewportSize({ width: 360, height: 800 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test("muestra y oculta la contraseña de ingreso con teclado", async ({ page }) => {
  await page.goto("/login");
  const password = page.getByLabel("Contraseña", { exact: true });
  await password.fill("Fictitious-Login-Only!");
  await password.press("Tab");
  const toggle = page.getByRole("button", { name: "Mostrar contraseña", exact: true });
  await expect(toggle).toBeFocused();
  await toggle.press("Enter");
  await expect(password).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Ocultar contraseña", exact: true }).press("Space");
  await expect(password).toHaveAttribute("type", "password");
  await expect(password).toHaveValue("Fictitious-Login-Only!");
});
