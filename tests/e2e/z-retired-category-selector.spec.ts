import { expect, test } from "@playwright/test";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test("métricas omite A/B retiradas sin quitar rubros reales", async ({ page }) => {
  assertLocalTargets();
  // This modifies only synthetic fixture flags, restoring them even on failure.
  expect(runLocalMaintenanceSql("select count(*) from auth.users where email is null or email not like '%@example.invalid'")).toBe("0");
  const previous: { code: string; active: boolean }[] = JSON.parse(runLocalMaintenanceSql("select jsonb_agg(jsonb_build_object('code',code,'active',active) order by code) from public.job_categories where version=1 and code in ('DEMO-A','DEMO-B')"));
  expect(previous.map(row => row.code)).toEqual(["DEMO-A", "DEMO-B"]);
  expect(previous.every(row => typeof row.active === "boolean")).toBe(true);
  try {
    runLocalMaintenanceSql("update public.job_categories set active=false where version=1 and code in ('DEMO-A','DEMO-B')");
    await page.goto("/");
    await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
    await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await page.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await page.goto("/admin/metrics");
    const categories = page.getByRole("combobox", { name: "Categoría", exact: true });
    await expect(categories.getByRole("option", { name: /Categoría ficticia [AB]/ })).toHaveCount(0);
    await expect(categories.getByRole("option", { name: "Administración (ADMINISTRACION, v2)", exact: true })).toHaveCount(1);
  } finally {
    runLocalMaintenanceSql(`update public.job_categories set active=case code when 'DEMO-A' then ${previous[0]!.active} else ${previous[1]!.active} end where version=1 and code in ('DEMO-A','DEMO-B')`);
  }
});
