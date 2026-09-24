import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";

// One-time local verification links must stay out of traces and screenshots.
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

test("registro, dos postulaciones independientes, retiro, suspensión y archivo restaurable", async ({ page, browser, request }) => {
  const suffix = Date.now().toString().slice(-5);
  const name = `Persona E2E ${suffix}`;
  const email = `candidate-e2e-${suffix}@example.invalid`;
  const dni = `999${suffix}`;
  const password = "Fictitious-Local-E2E-2026!";
  const startedAt = Date.now();

  await page.goto("/ofertas");
  await expect(page.getByRole("heading", { name: "Ofertas laborales vigentes" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

  await page.goto("/registro/candidato");
  await page.getByLabel("Nombre y apellido").fill(name);
  await page.getByLabel("DNI").fill(dni);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta candidata" }).click();
  await expect(page.getByRole("status")).toContainText("recibirás un enlace");

  let mailId: string | undefined;
  for (let attempt = 0; attempt < 30 && !mailId; attempt++) {
    const response = await request.get("http://127.0.0.1:54324/api/v1/messages");
    expect(response.ok()).toBeTruthy();
    const inbox = await response.json() as { messages: { ID: string; Created: string; To: { Address: string }[] }[] };
    mailId = inbox.messages.find((message) => new Date(message.Created).getTime() >= startedAt - 1000 &&
      message.To.some((recipient) => recipient.Address === email))?.ID;
    if (!mailId) await new Promise((resolve) => setTimeout(resolve, 200));
  }
  expect(mailId).toBeTruthy();
  const message = await (await request.get(`http://127.0.0.1:54324/api/v1/message/${mailId}`)).json() as { Text?: string; HTML?: string };
  const link = (message.Text ?? message.HTML ?? "").match(/https?:\/\/[^\s"<>]+/)?.[0]?.replaceAll("&amp;", "&");
  expect(link).toBeTruthy();
  await page.goto(link!);
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/candidato/perfil");
  await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.getByText("Estado del perfil:")).toContainText("Borrador");
  await page.getByLabel("Localidad laboral").fill("Funes");
  await page.getByLabel("Habilidades y experiencia").fill("Experiencia ficticia en tareas administrativas");
  await page.getByLabel("Categoría ficticia A").check();
  await page.getByLabel("Categoría ficticia B").check();
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(page.getByText("Perfil actualizado.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Categoría ficticia A")).toBeChecked();
  await expect(page.getByLabel("Categoría ficticia B")).toBeChecked();
  await page.getByLabel("Acción").selectOption("accepted");
  await page.getByLabel("Confirmo esta decisión").check();
  await page.getByRole("button", { name: "Guardar consentimiento" }).click();
  await expect(page.getByText("Consentimiento registrado.", { exact: false })).toBeVisible();
  await page.reload();
  await page.getByLabel("Elegir PDF").setInputFiles(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf"));
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page).toHaveURL(/\/candidato\/perfil\?cv=ok$/);
  await expect(page.getByText("CV guardado.")).toBeVisible();
  await page.getByRole("button", { name: "Activar perfil" }).click();
  await expect(page.getByText("Estado del perfil:")).toContainText("Activo");
  const originalCv = await page.getByRole("link", { name: "Descargar mi CV" }).getAttribute("href");
  await page.getByLabel("Elegir PDF").setInputFiles({
    name: "rechazado.pdf", mimeType: "application/pdf", buffer: Buffer.from("PDF ficticio dañado"),
  });
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page).toHaveURL(/\/candidato\/perfil\?cv=invalid$/);
  await expect(page.getByText("El PDF fue rechazado.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Descargar mi CV" })).toHaveAttribute("href", originalCv!);
  await page.getByLabel("Elegir PDF").setInputFiles(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf"));
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page).toHaveURL(/\/candidato\/perfil\?cv=ok$/);
  await expect(page.getByRole("link", { name: "Descargar mi CV" })).not.toHaveAttribute("href", originalCv!);

  await page.goto("/candidato/ofertas");
  const titles = await page.locator("li a[href^='/ofertas/']").allTextContents();
  expect(titles.length).toBeGreaterThanOrEqual(2);
  for (const title of titles.slice(0, 2)) {
    const card = page.locator("li").filter({ hasText: title });
    await card.getByRole("button", { name: "Postularme" }).click();
    await expect(card.getByRole("button", { name: "Participación registrada" })).toBeDisabled();
  }
  await page.goto("/candidato/postulaciones");
  await expect(page.getByRole("heading", { name: "Mis participaciones" })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: titles[0] })).toContainText("Recibida por la Oficina");
  await expect(page.locator("li").filter({ hasText: titles[1] })).toContainText("Recibida por la Oficina");
  await expect(page.locator("body")).not.toContainText(/preseleccionad|preentrevista|nota interna/i);
  const first = page.locator("li").filter({ hasText: titles[0] });
  await first.getByLabel("Confirmo que quiero retirar esta participación.").check();
  await first.getByRole("button", { name: "Retirar participación" }).click();
  await expect(first).toContainText("Retirada");
  await expect(page.locator("li").filter({ hasText: titles[1] })).toContainText("Recibida por la Oficina");

  await page.goto("/candidato/perfil");
  await page.getByLabel("Habilidades y experiencia").fill("Experiencia ficticia corregida directamente");
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await page.reload();
  await expect(page.getByLabel("Habilidades y experiencia")).toHaveValue("Experiencia ficticia corregida directamente");
  await page.locator('select[name="availability"]').selectOption("unavailable");
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(page.getByText("Estado del perfil:")).toContainText("No disponible");

  const adminContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  try {
    const admin = await adminContext.newPage();
    await signIn(admin, "admin1@example.invalid", "Fictitious-Local-Only-2026!");
    await admin.goto("/admin/candidates");
    await admin.getByLabel("Término").fill(name);
    await admin.getByLabel("Vigencia").selectOption("all");
    await admin.getByLabel("Aptitud para derivación").selectOption("all");
    await admin.getByRole("button", { name: "Buscar candidatos" }).click();
    await admin.getByRole("link", { name }).click();
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Suspensión ficticia E2E");
    await admin.getByLabel("Confirmo la suspensión").check();
    await admin.getByRole("button", { name: "Suspender cuenta" }).click();
    await expect(admin.getByRole("button", { name: "Reactivar cuenta" })).toBeVisible();
    await page.goto("/candidato/perfil");
    await expect(page).toHaveURL(/\/account-suspended$/);
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Reactivación ficticia E2E");
    await admin.getByLabel("Confirmo la reactivación").check();
    await admin.getByRole("button", { name: "Reactivar cuenta" }).click();
    await expect(admin.getByText("Cuenta: active", { exact: false })).toBeVisible();
    await signIn(page, email, password);
    await page.goto("/candidato/perfil");
    await expect(page.getByText("Estado del perfil:")).toContainText("No disponible");
    await page.getByLabel("Confirmo que quiero archivar mi cuenta y perfil.").check();
    await page.getByRole("button", { name: "Archivar ahora" }).click();
    await expect(page).toHaveURL(/\/session-expired$/);
    await admin.reload();
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Restauración ficticia E2E");
    await admin.getByLabel("Confirmo la restauración").check();
    await admin.getByRole("button", { name: "Restaurar a borrador" }).click();
    await expect(admin.getByText("Estado: draft", { exact: false })).toBeVisible();
    await signIn(page, email, password);
    await page.goto("/candidato/perfil");
    await expect(page.getByText("Estado del perfil:")).toContainText("Borrador");
    await page.goto("/candidato/postulaciones");
    await expect(page.locator("li").filter({ hasText: titles[0] })).toContainText("Retirada");
  } finally { await adminContext.close(); }
});
