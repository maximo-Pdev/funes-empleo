import { persistedReference } from "./fixtures/record-reference";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

async function signIn(page: Page, email: string, role: "candidate" | "admin" | "company") {
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL({ candidate: /\/dashboard$/, company: /\/empresa$/, admin: /\/account$/ }[role]);
}

function openingId() {
  const id = runLocalMaintenanceSql(`select opening.id from private.public_offer_rows opening
    where exists(select 1 from public.opening_categories category where category.opening_id=opening.id)
    order by opening.id limit 1`);
  expect(id).toMatch(/^[0-9a-f-]{36}$/);
  return id;
}

test("matching compacto pagina y abre perfil modal sin nominar", async ({ page }) => {
  const id = openingId();
  const before = runLocalMaintenanceSql("select jsonb_build_object('participations',(select count(*) from public.participations),'referrals',(select count(*) from public.referrals))");
  await signIn(page, "admin1@example.invalid", "admin");
  await page.goto(`/admin/openings/${id}`);
  const section = page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true });
  await expect(section.getByText(/comparten al menos un rubro/)).toBeVisible();
  await expect(section.getByText(/^Coincidencias: [1-9]\d*/)).toBeVisible();
  const table = section.getByRole("table");
  await expect(table.getByRole("columnheader")).toHaveText(["Candidato", "Localidad", "Rubros coincidentes", "Acción"]);
  const rows = table.locator("tbody").getByRole("row");
  await expect(rows).toHaveCount(12);
  const firstRow = await rows.nth(0).boundingBox();
  const secondRow = await rows.nth(1).boundingBox();
  expect(secondRow!.y).toBeGreaterThanOrEqual(firstRow!.y + firstRow!.height);
  expect(secondRow!.x).toBe(firstRow!.x);
  const firstNames = await rows.locator("td:first-child").allTextContents();
  expect(new Set(firstNames).size).toBe(firstNames.length);
  const next = section.getByRole("link", { name: "Siguiente", exact: true });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/admin/openings/${persistedReference("opening", id)}\\?matchOrder=updated_desc&matchPage=2#opening-matches$`));
  await expect(section.getByText(/Página 2 de/)).toBeVisible();
  await expect(rows).toHaveCount(12);
  const secondNames = await rows.locator("td:first-child").allTextContents();
  expect(secondNames.some(name => firstNames.includes(name))).toBe(false);
  await page.reload();
  await expect(section.getByText(/Página 2 de/)).toBeVisible();
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).include('[aria-labelledby="opening-matches"]').analyze()).violations).toEqual([]);
  const evaluate = section.getByRole("button", { name: /^Ver perfil de / }).first();
  await evaluate.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("button", { name: "Nominar a esta oferta", exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Habilidades y experiencia", exact: true })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Categorías laborales", exact: true })).toBeVisible();
  await expect(dialog).not.toContainText("interés");
  const cv = dialog.getByRole("link", { name: "Abrir CV PDF en otra pestaña", exact: true });
  const cvPath = await cv.getAttribute("href");
  expect(cvPath).toMatch(/^\/api\/cv\/cv-[0-9a-f]{24}$/);
  const cvResponse = await page.request.get(cvPath!);
  expect(cvResponse.status()).toBe(200);
  expect(cvResponse.headers()["content-type"]).toContain("application/pdf");
  expect((await cvResponse.body()).subarray(0, 5).toString()).toBe("%PDF-");
  expect((await new AxeBuilder({ page }).include("dialog[open]").analyze()).violations).toEqual([]);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(evaluate).toBeFocused();
  expect(runLocalMaintenanceSql("select jsonb_build_object('participations',(select count(*) from public.participations),'referrals',(select count(*) from public.referrals))")).toBe(before);
});

test("matching inválido y vacío se explican sin ampliar resultados", async ({ page }) => {
  const id = openingId();
  await signIn(page, "admin1@example.invalid", "admin");
  await page.goto(`/admin/openings/${id}?matchPage=1&matchPage=2`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Revisá la página o el orden de coincidencias");
  await page.goto(`/admin/openings/${id}?matchOrder=updated_asc&matchOrder=updated_desc`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Revisá la página o el orden de coincidencias");
  await page.goto(`/admin/openings/${id}?matchPage=10000`);
  await expect(page.getByText("Sin candidatos en esta página", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la primera página", exact: true }).click();
  await expect(page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true }).getByText(/^Coincidencias:/)).toBeVisible();
});

test("ordena globalmente por actualización, conserva orden al paginar y reinicia al cambiarlo", async ({ page }) => {
  const id = openingId();
  const expected = (direction: "asc" | "desc", offset = 0) => JSON.parse(runLocalMaintenanceSql(`
    select jsonb_agg(display_name order by updated_at ${direction},display_name,id) from (
      select pool.id,pool.display_name,candidate.updated_at from private.opening_candidate_pool('${id}') pool
      join public.candidate_profiles candidate on candidate.id=pool.id
      order by candidate.updated_at ${direction},pool.display_name,pool.id limit 12 offset ${offset}
    ) ordered`)) as string[];
  await signIn(page, "admin1@example.invalid", "admin");
  await page.goto(`/admin/openings/${id}`);
  const section = page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true });
  const selector = section.getByRole("combobox", { name: "Última actualización del perfil" });
  await expect(selector).toHaveValue("updated_desc");
  const names = section.getByRole("table").locator("tbody tr td:first-child");
  await expect(names).toHaveText(expected("desc"));
  await selector.selectOption("updated_asc");
  await expect(page).toHaveURL(/\?matchOrder=updated_asc#opening-matches$/);
  await expect(names).toHaveText(expected("asc"));
  await section.getByRole("link", { name: "Siguiente", exact: true }).click();
  await expect(page).toHaveURL(/\?matchOrder=updated_asc&matchPage=2#opening-matches$/);
  await expect(names).toHaveText(expected("asc", 12));
  await page.reload();
  await expect(selector).toHaveValue("updated_asc");
  await selector.focus();
  await page.keyboard.press("ArrowUp");
  await expect(page).toHaveURL(/\?matchOrder=updated_desc#opening-matches$/);
  await expect(names).toHaveText(expected("desc"));
  const details = page.getByRole("region", { name: "Oferta y empresa" });
  const decision = page.getByRole("heading", { name: "Decisión municipal sobre la oferta" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const info = await details.boundingBox();
  const moderation = await decision.boundingBox();
  expect(moderation!.x).toBeGreaterThan(info!.x + info!.width);
  const participationLink = details.getByRole("link", { name: "Ver participaciones de esta oferta" });
  await expect(participationLink).toHaveCSS("color", "rgb(255, 255, 255)");
  await participationLink.hover();
  await expect(participationLink).toHaveCSS("color", "rgb(255, 255, 255)");
  await participationLink.focus();
  await expect(participationLink).toBeFocused();
  expect((await new AxeBuilder({ page }).include('[aria-labelledby="opening-details"]').analyze()).violations).toEqual([]);
  expect((await participationLink.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  expect(await participationLink.getAttribute("href")).toBe(`/admin/participations?openingId=${persistedReference("opening", id)}`);
  await page.screenshot({ path: "test-results/admin-opening-desktop.png", fullPage: true });
  await details.screenshot({ path: "test-results/admin-opening-details-desktop.png" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "test-results/admin-opening-mobile.png", fullPage: true });
  await details.screenshot({ path: "test-results/admin-opening-details-mobile.png" });
  const mobileInfo = await details.boundingBox();
  expect((await decision.boundingBox())!.y).toBeGreaterThan(mobileInfo!.y + mobileInfo!.height);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await participationLink.click();
  await expect(page).toHaveURL(new RegExp(`/admin/participations\\?openingId=${persistedReference("opening", id)}$`));
});

test("nomina desde el popup a esta oferta y no vuelve a mostrar al candidato", async ({ page }) => {
  const id = openingId();
  const candidate = runLocalMaintenanceSql(`select pool.id from private.opening_candidate_pool('${id}') pool join public.candidate_profiles candidate on candidate.id=pool.id order by candidate.updated_at desc,pool.display_name,pool.id limit 1`);
  expect(candidate).toMatch(/^[0-9a-f-]{36}$/);
  const referralsBefore = runLocalMaintenanceSql("select count(*) from public.referrals");
  await signIn(page, "admin1@example.invalid", "admin");
  await page.goto(`/admin/openings/${id}`);
  const section = page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true });
  const button = section.getByRole("button", { name: /^Ver perfil de / }).first();
  const name = await button.getAttribute("aria-label");
  expect(name).toBeTruthy();
  await button.click();
  await page.getByRole("dialog").getByRole("button", { name: "Nominar a esta oferta", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(section.getByRole("status")).toContainText("Candidato nominado a esta oferta");
  await expect(section.getByRole("button", { name: name!, exact: true })).toHaveCount(0);
  await page.reload();
  await expect(section.getByRole("button", { name: name!, exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/admin/openings/${persistedReference("opening", id)}$`));
  expect(runLocalMaintenanceSql(`select count(*) from public.participations where candidate_id='${candidate}' and opening_id='${id}' and origin='admin_nomination' and status='under_review'`)).toBe("1");
  expect(runLocalMaintenanceSql("select count(*) from public.referrals")).toBe(referralsBefore);
});

test("empresa ve nuevos rubros seleccionables pero no el matching administrativo", async ({ page }) => {
  const id = openingId();
  await signIn(page, "company1@example.invalid", "company");
  await page.goto(`/admin/openings/${id}`);
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("heading", { name: "Candidatos con rubros coincidentes" })).toHaveCount(0);
  await page.goto("/empresa/ofertas/nueva");
  for (const name of ["Administración", "Comercio", "Tecnología", "Agro"]) {
    await expect(page.getByRole("checkbox", { name, exact: true })).toBeVisible();
  }
  await page.getByRole("checkbox", { name: "Comercio", exact: true }).check();
  await page.getByRole("checkbox", { name: "Tecnología", exact: true }).check();
  await expect(page.getByRole("checkbox", { name: "Comercio", exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "Tecnología", exact: true })).toBeChecked();
});
