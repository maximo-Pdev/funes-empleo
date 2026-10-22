import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
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
  await signIn(page, "admin1@example.invalid");
  await page.goto(`/admin/openings/${id}`);
  const section = page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true });
  await expect(section.getByText(/comparten al menos un rubro/)).toBeVisible();
  await expect(section.getByText(/^Coincidencias: [1-9]\d*/)).toBeVisible();
  const cards = section.getByRole("listitem");
  await expect(cards).toHaveCount(12);
  const firstCard = await cards.nth(0).boundingBox();
  const secondCard = await cards.nth(1).boundingBox();
  expect(secondCard!.x).toBeGreaterThan(firstCard!.x);
  expect(secondCard!.y).toBe(firstCard!.y);
  const firstNames = await section.getByRole("heading", { level: 3 }).allTextContents();
  expect(new Set(firstNames).size).toBe(firstNames.length);
  const next = section.getByRole("link", { name: "Siguiente", exact: true });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(new RegExp(`/admin/openings/${id}\\?matchPage=2#opening-matches$`));
  await expect(section.getByText(/Página 2 de/)).toBeVisible();
  const secondNames = await section.getByRole("heading", { level: 3 }).allTextContents();
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
  expect((await new AxeBuilder({ page }).include("dialog[open]").analyze()).violations).toEqual([]);
  expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(evaluate).toBeFocused();
  expect(runLocalMaintenanceSql("select jsonb_build_object('participations',(select count(*) from public.participations),'referrals',(select count(*) from public.referrals))")).toBe(before);
});

test("matching inválido y vacío se explican sin ampliar resultados", async ({ page }) => {
  const id = openingId();
  await signIn(page, "admin1@example.invalid");
  await page.goto(`/admin/openings/${id}?matchPage=1&matchPage=2`);
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Revisá la página de coincidencias");
  await page.goto(`/admin/openings/${id}?matchPage=10000`);
  await expect(page.getByText("Sin candidatos en esta página", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Volver a la primera página", exact: true }).click();
  await expect(page.getByRole("region", { name: "Candidatos con rubros coincidentes", exact: true }).getByText(/^Coincidencias:/)).toBeVisible();
});

test("nomina desde el popup a esta oferta y no vuelve a mostrar al candidato", async ({ page }) => {
  const id = openingId();
  const candidate = runLocalMaintenanceSql(`select id from private.opening_candidate_pool('${id}') order by display_name,id limit 1`);
  expect(candidate).toMatch(/^[0-9a-f-]{36}$/);
  const referralsBefore = runLocalMaintenanceSql("select count(*) from public.referrals");
  await signIn(page, "admin1@example.invalid");
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
  await expect(page).toHaveURL(new RegExp(`/admin/openings/${id}$`));
  expect(runLocalMaintenanceSql(`select count(*) from public.participations where candidate_id='${candidate}' and opening_id='${id}' and origin='admin_nomination' and status='under_review'`)).toBe("1");
  expect(runLocalMaintenanceSql("select count(*) from public.referrals")).toBe(referralsBefore);
});

test("empresa ve nuevos rubros seleccionables pero no el matching administrativo", async ({ page }) => {
  const id = openingId();
  await signIn(page, "company1@example.invalid");
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
