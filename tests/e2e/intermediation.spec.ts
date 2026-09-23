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
