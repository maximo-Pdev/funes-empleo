import { expect, test } from "@playwright/test";
import { createHash } from "node:crypto";
import fixture from "../fixtures/acceptance-manifest.json" with { type: "json" };

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
  await page.getByLabel("Disponibilidad").fill(fixture.sc008a.candidateSearch.availability);
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
