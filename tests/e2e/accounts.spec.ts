import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("cuenta ficticia: inicio de sesión, página privada y cierre", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo contra Supabase local ficticio");
  await page.goto("/account");
  await expect(page).toHaveURL(/\/session-expired$/);
  await page.goto("/login");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Correo electrónico").fill("candidate1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Mi cuenta", exact: true })).toBeVisible();
  await expect(page.getByText("Rol: Candidato")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/account");
  await expect(page).toHaveURL(/\/session-expired$/);
});

test("recuperación responde igual para correo existente y desconocido", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo contra Supabase local ficticio");
  const responses: string[] = [];
  for (const email of ["candidate2@example.invalid", "no-existe@example.invalid"]) {
    await page.goto("/recover");
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByRole("button", { name: "Solicitar enlace de recuperación" }).click();
    const status = page.getByRole("status");
    await expect(status).toContainText("Si corresponde, recibirás un enlace");
    responses.push((await status.textContent()) ?? "");
  }
  expect(responses[0]).toBe(responses[1]);
});
