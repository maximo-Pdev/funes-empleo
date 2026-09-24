import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"),
    "Solo Supabase local con datos ficticios");
});

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test("empresa registra, corrige, somete y archiva una oferta bajo decisión municipal", async ({ page, browser, request }) => {
  const suffix = Date.now().toString().slice(-8);
  const email = `company-e2e-${suffix}@example.invalid`;
  const password = "Fictitious-Local-E2E-2026!";
  const name = `Empresa E2E ${suffix}`;
  const title = `Oferta E2E ${suffix}`;
  const startedAt = Date.now();
  await page.goto("/registro/empresa");
  await expect(page.getByRole("heading", { name: "Registro de empresas" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByLabel("Nombre de la empresa").fill(name);
  await page.getByLabel("CUIT").fill(`30${suffix}7`);
  await page.getByLabel("Persona responsable").fill("Responsable ficticio");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Actividad").fill("Servicios ficticios");
  await page.getByLabel("Localidad").fill("Funes");
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta de empresa" }).click();
  await expect(page.getByRole("status")).toContainText("recibirás un enlace");

  let mailId: string | undefined;
  for (let attempt = 0; attempt < 30 && !mailId; attempt++) {
    const response = await request.get("http://127.0.0.1:54324/api/v1/messages");
    const inbox = await response.json() as { messages: { ID: string; Created: string; To: { Address: string }[] }[] };
    mailId = inbox.messages.find((message) => new Date(message.Created).getTime() >= startedAt - 1000 &&
      message.To.some((recipient) => recipient.Address === email))?.ID;
    if (!mailId) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  expect(mailId).toBeTruthy();
  const mail = await (await request.get(`http://127.0.0.1:54324/api/v1/message/${mailId}`)).json() as { Text?: string; HTML?: string };
  const link = (mail.Text ?? mail.HTML ?? "").match(/https?:\/\/[^\s"<>]+/)?.[0]?.replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  await page.goto(link!);
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/empresa/perfil");
  await expect(page.getByRole("heading", { name: "Perfil de empresa" })).toBeVisible();
  await expect(page.getByText("Estado:")).toContainText("Activo");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/empresa/ofertas/nueva");
  await page.getByLabel("Título").fill(title);
  await page.getByLabel("Tareas").fill("Atender consultas ficticias");
  await page.getByLabel("Requisitos").fill("Experiencia ficticia");
  await page.getByLabel("Vacantes").fill("2");
  await page.getByLabel("Ubicación").fill("Funes");
  await page.getByLabel("Modalidad").fill("Presencial");
  await page.getByLabel("Horario").fill("Jornada completa");
  await page.getByLabel("Tipo de contratación").fill("Plazo fijo");
  await page.getByLabel("Fecha de cierre").fill("2026-12-31");
  await page.getByLabel("Categoría ficticia A").check();
  await page.getByLabel("Categoría ficticia B").check();
  await page.getByRole("button", { name: "Guardar borrador" }).click();
  await expect(page).toHaveURL(/\/empresa\/ofertas\/[0-9a-f-]{36}$/);
  const openingId = new URL(page.url()).pathname.split("/").at(-1)!;
  await expect(page.getByText("Estado:")).toContainText("draft");
  await page.getByRole("button", { name: "Enviar a revisión municipal" }).click();
  await expect(page.getByText("Estado:")).toContainText("pending_review");
  await page.reload();
  await expect(page.getByText("Estado:")).toContainText("pending_review");
  await page.goto(`/ofertas/${openingId}`);
  await expect(page.getByText(title)).toHaveCount(0);

  const adminContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  try {
    const admin = await adminContext.newPage();
    await signIn(admin, "admin1@example.invalid", "Fictitious-Local-Only-2026!");
    await admin.goto(`/admin/openings/${openingId}`);
    await admin.getByLabel("Decisión").selectOption("changes_requested");
    await admin.getByLabel("Explicación para la empresa").fill("Aclarar el horario de atención.");
    await admin.getByRole("button", { name: "Guardar decisión" }).click();
    await expect(admin.getByText("Estado:")).toContainText("changes requested");
    await page.goto(`/empresa/ofertas/${openingId}`);
    await expect(page.getByText("Aclarar el horario de atención.")).toBeVisible();
    await page.getByLabel("Horario").fill("Lunes a viernes, jornada completa");
    await page.getByRole("button", { name: "Guardar borrador" }).click();
    await expect(page.getByText("Borrador guardado.", { exact: false })).toBeVisible();
    await page.reload();
    await page.getByRole("button", { name: "Enviar a revisión municipal" }).click();
    await expect(page.getByText("Estado:")).toContainText("pending_review");
    await admin.reload();
    await admin.getByLabel("Decisión").selectOption("approved");
    await admin.getByRole("button", { name: "Guardar decisión" }).click();
    await expect(admin.getByText("Estado:")).toContainText("published");
    await page.goto(`/ofertas/${openingId}`);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await admin.getByLabel("Decisión").selectOption("paused");
    await admin.getByLabel("Motivo interno").fill("Pausa operativa ficticia");
    await admin.getByRole("button", { name: "Guardar decisión" }).click();
    await page.goto(`/empresa/ofertas/${openingId}`);
    await expect(page.getByText("Estado:")).toContainText("paused");
    await expect(page.locator("body")).not.toContainText("Pausa operativa ficticia");
    await admin.getByLabel("Decisión").selectOption("resumed");
    await admin.getByRole("button", { name: "Guardar decisión" }).click();

    await admin.goto("/admin/empresas");
    await admin.getByRole("link", { name }).click();
    await admin.getByRole("button", { name: "Suspender empresa" }).click();
    await expect(admin.getByText("Cuenta: active", { exact: false })).toBeVisible();
    await admin.getByLabel("Motivo interno (no visible a la empresa)").first().fill("Suspensión ficticia");
    await admin.getByLabel("Confirmo esta decisión.").first().check();
    await admin.getByRole("button", { name: "Suspender empresa" }).click();
    await expect(admin.getByText("Decisión registrada", { exact: false })).toBeVisible();
    await page.goto("/empresa/ofertas");
    await expect(page).toHaveURL(/\/account-suspended$/);
    await admin.reload();
    await admin.getByLabel("Motivo interno (no visible a la empresa)").first().fill("Reactivación ficticia");
    await admin.getByLabel("Confirmo esta decisión.").first().check();
    await admin.getByRole("button", { name: "Reactivar empresa" }).click();
    await expect(admin.getByText("Decisión registrada", { exact: false })).toBeVisible();
    await signIn(page, email, password);
    await page.goto("/empresa/perfil");
    await expect(page.getByText("Estado:")).toContainText("Incompleto");
    await page.getByLabel("Confirmo el archivo de mi empresa y sus ofertas.").check();
    await page.getByRole("button", { name: "Archivar empresa" }).click();
    await expect(page).toHaveURL(/\/session-expired$/);
    await admin.reload();
    await admin.getByLabel("Motivo interno (no visible a la empresa)").first().fill("Restauración ficticia");
    await admin.getByLabel("Confirmo esta decisión.").first().check();
    await admin.getByRole("button", { name: "Restaurar empresa" }).click();
    await expect(admin.getByText("Decisión registrada", { exact: false })).toBeVisible();
  } finally { await adminContext.close(); }
});
