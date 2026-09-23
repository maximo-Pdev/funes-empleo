import { expect, test } from "@playwright/test";

// Keep one-time local email links out of failure traces and screenshots.
test.use({ trace: "off", screenshot: "off" });

test("enlace ficticio de recuperación habilita nueva contraseña una sola vez", async ({ page, request }) => {
  const mailpit = process.env.LOCAL_MAILPIT_URL;
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321") || !mailpit, "Solo con Mailpit y Supabase locales");
  const startedAt = Date.now();
  await page.goto("/recover");
  await page.getByLabel("Correo electrónico").fill("candidate3@example.invalid");
  await page.getByRole("button", { name: "Solicitar enlace de recuperación" }).click();
  await expect(page.getByRole("status")).toContainText("Si corresponde, recibirás un enlace");

  let id: string | undefined;
  for (let attempt = 0; attempt < 20 && !id; attempt++) {
    const response = await request.get(`${mailpit}/api/v1/messages`);
    expect(response.ok()).toBeTruthy();
    const list = await response.json() as { messages: { ID: string; Subject: string; Created: string; To: { Address: string }[] }[] };
    id = list.messages.find((message) => message.Subject === "Reset your password" &&
      new Date(message.Created).getTime() >= startedAt - 1000 &&
      message.To.some((recipient) => recipient.Address === "candidate3@example.invalid"))?.ID;
    if (!id) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  expect(id).toBeTruthy();
  const message = await (await request.get(`${mailpit}/api/v1/message/${id}`)).json() as { Text?: string; HTML?: string };
  const verifyUrl = (message.Text ?? message.HTML ?? "").match(/https?:\/\/[^\s"<>]+/)?.[0]?.replaceAll("&amp;", "&");
  expect(verifyUrl).toBeTruthy();
  await page.goto(verifyUrl!);
  await expect(page).toHaveURL(/\/update-password$/);
  await expect(page.getByRole("heading", { name: "Actualizar contraseña" })).toBeVisible();
  await page.getByLabel("Nueva contraseña", { exact: true }).fill("Fictitious-Recovered-2026!");
  await page.getByLabel("Repetir nueva contraseña").fill("Fictitious-Recovered-2026!");
  await page.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await expect(page).toHaveURL(/\/login\?changed=1$/);
  await page.getByLabel("Correo electrónico").fill("candidate3@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Recovered-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto(verifyUrl!);
  await expect(page).toHaveURL(/\/recovery-invalid#?$/);
  expect(page.url()).not.toMatch(/access_token|refresh_token|error_description/);
  await expect(page.getByRole("button", { name: "Solicitar enlace de recuperación" })).toBeVisible();
});
