import { expect, test } from "@playwright/test";
import { assertLocalTargets } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

for (const role of ["candidate", "company"] as const) {
  test(`${role}: registro, correo al callback local y sesión verificada`, async ({ page, request }) => {
    test.setTimeout(60000);
    const suffix = Date.now().toString().slice(-8);
    const email = `registration-check-${role}-${suffix}@example.invalid`;
    const password = "Fictitious-Registration-Check-2026!";
    const startedAt = Date.now();
    await page.goto(role === "candidate" ? "/?registro=candidato" : "/?registro=empresa");
    if (role === "candidate") {
      await page.getByLabel("Nombre y apellido").fill(`Persona ficticia ${suffix}`);
      await page.getByLabel("DNI").fill(`98${suffix.slice(-6)}`);
    } else {
      await page.getByLabel("Nombre de la empresa").fill(`Empresa ficticia ${suffix}`);
      await page.getByLabel("CUIT").fill(`30${suffix}7`);
      await page.getByLabel("Persona responsable").fill("Responsable ficticio");
      await page.getByLabel("Actividad", { exact: true }).fill("Servicios ficticios");
      await page.getByRole("combobox", { name: "Localidad", exact: true }).click();
      await page.getByRole("option", { name: "Funes", exact: true }).click();
    }
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page.getByLabel("Confirmar contraseña", { exact: true }).fill(password);
    const terms = page.locator('input[name="termsAccepted"]');
    await expect(terms).not.toBeChecked();
    await terms.check();
    await page.getByRole("button", { name: role === "candidate" ? "Crear cuenta candidata" : "Crear cuenta de empresa" }).click();
    await expect(page.getByText(/recibirás un enlace/)).toBeVisible();

    let mailId: string | undefined;
    await expect.poll(async () => {
      const response = await request.get("http://127.0.0.1:54324/api/v1/messages");
      expect(response.ok()).toBe(true);
      const inbox = await response.json() as { messages: { ID: string; Created: string; To: { Address: string }[] }[] };
      mailId = inbox.messages.find(message => new Date(message.Created).getTime() >= startedAt - 1000 &&
        message.To.some(recipient => recipient.Address === email))?.ID;
      return Boolean(mailId);
    }, { message: "Se recibe confirmación únicamente en el buzón ficticio local" }).toBe(true);
    const mail = await (await request.get(`http://127.0.0.1:54324/api/v1/message/${mailId}`)).json() as { Text?: string; HTML?: string };
    const link = (mail.Text ?? mail.HTML ?? "").match(/https?:\/\/[^\s"<>]+/)?.[0]?.replaceAll("&amp;", "&");
    expect(Boolean(link)).toBe(true);
    const verification = new URL(link!);
    expect(verification.origin).toBe("http://127.0.0.1:54321");
    const destination = new URL(verification.searchParams.get("redirect_to")!);
    expect(destination.origin).toBe("http://127.0.0.1:3000");
    expect(destination.pathname).toBe("/auth/callback");

    await page.goto("/account");
    await expect(page).toHaveURL(/\?acceso=sesion-vencida$/);
    await page.goto(link!);
    await expect(page).toHaveURL(`http://127.0.0.1:3000/${role === "candidate" ? "dashboard" : "empresa"}`);
    if (role === "candidate") {
      await expect(page.getByRole("heading", { name: "Panel de usuario", exact: true })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "Secciones de mi cuenta" })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Panel de empresa", exact: true })).toBeVisible();
    }
    await page.goto(role === "candidate" ? "/dashboard?section=perfil" : "/empresa/perfil");
    await expect(page.getByRole("heading", { name: role === "candidate" ? "Mi perfil" : "Perfil de empresa", exact: true })).toBeVisible();
    await expect(page.getByLabel(role === "candidate" ? "Nombre y apellido" : "Nombre de la empresa", { exact: true })).toHaveValue(`${role === "candidate" ? "Persona" : "Empresa"} ficticia ${suffix}`);
    await page.reload();
    await expect(page.getByRole("heading", { name: role === "candidate" ? "Mi perfil" : "Perfil de empresa", exact: true })).toBeVisible();
    await page.goto(link!);
    await expect(page).toHaveURL(/\/verification-expired#?$/);
    expect(new URL(page.url()).origin).toBe("http://127.0.0.1:3000");
    expect(new URL(page.url()).search).toBe("");
  });
}
