import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginFixture } from "./fixtures/quality";
import { referenceIdentifier } from "./fixtures/record-reference";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { assertLocalTargets } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());
for (const role of [null, "candidate", "company"] as const) {
  test(`apartado presencial protegido para ${role ?? "anónimo"}`, async ({ page }) => {
    if (role) await loginFixture(page, role);
    await page.goto("/admin/atencion-presencial");
    await expect(page).not.toHaveURL(/\/admin\/atencion-presencial/);
    await expect(page.getByRole("navigation", { name: "Navegación de Oficina de Empleo" })).toHaveCount(0);
  });
}

test("menú, alta activa, filtros, paginación y detalle reutilizan perfiles sin duplicarlos", async ({ page }) => {
  test.setTimeout(90_000);
  await loginFixture(page, "admin");
  const menu = page.getByRole("navigation", { name: "Navegación de Oficina de Empleo" });
  await menu.getByRole("link", { name: "Perfil asistido", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/atencion-presencial$/);
  await expect(menu.getByRole("link", { name: "Perfil asistido", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Aptitud para derivación", { exact: true })).toHaveValue("all");
  const suffix = Date.now().toString().slice(-5);
  const name = `Mesa presencial E2E ${suffix}`;
  const before = Number(runLocalMaintenanceSql("select count(*) from public.candidate_profiles"));
  await page.getByLabel("Búsqueda por palabra", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Buscar candidatos" }).click();
  await expect(page.getByText("Sin perfiles de atención presencial")).toBeVisible();
  let firstReference = "";
  for (const number of [1, 2]) {
    await expect(page).toHaveURL(/\/admin\/atencion-presencial(?:\?|$)/);
    await expect(page.getByRole("heading", { name: "Crear perfil asistido", exact: true })).toBeVisible();
    await page.getByLabel("Nombre y apellido").fill(`${name} ${number}`);
    await page.getByLabel("DNI", { exact: true }).fill(`96${suffix}${number}`);
    await page.getByLabel("Teléfono", { exact: true }).fill("3410000000");
    await page.getByLabel("Localidad laboral", { exact: true }).fill("Funes");
    await page.getByLabel("Habilidades y experiencia", { exact: true }).fill("Experiencia presencial ficticia");
    await page.getByRole("combobox", { name: "Categorías laborales", exact: true }).click();
    await page.getByRole("option", { name: number === 1 ? "Categoría ficticia A" : "Categoría ficticia B" }).click();
    await page.keyboard.press("Escape");
    const acceptance = page.getByLabel(/Confirmo que la persona leyó y aceptó/);
    await expect(acceptance).not.toBeChecked();
    await acceptance.check();
    await page.getByRole("button", { name: "Comprobar duplicados y guardar" }).click();
    await expect(page).toHaveURL(/\/admin\/candidates\/can-[0-9a-f]{24}$/);
    if (number === 1) firstReference = new URL(page.url()).pathname.split("/").pop()!;
    const back = page.getByRole("link", { name: "Volver a perfil asistido", exact: true });
    await expect(back).toHaveAttribute("href", "/admin/atencion-presencial");
    await back.click();
  }
  await page.goto(`/admin/atencion-presencial?term=${encodeURIComponent(name)}&pageSize=1`);
  const results = page.getByRole("region", { name: "Perfiles de atención presencial" });
  await expect(results.getByRole("heading", { name: "Perfiles: 2", exact: true })).toBeVisible();
  await expect(results.getByText("Activo", { exact: true })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Siguiente", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/atencion-presencial\?.*page=2/);
  await expect(results.getByRole("link", { name: `${name} 2`, exact: true })).toBeVisible();
  await page.getByLabel("Categorías", { exact: true }).click();
  await page.getByRole("option", { name: "Categoría ficticia A" }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Buscar candidatos" }).click();
  await expect(page).toHaveURL(/categoryId=rub-[0-9a-f]{24}/);
  await expect(results.getByRole("heading", { name: "Perfiles: 1", exact: true })).toBeVisible();
  const profile = results.getByRole("link", { name: `${name} 1`, exact: true });
  await expect(profile).toHaveAttribute("href", `/admin/candidates/${firstReference}`);
  await profile.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${name} 1`);
  await expect(page.getByRole("heading", { name: "Mantener perfil", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Activación", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vincular cuenta presencialmente", exact: true })).toBeVisible();
  await expect(menu.getByRole("link", { name: "Perfil asistido", exact: true })).toHaveAttribute("aria-current", "page");
  const id = referenceIdentifier("candidate", firstReference);
  expect(runLocalMaintenanceSql(`select origin from public.candidate_profiles where id='${id}'`)).toBe("assisted");
  expect(runLocalMaintenanceSql(`select status from public.candidate_profiles where id='${id}'`)).toBe("active");
  expect(runLocalMaintenanceSql(`select count(*) from public.candidate_consents where candidate_id='${id}' and status='accepted' and source='assisted'`)).toBe("1");
  expect(Number(runLocalMaintenanceSql("select count(*) from public.candidate_profiles"))).toBe(before + 2);
});
