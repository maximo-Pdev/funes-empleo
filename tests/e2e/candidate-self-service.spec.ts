import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { join } from "node:path";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

// One-time local verification links must stay out of traces and screenshots.
test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => {
  assertLocalTargets();
});

async function signIn(page: import("@playwright/test").Page, email: string, password: string) {
  assertLocalTargets();
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

test("registro, dos postulaciones independientes, retiro, suspensión y archivo restaurable", async ({ page, browser, request }) => {
  test.setTimeout(120_000);
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
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill(password);
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
  const activation = page.getByRole("region", { name: "Activación del perfil" });
  await expect(activation.getByText("Antes de activar tu perfil", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Activar perfil" })).toHaveCount(0);
  await page.getByLabel("Localidad laboral").fill("Funes");
  await page.getByLabel("Habilidades y experiencia").fill("Experiencia ficticia en tareas administrativas");
  await page.getByLabel("Categoría ficticia A").check();
  await page.getByLabel("Categoría ficticia B").check();
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(page.getByText("Perfil actualizado.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Categoría ficticia A")).toBeChecked();
  await expect(page.getByLabel("Categoría ficticia B")).toBeChecked();
  await expect(page.getByText(/tu consentimiento global vigente se retira automáticamente/)).toBeVisible();
  await page.getByLabel("Acción").selectOption("accepted");
  await page.getByLabel("Confirmo esta decisión").check();
  await page.getByRole("button", { name: "Guardar consentimiento" }).click();
  await expect(page.getByText("Consentimiento registrado.", { exact: false })).toBeVisible();
  await page.reload();
  await page.getByLabel("Elegir PDF").setInputFiles(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf"));
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
  await page.route("**/candidato/perfil*", async route => {
    if (route.request().method() === "GET" && route.request().headers().rsc === "1") await refreshGate;
    await route.continue();
  });
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  try {
    await expect(page.getByText("CV guardado; actualizando el perfil…", { exact: true })).toBeVisible();
    await expect(page.getByText("CV guardado.", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Cargando CV…" })).toBeDisabled();
  } finally { releaseRefresh(); }
  await expect(page).toHaveURL(/\/candidato\/perfil$/);
  await expect(page.getByText("CV guardado.")).toBeVisible();
  await page.unroute("**/candidato/perfil*");
  await expect(activation.getByRole("button", { name: "Activar perfil" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(activation).toBeInViewport();
  const top = await activation.boundingBox();
  const details = await page.getByRole("heading", { name: "Datos laborales y personales" }).boundingBox();
  expect(top!.y + top!.height).toBeLessThanOrEqual(details!.y);
  await activation.getByRole("button", { name: "Activar perfil" }).focus();
  await page.keyboard.press("Enter");
  await expect(activation.getByText("Perfil activo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Activar perfil" })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(activation.getByText("Perfil activo", { exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/profile-presentation-mobile.png" });
  await page.setViewportSize({ width: 1920, height: 1080 });
  const detailsCard = page.getByRole("region", { name: "Datos laborales y personales" });
  const cvCard = page.getByRole("region", { name: "CV PDF" });
  const consentCard = page.locator("form").filter({ has: page.getByRole("heading", { name: "Consentimiento de prueba" }) });
  await expect(detailsCard).toHaveCSS("grid-column-end", "-1");
  await expect(consentCard).toHaveCSS("grid-column-end", "-1");
  const cvBounds = await cvCard.boundingBox();
  const consentBounds = await consentCard.boundingBox();
  expect(consentBounds!.y).toBeGreaterThanOrEqual(cvBounds!.y + cvBounds!.height);
  await expect(detailsCard.getByLabel("Teléfono (opcional)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contacto adicional" })).toHaveCount(0);
  const policyText = consentCard.getByText(/no es texto municipal aprobado/);
  await expect(policyText).toBeHidden();
  const policyToggle = consentCard.getByText("Ver política de consentimiento", { exact: true });
  await policyToggle.focus();
  await page.keyboard.press("Enter");
  await expect(policyText).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(policyText).toBeHidden();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "test-results/profile-presentation-desktop.png", fullPage: true });
  const summary = page.getByLabel("Habilidades y experiencia");
  const storedSummary = await summary.inputValue();
  await summary.fill("Corrección ficticia todavía sin guardar");
  const phone = detailsCard.getByLabel("Teléfono (opcional)");
  await phone.fill("inválido");
  await detailsCard.getByRole("button", { name: "Guardar teléfono" }).click();
  await expect(phone).toHaveAttribute("aria-invalid", "true");
  await expect(summary).toHaveValue("Corrección ficticia todavía sin guardar");
  await phone.fill("3415550100");
  await detailsCard.getByRole("button", { name: "Guardar teléfono" }).click();
  await expect(detailsCard.getByText("Contacto actualizado.", { exact: true })).toBeVisible();
  await expect(summary).toHaveValue("Corrección ficticia todavía sin guardar");
  await page.reload();
  await expect(phone).toHaveValue("3415550100");
  await expect(summary).toHaveValue(storedSummary);
  await phone.fill("");
  await detailsCard.getByRole("button", { name: "Guardar teléfono" }).click();
  await expect(detailsCard.getByText("Contacto actualizado.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(phone).toHaveValue("");
  const originalCv = await page.getByRole("link", { name: "Descargar mi CV" }).getAttribute("href");
  await page.getByLabel("Elegir PDF").setInputFiles({
    name: "rechazado.pdf", mimeType: "application/pdf", buffer: Buffer.from("PDF ficticio dañado"),
  });
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page).toHaveURL(/\/candidato\/perfil$/);
  await expect(page.getByText("El PDF fue rechazado.", { exact: false })).toBeVisible();
  await expect(page.getByRole("link", { name: "Descargar mi CV" })).toHaveAttribute("href", originalCv!);
  await page.getByLabel("Elegir PDF").setInputFiles(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf"));
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page).toHaveURL(/\/candidato\/perfil$/);
  await expect(page.getByRole("link", { name: "Descargar mi CV" })).not.toHaveAttribute("href", originalCv!);

  await page.goto("/candidato/ofertas");
  const availableTitles = (await page.locator("li a[href^='/ofertas/']").allTextContents()).map(title => title.trim());
  const titles = availableTitles.filter(title => availableTitles.filter(other => other === title).length === 1);
  expect(titles.length).toBeGreaterThanOrEqual(2);
  for (const title of titles.slice(0, 2)) {
    const card = page.locator("li").filter({ has: page.getByText(title, { exact: true }) });
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
  await page.getByLabel("Habilidades y experiencia").click();
  await page.getByLabel("Habilidades y experiencia").press("ControlOrMeta+A");
  await page.keyboard.insertText("Experiencia ficticia corregida directamente");
  await expect(page.getByLabel("Habilidades y experiencia")).toHaveValue("Experiencia ficticia corregida directamente");
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(page.getByText("Perfil actualizado.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar correcciones" })).toBeEnabled();
  await page.reload();
  await expect(page.getByLabel("Habilidades y experiencia")).toHaveValue("Experiencia ficticia corregida directamente");
  await page.locator('select[name="availability"]').selectOption("unavailable");
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(page.getByText("Estado del perfil:")).toContainText("No disponible");

  const adminContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  try {
    const admin = await adminContext.newPage();
    await signIn(admin, "admin1@example.invalid", localFixturePassword());
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
    await expect(page.getByRole("button", { name: /archivar|eliminar/i })).toHaveCount(0);
    await page.goto("/account");
    await expect(page.getByRole("button", { name: /archivar|eliminar/i })).toHaveCount(0);
    const profileId = new URL(admin.url()).pathname.split("/").at(-1)!;
    expect(profileId).toMatch(/^[0-9a-f-]{36}$/);
    runLocalMaintenanceSql(`begin;
      select set_config('request.jwt.claim.sub',account.auth_user_id::text,true),
        set_config('request.jwt.claims',jsonb_build_object('sub',account.auth_user_id,'session_id',
          (select id from auth.sessions where user_id=account.auth_user_id order by created_at desc limit 1))::text,true)
      from public.candidate_profiles profile join public.accounts account on account.id=profile.account_id where profile.id='${profileId}';
      select private.change_account_status(profile.account_id,account.version,'archive',null,true)
      from public.candidate_profiles profile join public.accounts account on account.id=profile.account_id where profile.id='${profileId}';
      commit;`);
    await page.goto("/candidato/perfil");
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
