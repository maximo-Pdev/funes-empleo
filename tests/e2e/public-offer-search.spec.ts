import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { z } from "zod";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

test("búsqueda pública: cuatro filtros, teclado, paginación persistente y limpiar", async ({ page }) => {
  await page.goto("/ofertas?page=2");
  const { rubro: category, localidad: locality, modalidad: modality } = z.object({ rubro: z.string(), localidad: z.string(), modalidad: z.string() }).parse(JSON.parse(runLocalMaintenanceSql(
    "select jsonb_build_object('rubro',j.code,'localidad',lower(btrim(o.location)),'modalidad',lower(btrim(o.modality))) from private.public_offer_rows o join public.opening_categories oc on oc.opening_id=o.id join public.job_categories j on j.id=oc.category_id where j.active and strpos(lower(o.title),'oferta ficticia')>0 group by j.code,lower(btrim(o.location)),lower(btrim(o.modality)) having count(distinct o.id)>10 order by count(distinct o.id) desc,j.code limit 1"
  )));
  await page.getByLabel("Buscar por texto", { exact: true }).fill("Oferta ficticia");
  await page.getByLabel("Rubro", { exact: true }).selectOption(category);
  await page.getByLabel("Localidad", { exact: true }).selectOption(locality);
  await page.getByLabel("Modalidad", { exact: true }).selectOption(modality);
  await page.getByRole("button", { name: "Buscar ofertas", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(url => url.pathname === "/ofertas" && url.searchParams.get("q") === "Oferta ficticia" && !url.searchParams.has("page"));
  await expect(page.getByLabel("Buscar por texto", { exact: true })).toHaveValue("Oferta ficticia");
  await expect(page.getByRole("heading", { name: "Ofertas laborales vigentes", exact: true })).toBeVisible();
  const firstUrl = new URL(page.url());
  expect(firstUrl.searchParams.get("page")).toBeNull();
  expect(firstUrl.searchParams.get("rubro")).toBe(category);
  const next = page.getByRole("navigation", { name: "Páginas de ofertas", exact: true }).getByRole("link", { name: "Siguiente", exact: true });
  await expect(next).toBeVisible();
  await expect(page.getByRole("link", { name: "Página 1", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("link", { name: "Página 2", exact: true })).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/page=2$/);
  await expect(page.getByRole("link", { name: "Página 2", exact: true })).toHaveAttribute("aria-current", "page");
  const url = new URL(page.url());
  expect(url.searchParams.get("q")).toBe("Oferta ficticia");
  expect(url.searchParams.get("rubro")).toBe(category);
  expect(url.searchParams.get("localidad")).toBe(locality);
  expect(url.searchParams.get("modalidad")).toBe(modality);
  for (const link of await page.locator('li a[href^="/ofertas/"]').all()) {
    await expect(link).toHaveAttribute("href", /^\/ofertas\/[a-z0-9-]+-[a-f0-9]{12}$/);
  }
  await page.reload();
  await expect(page.getByLabel("Rubro", { exact: true })).toHaveValue(category);
  await page.getByRole("link", { name: "Limpiar filtros", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/ofertas");
  await expect(page.getByLabel("Buscar por texto", { exact: true })).toHaveValue("");
  await page.setViewportSize({ width: 360, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

test("búsqueda pública: texto literal vacío de resultados y parámetros inválidos", async ({ page }) => {
  await page.goto("/ofertas?q=%25_");
  await expect(page.getByText("No encontramos ofertas con esos filtros.", { exact: true })).toBeVisible();
  await expect(page.locator('li a[href^="/ofertas/"]')).toHaveCount(0);
  await page.goto("/ofertas?q=uno&q=dos");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Revisá los filtros");
  await expect(page.locator('li a[href^="/ofertas/"]')).toHaveCount(0);
  await page.goto("/ofertas?q=" + "x".repeat(121));
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Revisá los filtros");
});

test("búsqueda pública: título de oferta cerrada no aparece como resultado", async ({ page }) => {
  const title = runLocalMaintenanceSql("select title from public.job_openings where status='closed' and archived_at is null order by id limit 1");
  if (!title) throw new Error("Falta oferta cerrada ficticia.");
  await page.goto(`/ofertas?${new URLSearchParams({ q: title })}`);
  await expect(page.getByText("No encontramos ofertas con esos filtros.", { exact: true })).toBeVisible();
  await expect(page.locator('li a[href^="/ofertas/"]')).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Navegación principal", exact: true }).getByRole("link", { name: "Inicio", exact: true })).toHaveAttribute("href", "/");
  await expect(page.getByRole("navigation", { name: "Navegación principal", exact: true }).getByRole("link", { name: "Ingresar", exact: true })).toHaveAttribute("href", "/#contenido");
  await expect(page.getByRole("complementary")).toHaveCount(0);
});
