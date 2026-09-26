import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { runLocalMaintenanceSql } from "./local-maintenance";
test.use({ trace: "off", screenshot: "off" });
test("importación ficticia: preview sin alta y confirmación explícita", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local");
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/admin/imports/new");
  await expect(page.getByRole("heading", { name: "Importación de demostración" })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const dni = `97${Date.now().toString().slice(-6)}`;
  await page.getByLabel("CSV ficticio").setInputFiles({ name: "demo.csv", mimeType: "text/csv", buffer: Buffer.from(
    `nombre,dni,email,telefono,localidad,categorias,experiencia,disponibilidad,referencia\nPersona CSV,${dni},csv${dni}@example.invalid,,Funes,DEMO-A,Prueba,available,DEMO_1`) });
  await page.getByLabel("Confirmo que contiene solo datos ficticios").check();
  await page.getByRole("button", { name: "Previsualizar" }).click();
  await expect(page.getByText("Listo para confirmar", { exact: true })).toBeVisible();
  const id = page.url().split("/").pop()!;
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  expect(runLocalMaintenanceSql(`select count(*) from public.candidate_private_data where dni_normalized='${dni}'`)).toBe("0");
  await expect(page.getByText(dni, { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Confirmar importación" }).click();
  await expect(page.getByText("Importación completada", { exact: true })).toBeVisible();
  expect(runLocalMaintenanceSql(`select count(*) from public.candidate_private_data where dni_normalized='${dni}'`)).toBe("1");
});

test("duplicados dentro del archivo: bloqueo, rechazo explícito y confirmación concurrente", async ({ page, request }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local");
  expect((await request.post("/api/admin/imports/preview", { data: "csv" })).ok()).toBe(false);
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/admin/imports/new");
  const dni = `96${Date.now().toString().slice(-6)}`;
  const row = `Persona duplicada ficticia,${dni},csv${dni}@example.invalid,,Funes,DEMO-A,Prueba,available,DEMO_2`;
  const csv = `nombre,dni,email,telefono,localidad,categorias,experiencia,disponibilidad,referencia\n${row}\n${row}`;
  await page.getByLabel("CSV ficticio").setInputFiles({ name: "demo.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByLabel("Confirmo que contiene solo datos ficticios").check();
  await page.getByRole("button", { name: "Previsualizar" }).click();
  await expect(page.getByText("Importación bloqueada", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Confirmar importación" })).toBeDisabled();
  await page.getByText("Corregir o resolver fila 2", { exact: true }).click();
  const second = page.getByRole("region", { name: "Fila 2", exact: true });
  await second.getByRole("combobox", { name: "Decisión", exact: true }).selectOption("reject");
  await second.getByLabel("Motivo interno").fill("Fila repetida del ejemplo ficticio");
  await second.getByRole("button", { name: "Guardar decisión y revalidar" }).click();
  await expect(page.getByText("Listo para confirmar", { exact: true })).toBeVisible();
  const id = page.url().split("/").pop()!;
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  const hash = createHash("sha256").update(csv).digest("hex");
  const statuses = await page.evaluate(async ({ id, hash }) => Promise.all([1,2].map(async () => {
    const response = await fetch(`/api/admin/imports/${id}/confirm`, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: 3, hash, mapping: "demo-candidates-v1" }) });
    return response.status;
  })), { id, hash });
  expect(statuses.sort()).toEqual([200,400]);
  await page.reload();
  await expect(page.getByText("Importación completada", { exact: true })).toBeVisible();
  expect(runLocalMaintenanceSql(`select count(*) from public.candidate_private_data where dni_normalized='${dni}'`)).toBe("1");
});

test("fallo transaccional visible y nueva carga vinculada recuperable", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local");
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/admin/imports/new");
  const suffix = Date.now().toString().slice(-5);
  const firstDni = `95${suffix}1`, secondDni = `95${suffix}2`;
  const csv = `nombre,dni,email,telefono,localidad,categorias,experiencia,disponibilidad,referencia\nPersona rollback,${firstDni},a${suffix}@example.invalid,,Funes,DEMO-A,Prueba,available,DEMO_1\nFAIL_E2E_IMPORT,${secondDni},b${suffix}@example.invalid,,Funes,DEMO-B,Prueba,available,DEMO_2`;
  await page.getByLabel("CSV ficticio").setInputFiles({ name: "demo.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
  await page.getByLabel("Confirmo que contiene solo datos ficticios").check();
  await page.getByRole("button", { name: "Previsualizar" }).click();
  await expect(page.getByText("Listo para confirmar", { exact: true })).toBeVisible();
  const failedId = page.url().split("/").pop()!;
  expect(failedId).toMatch(/^[a-f0-9-]{36}$/);
  runLocalMaintenanceSql(`create function private.e2e_import_failure() returns trigger language plpgsql as $$ begin
    if new.display_name='FAIL_E2E_IMPORT' then raise exception 'FICTITIOUS_PRIVATE_ERROR'; end if; return new; end $$;
    create trigger e2e_import_failure before insert on public.candidate_profiles for each row execute function private.e2e_import_failure();`);
  try {
    await page.getByRole("button", { name: "Confirmar importación" }).click();
    await expect(page.getByText("Importación fallida: no se incorporaron cambios", { exact: true })).toBeVisible();
    expect(runLocalMaintenanceSql(`select count(*) from public.candidate_private_data where dni_normalized in ('${firstDni}','${secondDni}')`)).toBe("0");
    await expect(page.getByText("FICTITIOUS_PRIVATE_ERROR")).toHaveCount(0);
  } finally {
    runLocalMaintenanceSql("drop trigger e2e_import_failure on public.candidate_profiles; drop function private.e2e_import_failure();");
  }
  await page.getByRole("link", { name: "Cargar archivo corregido como nuevo intento" }).click();
  await page.getByLabel("CSV ficticio").setInputFiles({ name: "corregido.csv", mimeType: "text/csv", buffer: Buffer.from(csv.replace("FAIL_E2E_IMPORT", "Persona corregida ficticia")) });
  await page.getByLabel("Confirmo que contiene solo datos ficticios").check();
  await page.getByRole("button", { name: "Previsualizar" }).click();
  await expect(page.getByRole("link", { name: "Ver intento anterior" })).toHaveAttribute("href", `/admin/imports/${failedId}`);
  await page.getByRole("button", { name: "Confirmar importación" }).click();
  await expect(page.getByText("Importación completada", { exact: true })).toBeVisible();
  expect(runLocalMaintenanceSql(`select count(*) from public.candidate_private_data where dni_normalized in ('${firstDni}','${secondDni}')`)).toBe("2");
  await page.setViewportSize({ width: 360, height: 800 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: "test-results/import-demo-mobile.png", fullPage: true });
});
