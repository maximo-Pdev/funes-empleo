import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { persistedReference } from "./fixtures/record-reference";

const id = (kind: string, number: number) => {
  const hash = createHash("md5").update(`funes-demo-v1:${kind}:${number}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
};
test.beforeEach(() => assertLocalTargets());

for (const [number, state] of [[3, "revocado"], [8, "vigente"], [1, "contratado"]] as const) {
  test(`empresa identifica por nombre en listado y detalle: ${state}`, async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill("company1@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    const opening = persistedReference("opening", id("opening", 1));
    const referral = persistedReference("referral", id("referral", number));
    const name = `Persona ficticia ${String(number).padStart(3, "0")}`;
    await page.goto(`/empresa/ofertas/${opening}?referral=${referral}#derivaciones`);
    const section = page.getByRole("region", { name: "Candidatos derivados", exact: true });
    const navigation = section.getByRole("navigation", { name: "Derivaciones de esta oferta" });
    const selected = navigation.locator(`a[href*="${referral}"]`);
    await expect(selected).toContainText(name);
    await expect(selected).toHaveAttribute("aria-current", "page");
    await expect(section.getByRole("heading", { name: `Derivación de ${name}`, exact: true })).toBeVisible();
    expect(page.url()).not.toMatch(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/);
    if (state === "revocado") {
      await expect(section.getByRole("heading", { name: "Perfil laboral derivado", exact: true })).toHaveCount(0);
      await expect(section.getByRole("heading", { name: "Contactos vigentes", exact: true })).toHaveCount(0);
      await expect(section.getByRole("link", { name: /Descargar CV/ })).toHaveCount(0);
      await expect(section).toContainText("Se conserva únicamente su nombre");
      expect((await page.request.get(`/api/cv/${persistedReference("cv", id("cv", number))}`)).status()).toBe(404);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).include("#derivaciones").analyze()).violations).toEqual([]);
        await selected.focus();
        await page.keyboard.press("Enter");
        await expect(section.getByRole("heading", { name: `Derivación de ${name}`, exact: true })).toBeVisible();
      }
    } else if (state === "contratado") {
      await expect(section.getByText("Contratado", { exact: true })).toBeVisible();
      await expect(section.getByRole("button", { name: "Enviar informe" })).toHaveCount(0);
    } else {
      await expect(section.getByRole("heading", { name: "Perfil laboral derivado", exact: true })).toBeVisible();
      await expect(section.getByRole("link", { name: /Descargar CV/ })).toBeVisible();
    }
  });
}
