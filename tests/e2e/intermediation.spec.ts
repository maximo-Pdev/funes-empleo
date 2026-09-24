import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import fixture from "../fixtures/acceptance-manifest.json" with { type: "json" };
import { runLocalMaintenanceSql } from "./local-maintenance";

function fixtureId(kind: string, number: number) {
  const hash = createHash("md5").update(`funes-demo-v1:${kind}:${number}`).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20)}`;
}

async function signIn(page: import("@playwright/test").Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
}

// The business-flow suite uses exclusively the reset local fictitious dataset.
// It must never be pointed at a shared preview or a real-data project.
test.beforeEach(() => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"),
    "Solo contra Supabase local con el fixture ficticio restablecido");
});

test("una sesión anónima no consulta el padrón administrativo", async ({ page }) => {
  await page.goto("/admin/candidates");
  await expect(page).toHaveURL(/\/session-expired$/);
});

test("administración filtra el padrón ficticio con conteo y paginación seguros", async ({ page }) => {
  await signIn(page, "admin1@example.invalid");
  await page.goto("/admin/candidates");
  await expect(page.getByRole("heading", { name: "Buscar candidatos" })).toBeVisible();
  await page.getByLabel("Término").fill(fixture.sc008a.candidateSearch.term);
  await page.getByLabel("Categoría").selectOption({ label: "Categoría ficticia B" });
  await page.getByLabel("Habilidades").fill("Habilidad ficticia común");
  await page.getByLabel("Disponibilidad").fill(fixture.sc008a.candidateSearch.availability);
  await page.getByLabel("Localidad").fill("Localidad de prueba");
  await page.getByLabel("Vigencia").selectOption("current");
  await page.getByRole("button", { name: "Buscar candidatos" }).click();
  await expect(page.getByRole("heading", { name: `Resultados: ${fixture.sc008a.candidateSearch.expectedTotal}` })).toBeVisible();
  await expect(page.getByRole("link", { name: fixture.sc008a.candidateSearch.term })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/DNI|domicilio|nota interna/i);
});

test("solo la Oficina consulta ofertas pendientes de seguimiento y su historial", async ({ page }) => {
  await signIn(page, "admin1@example.invalid");
  await page.goto("/admin/openings?status=published");
  await expect(page.getByRole("heading", { name: `Ofertas: ${fixture.sc008a.openingList.expectedTotal}` })).toBeVisible();
  await expect(page.getByRole("link", { name: "Oferta ficticia 001" })).toBeVisible();
  await page.getByRole("link", { name: "Oferta ficticia 001" }).click();
  await expect(page.getByRole("heading", { name: "Oferta ficticia 001" })).toBeVisible();
  await expect(page.getByText("Empresa ficticia 01")).toBeVisible();
});

test("la Oficina ve estado vigente y trazas sin borrar el cierre anterior", async ({ page }) => {
  await signIn(page, "admin1@example.invalid");
  await page.goto(`/admin/participations/${fixtureId("participation", 1)}`);
  await expect(page.getByRole("heading", { name: "Seguimiento de participación" })).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Persona contratada");
  await expect(page.getByRole("heading", { name: "Historial de la participación" })).toBeVisible();
  await expect(page.getByText("Persona ficticia 001")).toBeVisible();
});

test("una empresa no puede abrir el padrón ni las participaciones administrativas", async ({ page }) => {
  await signIn(page, "company1@example.invalid");
  await page.goto("/admin/candidates");
  await expect(page).toHaveURL(/\/account$/);
  await page.goto(`/admin/participations/${fixtureId("participation", 1)}`);
  await expect(page).toHaveURL(/\/account$/);
});

test("CV privado: solo permisos vigentes permiten descargar y la última revocación corta el acceso empresarial", async ({ browser }) => {
  const localBrowser = { baseURL: "http://127.0.0.1:3000" };
  const candidateContext = await browser.newContext(localBrowser);
  const companyContext = await browser.newContext(localBrowser);
  const otherCompanyContext = await browser.newContext(localBrowser);
  const adminContext = await browser.newContext(localBrowser);
  try {
    const candidate = await candidateContext.newPage();
    const company = await companyContext.newPage();
    const otherCompany = await otherCompanyContext.newPage();
    const admin = await adminContext.newPage();
    await signIn(candidate, "candidate5@example.invalid");
    await signIn(company, "company1@example.invalid");
    await signIn(otherCompany, "company2@example.invalid");
    await signIn(admin, "admin1@example.invalid");

    const cvUrl = `/api/cv/${fixtureId("cv", 5)}`;
    for (const authorized of [candidate, company]) {
      const response = await authorized.context().request.get(cvUrl);
      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("application/pdf");
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(response.headers().location).toBeUndefined();
      expect(createHash("sha256").update(await response.body()).digest("hex")).toBe(fixture.cvSha256);
    }
    expect((await otherCompany.context().request.get(cvUrl)).status()).toBe(404);
    expect((await company.context().request.get(`/api/cv/${fixtureId("cv", 11)}`)).status()).toBe(404);
    const referralPage = `/company/openings/${fixtureId("opening", 1)}/referrals?referral=${fixtureId("referral", 5)}`;
    await company.goto(referralPage);
    await expect(company.getByRole("heading", { name: "Perfil laboral derivado" })).toBeVisible();
    await expect(company.getByText("Persona ficticia 005")).toBeVisible();
    await expect(company.getByRole("link", { name: "Descargar CV asociado a esta derivación" }))
      .toHaveAttribute("href", cvUrl);
    await expect(company.locator("body")).not.toContainText(/DNI|domicilio|nota interna/i);
    const foreignPage = await otherCompany.context().request.get(referralPage);
    const foreignMarkup = await foreignPage.text();
    expect(foreignMarkup).not.toContain("Persona ficticia 005");
    expect(foreignMarkup).not.toContain(`href="${cvUrl}"`);

    async function cancelCase(number: number) {
      await admin.goto(`/admin/participations/${fixtureId("participation", number)}`);
      await expect(admin.getByRole("status")).toContainText("Derivada");
      await admin.getByLabel("Acción").selectOption("cancel_individual");
      await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Cancelación operativa ficticia para verificar revocación.");
      await admin.getByRole("button", { name: "Registrar acción" }).click();
      await expect(admin.getByRole("status")).toContainText("Cancelada");
    }
    await cancelCase(5);
    // El fixture tiene otra derivación vigente del mismo CV a esta empresa.
    expect((await company.context().request.get(cvUrl)).status()).toBe(200);
    await cancelCase(505);

    const revoked = await company.context().request.get(cvUrl);
    expect(revoked.status()).toBe(404);
    expect(revoked.headers()["cache-control"]).toContain("no-store");
    expect((await candidate.context().request.get(cvUrl)).status()).toBe(200);
    await company.goto(referralPage);
    await expect(company.getByText("El acceso a los datos de esta persona finalizó.", { exact: false })).toBeVisible();
    await expect(company.getByText("Persona ficticia 005")).toHaveCount(0);
    await expect(company.getByRole("link", { name: "Descargar CV asociado a esta derivación" })).toHaveCount(0);
  } finally {
    await Promise.all([candidateContext.close(), companyContext.close(), otherCompanyContext.close(), adminContext.close()]);
  }
});

test("la empresa informa una contratación y solo la Oficina confirma el resultado", async ({ browser }) => {
  const localBrowser = { baseURL: "http://127.0.0.1:3000" };
  const companyContext = await browser.newContext(localBrowser);
  const adminContext = await browser.newContext(localBrowser);
  try {
    const company = await companyContext.newPage();
    const admin = await adminContext.newPage();
    await signIn(company, "company1@example.invalid");
    await signIn(admin, "admin1@example.invalid");
    await company.goto(`/company/openings/${fixtureId("opening", 1)}/referrals?referral=${fixtureId("referral", 6)}`);
    await company.getByLabel("Resultado informado").selectOption("hired");
    await company.getByRole("button", { name: "Enviar informe" }).click();
    await expect(company.getByText("El resultado informado quedó pendiente de revisión municipal.")).toBeVisible();

    await admin.goto(`/admin/participations/${fixtureId("participation", 6)}`);
    const currentStatus = admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" });
    await expect(currentStatus).toContainText("Derivada");
    await expect(admin.getByText("Contratación informada", { exact: true }).first()).toBeVisible();
    await admin.getByRole("button", { name: "Confirmar resultado" }).click();
    await expect(currentStatus).toContainText("Persona contratada");
    await expect(admin.getByRole("heading", { name: "Historial de la participación" })).toBeVisible();
  } finally {
    await Promise.all([companyContext.close(), adminContext.close()]);
  }
});

test("entrevista, no selección y cancelación individual revocan cada permiso sin cerrar la oferta", async ({ browser }) => {
  const context = { baseURL: "http://127.0.0.1:3000" };
  const companyContext = await browser.newContext(context);
  const adminContext = await browser.newContext(context);
  try {
    const company = await companyContext.newPage();
    const admin = await adminContext.newPage();
    await signIn(company, "company1@example.invalid");
    await signIn(admin, "admin1@example.invalid");
    const opening = fixtureId("opening", 1);
    await company.goto(`/company/openings/${opening}/referrals?referral=${fixtureId("referral", 9)}`);
    await expect(company.getByText("Persona ficticia 009")).toBeVisible();
    await company.getByLabel("Estado", { exact: true }).selectOption("completed");
    await company.getByLabel("Fecha realizada (Funes)").fill("2026-09-24T14:00");
    await company.getByRole("button", { name: "Registrar entrevista" }).click();
    await expect(company.getByText("La entrevista quedó registrada.")).toBeVisible();
    await company.getByLabel("Resultado informado").selectOption("not_selected");
    await company.getByRole("button", { name: "Enviar informe" }).click();
    await expect(company.getByText("El resultado informado quedó pendiente de revisión municipal.")).toBeVisible();
    await admin.goto(`/admin/participations/${fixtureId("participation", 9)}`);
    const currentStatus = admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" });
    await expect(currentStatus).not.toContainText("No seleccionada");
    await admin.getByRole("button", { name: "Confirmar resultado" }).click();
    await expect(currentStatus).toContainText("No seleccionada");
    await company.reload();
    await expect(company.getByText("Persona ficticia 009")).toHaveCount(0);

    await company.goto(`/company/openings/${opening}/referrals?referral=${fixtureId("referral", 10)}`);
    await expect(company.getByText("Persona ficticia 010")).toBeVisible();
    await company.getByLabel("Resultado informado").selectOption("process_cancelled");
    await company.getByRole("button", { name: "Enviar informe" }).click();
    await expect(company.getByText("El resultado informado quedó pendiente de revisión municipal.")).toBeVisible();
    await admin.goto(`/admin/participations/${fixtureId("participation", 10)}`);
    await admin.locator("#feedback-reason").fill("Cancelación operativa ficticia.");
    await admin.getByRole("button", { name: "Confirmar resultado" }).click();
    await expect(currentStatus).toContainText("Cancelada");
    await company.reload();
    await expect(company.getByText("Persona ficticia 010")).toHaveCount(0);
    await admin.goto(`/admin/openings/${opening}`);
    await expect(admin.getByText("Estado:")).toContainText("published");
  } finally { await Promise.all([companyContext.close(), adminContext.close()]); }
});

test("la Oficina registra contacto y nota interna sin mostrarlos a la empresa", async ({ page, browser }) => {
  await signIn(page, "admin1@example.invalid");
  await page.goto(`/admin/participations/${fixtureId("participation", 7)}`);
  await page.getByLabel("Canal", { exact: true }).selectOption("phone");
  await page.getByLabel("Dirección").selectOption("inbound");
  await page.getByLabel("Fecha y hora (Funes)").fill("2026-09-20T12:00");
  await page.getByRole("textbox", { name: "Resumen interno" }).fill("Contacto municipal ficticio sobre seguimiento.");
  await page.getByRole("button", { name: "Guardar contacto" }).click();
  await expect(page.getByText("Contacto municipal ficticio sobre seguimiento.")).toBeVisible();

  await page.goto(`/admin/candidates/${fixtureId("profile", 7)}`);
  await page.getByLabel("Tipo").selectOption("record_training_guidance");
  await page.getByRole("textbox", { name: "Contenido interno" }).fill("Orientación ficticia sobre capacitación.");
  await page.getByRole("button", { name: "Guardar nota" }).click();
  await expect(page.getByText("Orientación ficticia sobre capacitación.")).toBeVisible();

  const companyContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
  try {
    const company = await companyContext.newPage();
    await signIn(company, "company1@example.invalid");
    await company.goto(`/company/openings/${fixtureId("opening", 1)}/referrals?referral=${fixtureId("referral", 7)}`);
    await expect(company.getByRole("heading", { name: "Perfil laboral derivado" })).toBeVisible();
    await expect(company.locator("body")).not.toContainText("Contacto municipal ficticio sobre seguimiento.");
    await expect(company.locator("body")).not.toContainText("Orientación ficticia sobre capacitación.");
  } finally { await companyContext.close(); }
});

test("suspender y reactivar una cuenta candidata no restaura el acceso empresarial revocado", async ({ browser }) => {
  const localBrowser = { baseURL: "http://127.0.0.1:3000" };
  const adminContext = await browser.newContext(localBrowser);
  const companyContext = await browser.newContext(localBrowser);
  try {
    const admin = await adminContext.newPage();
    const company = await companyContext.newPage();
    await signIn(admin, "admin1@example.invalid");
    await signIn(company, "company1@example.invalid");
    const cvUrl = `/api/cv/${fixtureId("cv", 8)}`;
    expect((await company.context().request.get(cvUrl)).status()).toBe(200);

    await admin.goto(`/admin/candidates/${fixtureId("profile", 8)}`);
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Suspensión ficticia de prueba.");
    await admin.getByLabel("Confirmo la suspensión").check();
    await admin.getByRole("button", { name: "Suspender cuenta" }).click();
    await expect(admin.getByRole("button", { name: "Reactivar cuenta" })).toBeVisible();
    expect((await company.context().request.get(cvUrl)).status()).toBe(404);

    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Reactivación ficticia de prueba.");
    await admin.getByLabel("Confirmo la reactivación").check();
    await admin.getByRole("button", { name: "Reactivar cuenta" }).click();
    await expect(admin.getByRole("button", { name: "Suspender cuenta" })).toBeVisible();
    await expect(admin.getByText("Estado: active", { exact: false })).toBeVisible();
    expect((await company.context().request.get(cvUrl)).status()).toBe(404);
  } finally { await Promise.all([adminContext.close(), companyContext.close()]); }
});

test("la Oficina nomina, preentrevista, preselecciona y deriva; candidato y administrador retiran con evidencia", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = { baseURL: "http://127.0.0.1:3000" };
  const adminContext = await browser.newContext(context);
  const candidateContext = await browser.newContext(context);
  const companyContext = await browser.newContext(context);
  try {
    const admin = await adminContext.newPage();
    const candidate = await candidateContext.newPage();
    const company = await companyContext.newPage();
    await signIn(admin, "admin1@example.invalid");
    await signIn(candidate, "candidate1@example.invalid");
    await signIn(company, "company2@example.invalid");

    await admin.goto(`/admin/candidates/${fixtureId("profile", 1)}`);
    await admin.getByLabel("Oferta", { exact: true }).selectOption(fixtureId("opening", 2));
    await admin.getByRole("button", { name: "Crear nominación" }).click();
    await expect(admin).toHaveURL(/\/admin\/participations\/[0-9a-f-]{36}$/);
    await expect(admin.getByText("Origen: Nominación administrativa")).toBeVisible();
    const currentStatus = admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" });
    await expect(currentStatus).toContainText("En revisión");
    await admin.getByLabel("Acción").selectOption("record_preinterview");
    await admin.getByLabel("Canal de preentrevista").selectOption("phone");
    await admin.locator("#preinterview-summary").fill("Preentrevista municipal ficticia.");
    await admin.getByLabel("Fecha realizada").fill("2026-09-24T14:00");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Preentrevista");
    await admin.getByLabel("Acción").selectOption("preselect");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Preseleccionada");
    await admin.getByLabel("Acción").selectOption("refer");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Derivada");
    await company.goto(`/company/openings/${fixtureId("opening", 2)}/referrals`);
    await expect(company.getByText("Persona ficticia 001")).toBeVisible();
    await expect(company.locator("body")).not.toContainText(/DNI|domicilio|Preentrevista municipal ficticia/i);

    await candidate.goto("/candidato/postulaciones");
    const nominated = candidate.locator("li").filter({ has: candidate.getByRole("heading", { name: "Oferta ficticia 002" }) });
    await expect(nominated).toContainText("Recibida");
    await expect(nominated).not.toContainText(/Preentrevista|Preseleccionada|Derivada/);
    await nominated.getByLabel("Confirmo que quiero retirar esta participación.").check();
    await nominated.getByRole("button", { name: "Retirar participación" }).click();
    await expect(nominated).toContainText("Retirada");
    await company.reload();
    await expect(company.getByText("Persona ficticia 001")).toHaveCount(0);

    await admin.goto(`/admin/candidates/${fixtureId("profile", 1)}`);
    await admin.getByLabel("Oferta", { exact: true }).selectOption(fixtureId("opening", 3));
    await admin.getByRole("button", { name: "Crear nominación" }).click();
    await expect(currentStatus).toContainText("En revisión");
    await admin.getByLabel("Acción").selectOption("skip_to_preselected");
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Omisión justificada de etapas ficticias.");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Preseleccionada");
    await expect(currentStatus).not.toContainText("Derivada");
    await admin.getByLabel("Acción").selectOption("refer");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Derivada");
    await admin.getByLabel("Acción").selectOption("withdraw_on_request");
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Pedido de retiro ficticio.");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(admin.getByText("Seleccioná el contacto entrante donde el candidato pidió el retiro.")).toBeVisible();
    await admin.getByLabel("Canal", { exact: true }).selectOption("phone");
    await admin.getByLabel("Dirección").selectOption("inbound");
    await admin.getByLabel("Fecha y hora (Funes)").fill("2026-09-24T14:00");
    await admin.locator("#contact-summary").fill("Solicitud de retiro recibida por teléfono.");
    await admin.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(admin.getByText("Solicitud de retiro recibida por teléfono.")).toBeVisible();
    await admin.reload();
    await admin.getByLabel("Acción").selectOption("withdraw_on_request");
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Pedido de retiro ficticio.");
    await admin.getByLabel("Solicitud del candidato").selectOption({ index: 2 });
    await expect(admin.getByLabel("Solicitud del candidato")).not.toHaveValue("");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Retirada");

    await candidate.goto(`/ofertas/${fixtureId("opening", 4)}`);
    await candidate.getByRole("link", { name: "Postularme con mi cuenta" }).click();
    const chosenOffer = candidate.getByRole("region", { name: "Oferta elegida" });
    await expect(chosenOffer).toContainText("Oferta ficticia 004");
    await chosenOffer.getByRole("button", { name: "Postularme" }).click();
    await expect(candidate.getByText("Postulación recibida por la Oficina de Empleo.")).toBeVisible();
    await admin.goto(`/admin/candidates/${fixtureId("profile", 1)}`);
    await admin.getByRole("link", { name: "Oferta ficticia 004" }).click();
    await expect(currentStatus).toContainText("Recibida");
    await admin.getByLabel("Acción").selectOption("skip_to_preselected");
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Evaluación previa ficticia documentada.");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Preseleccionada");
    await expect(currentStatus).not.toContainText("Derivada");
    await admin.getByLabel("Acción").selectOption("refer");
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("Derivada");
  } finally { await Promise.all([adminContext.close(), candidateContext.close(), companyContext.close()]); }
});

test("cambiar CV y contactos conserva la instantánea derivada; retirar y reaceptar consentimiento no recupera acceso", async ({ browser }) => {
  const context = { baseURL: "http://127.0.0.1:3000" };
  const candidateContext = await browser.newContext(context);
  const companyContext = await browser.newContext(context);
  try {
    const candidate = await candidateContext.newPage();
    const company = await companyContext.newPage();
    await signIn(candidate, "candidate15@example.invalid");
    await signIn(company, "company2@example.invalid");
    const referralPage = `/company/openings/${fixtureId("opening", 2)}/referrals?referral=${fixtureId("referral", 15)}`;
    await company.goto(referralPage);
    await expect(company.getByText("Persona ficticia 015")).toBeVisible();
    const snapshotCv = await company.getByRole("link", { name: "Descargar CV asociado a esta derivación" }).getAttribute("href");
    expect(snapshotCv).toBe(`/api/cv/${fixtureId("cv", 15)}`);

    await candidate.goto("/candidato/perfil");
    await candidate.getByLabel("Teléfono (opcional)").fill("3415550015");
    await candidate.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(candidate.getByText("Contacto actualizado.")).toBeVisible();
    await candidate.reload();
    await candidate.getByLabel("Elegir PDF").setInputFiles("tests/fixtures/cv-fictitious.pdf");
    await candidate.getByRole("button", { name: "Cargar o reemplazar CV" }).click();
    await expect(candidate).toHaveURL(/\/candidato\/perfil\?cv=ok$/);
    await expect(candidate.getByRole("link", { name: "Descargar mi CV" })).not.toHaveAttribute("href", snapshotCv!);
    await company.reload();
    await expect(company.getByText("3415550015")).toBeVisible();
    await expect(company.getByText("candidate15@example.invalid")).toBeVisible();
    await expect(company.getByRole("link", { name: "Descargar CV asociado a esta derivación" })).toHaveAttribute("href", snapshotCv!);
    await expect(company.locator("body")).not.toContainText(/DNI|domicilio|nota interna/i);

    await candidate.getByLabel("Confirmo esta decisión y entiendo sus efectos.").check();
    await candidate.getByRole("button", { name: "Guardar consentimiento" }).click();
    await expect(candidate.getByText("Estado actual: retirado.")).toBeVisible();
    await candidate.goto("/candidato/postulaciones");
    await expect(candidate.locator("li").filter({ hasText: "Oferta ficticia 002" })).toContainText("Retirada");
    await expect(candidate.locator("li").filter({ hasText: "Oferta ficticia 052" })).toContainText("Retirada");
    await company.reload();
    await expect(company.getByText("Persona ficticia 015")).toHaveCount(0);

    await candidate.goto("/candidato/perfil");
    await candidate.getByLabel("Confirmo esta decisión y entiendo sus efectos.").check();
    await candidate.getByRole("button", { name: "Guardar consentimiento" }).click();
    await expect(candidate.getByText("Estado actual: aceptado.")).toBeVisible();
    await candidate.goto("/candidato/postulaciones");
    await expect(candidate.locator("li").filter({ hasText: "Oferta ficticia 002" })).toContainText("Retirada");
    await company.reload();
    await expect(company.getByText("Persona ficticia 015")).toHaveCount(0);
  } finally { await Promise.all([candidateContext.close(), companyContext.close()]); }
});

test("el mantenimiento local cierra una oferta, vence permisos y permite corregir feedback tardío sin reabrir acceso", async ({ browser }) => {
  const context = { baseURL: "http://127.0.0.1:3000" };
  const companyContext = await browser.newContext(context);
  const hiredCompanyContext = await browser.newContext(context);
  const adminContext = await browser.newContext(context);
  const offerCompanyContext = await browser.newContext(context);
  try {
    const company = await companyContext.newPage();
    const hiredCompany = await hiredCompanyContext.newPage();
    const admin = await adminContext.newPage();
    const offerCompany = await offerCompanyContext.newPage();
    await signIn(company, "company1@example.invalid");
    await signIn(hiredCompany, "company3@example.invalid");
    await signIn(admin, "admin1@example.invalid");
    await signIn(offerCompany, "company30@example.invalid");
    const opening = fixtureId("opening", 80);
    const overdueParticipation = fixtureId("e2e-overdue-participation", 1);
    const overdueReferral = fixtureId("e2e-overdue-referral", 1);
    const contactParticipation = fixtureId("e2e-overdue-participation", 2);
    const contactReferral = fixtureId("e2e-overdue-referral", 2);
    const hiredReferral = fixtureId("referral", 21);
    runLocalMaintenanceSql(`insert into public.participations
      (id,candidate_id,opening_id,origin,created_by,status,feedback_due_at)
      values ('${overdueParticipation}','${fixtureId("profile", 210)}','${fixtureId("opening", 1)}',
        'admin_nomination','${fixtureId("admin", 1)}','referred',clock_timestamp()-interval '1 day');
      with moment as (select clock_timestamp()-interval '31 days' as referred_at)
      insert into public.referrals
      (id,participation_id,candidate_id,referred_by,referred_at,access_status,
       consent_event_id,cv_document_id,feedback_due_at,access_changed_actor_type,
       access_changed_by_account_id,access_change_reason)
      select '${overdueReferral}','${overdueParticipation}','${fixtureId("profile", 210)}',
        '${fixtureId("admin", 1)}',moment.referred_at,'active',
        '${fixtureId("consent", 210)}','${fixtureId("cv", 210)}',
        moment.referred_at+interval '720 hours','account','${fixtureId("admin", 1)}','referral_created'
      from moment;
      insert into public.participations
      (id,candidate_id,opening_id,origin,created_by,status,feedback_due_at)
      values ('${contactParticipation}','${fixtureId("profile", 211)}','${fixtureId("opening", 1)}',
        'admin_nomination','${fixtureId("admin", 1)}','referred',clock_timestamp()-interval '1 day');
      with moment as (select clock_timestamp()-interval '31 days' as referred_at)
      insert into public.referrals
      (id,participation_id,candidate_id,referred_by,referred_at,access_status,
       consent_event_id,cv_document_id,feedback_due_at,access_changed_actor_type,
       access_changed_by_account_id,access_change_reason)
      select '${contactReferral}','${contactParticipation}','${fixtureId("profile", 211)}',
        '${fixtureId("admin", 1)}',moment.referred_at,'active',
        '${fixtureId("consent", 211)}','${fixtureId("cv", 211)}',
        moment.referred_at+interval '720 hours','account','${fixtureId("admin", 1)}','referral_created'
      from moment;`);
    await company.goto(`/company/openings/${fixtureId("opening", 1)}/referrals?referral=${overdueReferral}`);
    await expect(company.getByText("Persona ficticia 210")).toBeVisible();
    await hiredCompany.goto(`/company/openings/${fixtureId("opening", 3)}/referrals?referral=${hiredReferral}`);
    await expect(hiredCompany.getByText("Persona ficticia 021")).toBeVisible();

    const sql = `update public.job_openings set closing_date = current_date - 1 where id = '${opening}';
      update public.referrals set post_hire_access_until = clock_timestamp() - interval '1 minute' where id = '${hiredReferral}';
      select private.run_daily_employment_maintenance(clock_timestamp());
      select private.run_daily_employment_maintenance(clock_timestamp());`;
    const runs = runLocalMaintenanceSql(sql).split(/\r?\n/).filter((line) => line.startsWith("{"));
    expect(runs).toHaveLength(2);
    expect(JSON.parse(runs[0]!)).toMatchObject({ closedOpenings: 1, noCompanyResponse: 2, expiredPostHireAccess: 1 });
    expect(JSON.parse(runs[1]!)).toMatchObject({ closedOpenings: 0, noCompanyResponse: 0, expiredPostHireAccess: 0 });

    await admin.goto(`/admin/openings/${opening}`);
    await expect(admin.getByText("Estado:")).toContainText("closed");
    await expect(admin.getByText("Sistema").first()).toBeVisible();
    await offerCompany.goto(`/empresa/ofertas/${opening}`);
    await expect(offerCompany.getByText("Estado:")).toContainText("closed");
    await offerCompany.goto(`/ofertas/${opening}`);
    await expect(offerCompany.getByText("Oferta ficticia 080")).toHaveCount(0);

    await company.reload();
    await expect(company.getByText("Persona ficticia 210")).toHaveCount(0);

    const currentStatus = admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" });
    await admin.goto(`/admin/participations/${contactParticipation}`);
    await expect(currentStatus).toContainText("Sin respuesta empresarial");
    await admin.getByLabel("Canal", { exact: true }).selectOption("phone");
    await admin.getByLabel("Dirección").selectOption("inbound");
    await admin.getByLabel("Fecha y hora (Funes)").fill("2026-09-24T14:00");
    await admin.locator("#contact-summary").fill("La empresa informó tarde por teléfono.");
    await admin.getByRole("button", { name: "Guardar contacto" }).click();
    await expect(admin.getByText("La empresa informó tarde por teléfono.")).toBeVisible();
    await admin.reload();
    await admin.getByLabel("Acción").selectOption("correct_not_selected");
    await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Corrección municipal con contacto ficticio.");
    await admin.getByLabel("Contacto municipal (opcional)").selectOption({ index: 2 });
    await admin.getByRole("button", { name: "Registrar acción" }).click();
    await expect(currentStatus).toContainText("No seleccionada");
    await expect(admin.getByText("Sin respuesta empresarial: cierre automático anterior", { exact: false })).toBeVisible();
    await hiredCompany.reload();
    await expect(hiredCompany.getByText("Persona ficticia 021")).toHaveCount(0);
    await admin.goto(`/admin/participations/${overdueParticipation}`);
    await expect(currentStatus).toContainText("Sin respuesta empresarial");
    await company.getByLabel("Resultado informado").selectOption("hired");
    await company.getByRole("button", { name: "Enviar informe" }).click();
    await expect(company.getByText("El resultado informado quedó pendiente de revisión municipal.")).toBeVisible();
    await admin.reload();
    await expect(admin.getByText("Contratación informada", { exact: true }).first()).toBeVisible();
    await admin.getByRole("textbox", { name: "Motivo interno" }).last().fill("Corrección tardía ficticia.");
    await admin.getByRole("button", { name: "Confirmar resultado" }).click();
    await expect(currentStatus).toContainText("Persona contratada");
    await expect(admin.getByText("Sin respuesta empresarial: cierre automático anterior", { exact: false })).toBeVisible();
    await company.reload();
    await expect(company.getByText("Persona ficticia 210")).toHaveCount(0);
  } finally {
    await Promise.all([companyContext.close(), hiredCompanyContext.close(), adminContext.close(), offerCompanyContext.close()]);
  }
});

test("rechazo, cierre y cancelación de ofertas conservan mensajes públicos y casos independientes", async ({ browser }) => {
  test.setTimeout(90_000);
  const context = { baseURL: "http://127.0.0.1:3000" };
  const companyContext = await browser.newContext(context);
  const adminContext = await browser.newContext(context);
  try {
    const company = await companyContext.newPage();
    const admin = await adminContext.newPage();
    await signIn(company, "company1@example.invalid");
    await signIn(admin, "admin1@example.invalid");
    async function submittedOffer(title: string) {
      await company.goto("/empresa/ofertas/nueva");
      await company.getByLabel("Título").fill(title);
      await company.getByLabel("Tareas").fill("Tareas ficticias de prueba");
      await company.getByLabel("Requisitos").fill("Requisitos ficticios");
      await company.getByLabel("Vacantes").fill("1");
      await company.getByLabel("Ubicación").fill("Funes");
      await company.getByLabel("Modalidad").fill("Presencial");
      await company.getByLabel("Horario").fill("Jornada completa");
      await company.getByLabel("Tipo de contratación").fill("Plazo fijo");
      await company.getByLabel("Fecha de cierre").fill("2026-12-31");
      await company.getByLabel("Categoría ficticia A").check();
      await company.getByRole("button", { name: "Guardar borrador" }).click();
      await expect(company).toHaveURL(/\/empresa\/ofertas\/[0-9a-f-]{36}$/);
      const id = new URL(company.url()).pathname.split("/").at(-1)!;
      await company.getByRole("button", { name: "Enviar a revisión municipal" }).click();
      await expect(company.getByText("Estado:")).toContainText("pending_review");
      return id;
    }
    async function decide(id: string, decision: string, reason = "", message = "") {
      await admin.goto(`/admin/openings/${id}`);
      await admin.getByLabel("Decisión").selectOption(decision);
      if (reason) await admin.getByLabel("Motivo interno").fill(reason);
      if (message) await admin.getByLabel("Explicación para la empresa").fill(message);
      await admin.getByRole("button", { name: "Guardar decisión" }).click();
      const expected = decision === "approved" ? "published" : decision;
      await expect(admin.getByText("Estado:")).toContainText(expected);
    }

    const rejected = await submittedOffer("Oferta ficticia rechazada E2E");
    await decide(rejected, "rejected", "Revisión interna ficticia", "Revisá el alcance de las tareas.");
    await company.goto(`/empresa/ofertas/${rejected}`);
    await expect(company.getByText("Estado:")).toContainText("rejected");
    await expect(company.getByText("Revisá el alcance de las tareas.")).toBeVisible();
    await expect(company.locator("body")).not.toContainText("Revisión interna ficticia");
    await company.goto(`/ofertas/${rejected}`);
    await expect(company.getByText("Oferta ficticia rechazada E2E")).toHaveCount(0);

    const closed = await submittedOffer("Oferta ficticia cerrada E2E");
    await decide(closed, "approved");
    await admin.goto(`/admin/candidates/${fixtureId("profile", 26)}`);
    await admin.getByLabel("Oferta", { exact: true }).selectOption(closed);
    await admin.getByRole("button", { name: "Crear nominación" }).click();
    await expect(admin).toHaveURL(/\/admin\/participations\/[0-9a-f-]{36}$/);
    const preservedCase = admin.url();
    await decide(closed, "closed", "Cierre interno ficticio");
    await admin.goto(preservedCase);
    await expect(admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" })).toContainText("En revisión");
    await company.goto(`/empresa/ofertas/${closed}`);
    await expect(company.getByText("Estado:")).toContainText("closed");
    await expect(company.locator("body")).not.toContainText("Cierre interno ficticio");

    const cancelled = await submittedOffer("Oferta ficticia cancelada E2E");
    await decide(cancelled, "approved");
    await admin.goto(`/admin/candidates/${fixtureId("profile", 27)}`);
    await admin.getByLabel("Oferta", { exact: true }).selectOption(cancelled);
    await admin.getByRole("button", { name: "Crear nominación" }).click();
    await expect(admin).toHaveURL(/\/admin\/participations\/[0-9a-f-]{36}$/);
    const cancelledCase = admin.url();
    await decide(cancelled, "cancelled", "Cancelación interna ficticia");
    await admin.goto(cancelledCase);
    await expect(admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" })).toContainText("Cancelada");
    await company.goto(`/empresa/ofertas/${cancelled}`);
    await expect(company.getByText("Estado:")).toContainText("cancelled");
    await expect(company.locator("body")).not.toContainText("Cancelación interna ficticia");
  } finally { await Promise.all([companyContext.close(), adminContext.close()]); }
});
