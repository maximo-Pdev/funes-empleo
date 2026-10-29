import { referenceIdentifier } from "./fixtures/record-reference";
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

async function signIn(page: import("@playwright/test").Page, email: string, password: string, role: "candidate" | "admin") {
  assertLocalTargets();
  // The login form lives on the home page and is replaced by a session notice while a session is active
  // (here the candidate is re-entered after a suspension or an archive). Drop the stale session first.
  await page.context().clearCookies();
  await page.goto("/");
  await expect(page.getByLabel("Correo electrónico")).toBeVisible();
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL({ candidate: /\/dashboard$/, admin: /\/account$/ }[role]);
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

  await page.goto("/?registro=candidato");
  await expect(page.locator("body")).not.toContainText("intereses");
  await page.getByLabel("Nombre y apellido").fill(name);
  await page.getByLabel("DNI").fill(dni);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña", { exact: true }).fill(password);
  await page.locator("form").getByRole("button", { name: "Crear cuenta candidata", exact: true }).click();
  await expect(page.getByText(/recibirás un enlace/)).toBeVisible();

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
  await page.goto("/dashboard?section=perfil");
  await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
  const activation = page.getByRole("region", { name: "Activación del perfil" });
  await expect(activation.getByText("Antes de activar tu perfil", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Activar perfil" })).toHaveCount(0);
  await page.getByLabel("Localidad laboral").fill("Funes");
  await page.getByLabel("Habilidades y experiencia").fill("Experiencia ficticia en tareas administrativas");
  await page.getByLabel("Categoría ficticia A").check();
  await page.getByLabel("Categoría ficticia B").check();
  await expect(page.getByRole("group", { name: "Intereses laborales" })).toHaveCount(0);
  await page.getByRole("button", { name: "Guardar correcciones" }).click();
  await expect(page.getByText("Perfil actualizado.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Categoría ficticia A")).toBeChecked();
  await expect(page.getByLabel("Categoría ficticia B")).toBeChecked();
  await expect(page.getByText(/Tu consentimiento se conserva: no tenés que aceptarlo de nuevo/)).toBeVisible();
  await page.getByLabel("Confirmo esta decisión y entiendo sus efectos.", { exact: true }).check();
  await page.getByRole("button", { name: "Guardar consentimiento" }).click();
  await expect(page.getByText("Consentimiento registrado.", { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Ya aceptaste el consentimiento.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Guardar consentimiento" })).toHaveCount(0);
  await page.getByLabel("Elegir CV").setInputFiles(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf"));
  let releaseRefresh!: () => void;
  const refreshGate = new Promise<void>(resolve => { releaseRefresh = resolve; });
  const profileRoute = (url: URL) => url.pathname === "/dashboard" && url.searchParams.get("section") === "perfil";
  await page.route(profileRoute, async route => {
    if (route.request().method() === "GET" && route.request().headers().rsc === "1") await refreshGate;
    await route.continue();
  });
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  try {
    await expect(page.getByText("CV guardado; actualizando el perfil…", { exact: true })).toBeVisible();
    await expect(page.getByText("CV guardado.", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Cargando CV…" })).toBeDisabled();
  } finally { releaseRefresh(); }
  await expect(page).toHaveURL(/\/dashboard\?section=perfil$/);
  await expect(page.getByText("CV guardado.")).toBeVisible();
  await page.unroute(profileRoute);
  await expect(activation.getByRole("button", { name: "Activar perfil" })).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(activation).toBeInViewport();
  const top = await activation.boundingBox();
  const details = await page.getByRole("heading", { name: "Datos laborales y personales" }).boundingBox();
  expect(top!.y + top!.height).toBeLessThanOrEqual(details!.y);
  await activation.getByRole("button", { name: "Activar perfil" }).focus();
  await page.keyboard.press("Enter");
  await expect(activation.getByText("Activo", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Activar perfil" })).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 360, height: 800 });
  await page.evaluate(() => window.scrollTo(0, 0));
  // The profile heading above the canvas pushes the activation state below the fold at 360px,
  // so the person reaches it by scrolling; the assertion still checks it is on screen.
  const activeStatus = activation.getByText("Activo", { exact: true });
  await activeStatus.scrollIntoViewIfNeeded();
  await expect(activeStatus).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/profile-presentation-mobile.png" });
  await page.setViewportSize({ width: 1920, height: 1080 });
  const detailsCard = page.getByRole("region", { name: "Datos laborales y personales" });
  const cvCard = page.getByRole("region", { name: "CV PDF" });
  const consentCard = page.getByRole("region", { name: "Consentimiento de prueba" });
  // La grilla de dos columnas vive dentro de la sección de datos, no en la sección misma.
  const detailsGrid = page.locator("[data-profile-details]");
  expect(await detailsGrid.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length)).toBe(2);
  await expect(consentCard).toBeVisible();
  const cvBounds = await cvCard.boundingBox();
  const consentBounds = await consentCard.boundingBox();
  expect(consentBounds!.y).toBeGreaterThanOrEqual(cvBounds!.y + cvBounds!.height);
  await expect(detailsCard.getByLabel("Teléfono (opcional)")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contacto adicional" })).toHaveCount(0);
  await expect(consentCard.getByText(/Al aceptar, autorizás/)).toBeVisible();
  await expect(consentCard.getByText(/Si la Oficina confirma una contratación,/)).toBeVisible();
  await expect(consentCard.getByText("Ver política de consentimiento", { exact: true })).toHaveCount(0);
  const informationText = consentCard.getByText(/Una empresa solo puede ver tu perfil laboral/);
  await expect(informationText).toBeHidden();
  const informationToggle = consentCard.getByText("Más información", { exact: true });
  await informationToggle.focus();
  await page.keyboard.press("Enter");
  await expect(informationText).toBeVisible();
  await expect(consentCard.getByText(/seguir viendo únicamente tu nombre/)).toBeVisible();
  await expect(consentCard.getByText(/durante 30 días/)).toBeVisible();
  
  await page.keyboard.press("Enter");
  await expect(informationText).toBeHidden();
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
  const originalCv = await page.getByRole("link", { name: "Abrir mi CV en otra pestaña" }).getAttribute("href");
  await page.getByLabel("Elegir CV").setInputFiles({
    name: "rechazado.pdf", mimeType: "application/pdf", buffer: Buffer.from("PDF ficticio dañado"),
  });
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page.getByText("El archivo de CV fue rechazado.", { exact: false })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\?section=perfil$/);
  await expect(page.getByRole("link", { name: "Abrir mi CV en otra pestaña" })).toHaveAttribute("href", originalCv!);
  await page.getByLabel("Elegir CV").setInputFiles(join(process.cwd(), "tests/fixtures/cv-fictitious.pdf"));
  await page.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
  await expect(page.getByRole("link", { name: "Abrir mi CV en otra pestaña" })).not.toHaveAttribute("href", originalCv!);
  await expect(page).toHaveURL(/\/dashboard\?section=perfil$/);

  await page.goto("/dashboard?section=ofertas");
  const availableTitles = (await page.locator("li a[href^='/ofertas/']").allTextContents()).map(title => title.trim());
  const titles = availableTitles.filter(title => availableTitles.filter(other => other === title).length === 1);
  expect(titles.length).toBeGreaterThanOrEqual(2);
  for (const title of titles.slice(0, 2)) {
    const card = page.locator("li").filter({ has: page.getByText(title, { exact: true }) });
    await card.getByRole("button", { name: "Postularme" }).click();
    await expect(card.getByRole("button", { name: "Participación registrada" })).toBeDisabled();
  }
  await page.goto("/dashboard?section=postulaciones");
  await expect(page.getByRole("heading", { name: "Mis postulaciones" })).toBeVisible();
  await expect(page.locator("li").filter({ hasText: titles[0] })).toContainText("Recibida por la Oficina");
  await expect(page.locator("li").filter({ hasText: titles[1] })).toContainText("Recibida por la Oficina");
  // EXTRA099 permits the agenda of a recorded preinterview, never internal
  // evaluations. These two self applications have no appointment of their own.
  await expect(page.getByRole("main")).not.toContainText(/preseleccionad|nota interna|resumen interno|recomendación/i);
  for (const title of titles.slice(0, 2)) {
    const participation = page.locator("li").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(participation.getByRole("heading", { name: "Preentrevista de la Oficina de Empleo", exact: true })).toHaveCount(0);
  }
  const first = page.locator("li").filter({ hasText: titles[0] });
  await first.getByLabel("Confirmo que quiero retirar esta participación.").check();
  await first.getByRole("button", { name: "Retirar participación" }).click();
  await expect(first).toContainText("Retirada");
  await expect(page.locator("li").filter({ hasText: titles[1] })).toContainText("Recibida por la Oficina");

  await page.goto("/dashboard?section=perfil");
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
  await expect(page.locator("[data-profile-status]")).toContainText("No disponible");

  const adminContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  try {
    const admin = await adminContext.newPage();
    await signIn(admin, "admin1@example.invalid", localFixturePassword(), "admin");
    await admin.goto("/admin/candidates");
    await admin.getByLabel("Búsqueda por palabra", { exact: true }).fill(name);
    await admin.getByLabel("Aptitud para derivación", { exact: true }).selectOption("all");
    await admin.getByRole("button", { name: "Buscar candidatos" }).click();
    await admin.getByRole("link", { name }).click();
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Suspensión ficticia E2E");
    await admin.getByLabel("Confirmo la suspensión").check();
    await admin.getByRole("button", { name: "Suspender cuenta" }).click();
    await expect(admin.getByRole("button", { name: "Reactivar cuenta" })).toBeVisible();
    await page.goto("/dashboard?section=perfil");
    await expect(page).toHaveURL(/\?acceso=suspendido$/);
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Reactivación ficticia E2E");
    await admin.getByLabel("Confirmo la reactivación").check();
    await admin.getByRole("button", { name: "Reactivar cuenta" }).click();
    await expect(admin.getByText("Activa", { exact: true })).toBeVisible();
    await signIn(page, email, password, "candidate");
    await page.goto("/dashboard?section=perfil");
    await expect(page.locator("[data-profile-status]")).toContainText("No disponible");
    await expect(page.getByRole("button", { name: /archivar|eliminar/i })).toHaveCount(0);
    await page.goto("/account");
    await expect(page.getByRole("button", { name: /archivar|eliminar/i })).toHaveCount(0);
    const profileReference = new URL(admin.url()).pathname.split("/").at(-1)!;
    expect(profileReference).toMatch(/^can-[0-9a-f]{24}$/);
    const profileId = referenceIdentifier("candidate", profileReference);
    expect(profileId).toMatch(/^[0-9a-f-]{36}$/);
    runLocalMaintenanceSql(`begin;
      select set_config('request.jwt.claim.sub',account.auth_user_id::text,true),
        set_config('request.jwt.claims',jsonb_build_object('sub',account.auth_user_id,'session_id',
          (select id from auth.sessions where user_id=account.auth_user_id order by created_at desc limit 1))::text,true)
      from public.candidate_profiles profile join public.accounts account on account.id=profile.account_id where profile.id='${profileId}';
      select private.change_account_status(profile.account_id,account.version,'archive',null,true)
      from public.candidate_profiles profile join public.accounts account on account.id=profile.account_id where profile.id='${profileId}';
      commit;`);
    await page.goto("/dashboard?section=perfil");
    await expect(page).toHaveURL(/\?acceso=sesion-vencida$/);
    await admin.reload();
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Restauración ficticia E2E");
    await admin.getByLabel("Confirmo la restauración").check();
    await admin.getByRole("button", { name: "Restaurar a borrador" }).click();
    await expect(admin.getByText("Borrador", { exact: true })).toBeVisible();
    await signIn(page, email, password, "candidate");
    await page.goto("/dashboard?section=perfil");
    await expect(page.getByText("Borrador", { exact: true })).toBeVisible();
    await page.goto("/dashboard?section=postulaciones");
    await expect(page.locator("li").filter({ hasText: titles[0] })).toContainText("Retirada");
  } finally { await adminContext.close(); }
});
