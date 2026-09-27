import { expect, test } from "@playwright/test";
import { fixtureId, loginFixture, protectedPages } from "./fixtures/quality";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local ficticio"));
for (const actor of ["anonymous", "candidate", "company", "admin"] as const) {
  test(`${actor}: todas las páginas de otros roles rechazan acceso directo`, async ({ page }) => {
    test.setTimeout(120000);
    if (actor !== "anonymous") await loginFixture(page, actor);
    for (const target of protectedPages().filter((p) => p.role !== actor)) {
      await page.goto(target.path);
      await expect(page).toHaveURL(/\/(account|session-expired|login)$/);
      await expect(page.locator("body")).not.toContainText("Persona ficticia 001");
    }
  });
}
test("handlers privados: denegación anónima y empresarial sin contenido", async ({ page }) => {
  for (const role of ["anonymous", "company"] as const) {
    if (role === "company") await loginFixture(page, role);
    const responses = [
      await page.request.get("/api/admin/exports/operations.csv?from=2026-09-01&to=2026-09-20"),
      await page.request.post("/api/admin/imports/preview", { multipart: {} }),
      await page.request.post("/api/admin/imports/00000000-0000-4000-8000-000000000001/confirm", { data: {} }),
      await page.request.post("/api/candidate/cv", { multipart: {}, maxRedirects: 0 }),
    ];
    for (const response of responses) {
      expect([303, 400, 401, 403]).toContain(response.status());
      expect(await response.text()).not.toMatch(/Persona ficticia|dni_normalized|storage_path|stack trace/i);
    }
  }
});
test("CV ajeno e inexistente son indistinguibles", async ({ page }) => {
  await loginFixture(page, "candidate", 1);
  const foreign = await page.request.get(`/api/cv/${fixtureId("cv", 2)}`);
  const absent = await page.request.get("/api/cv/00000000-0000-4000-8000-000000000001");
  expect(foreign.status()).toBe(404);
  expect(absent.status()).toBe(404);
  expect(await foreign.text()).toBe(await absent.text());
  expect(foreign.headers()["cache-control"]).toContain("no-store");
});
test("sesión administrativa existente no sobrevive a suspensión en base", async ({ page }) => {
  await loginFixture(page, "admin", 4);
  const actor = fixtureId("admin", 4);
  runLocalMaintenanceSql(`update public.accounts set status='suspended', suspended_reason='Prueba ficticia de frontera', suspended_at=clock_timestamp(), suspended_by=(select id from public.accounts where auth_user_id='${fixtureId("admin",1)}') where auth_user_id='${actor}'`);
  try {
    await page.goto("/admin/candidates");
    await expect(page).toHaveURL(/\/account-suspended$/);
    expect((await page.request.get("/api/admin/exports/operations.csv?from=2026-09-01&to=2026-09-20")).status()).toBe(403);
  } finally {
    runLocalMaintenanceSql(`update public.accounts set status='active', suspended_reason=null,suspended_at=null,suspended_by=null where auth_user_id='${actor}'`);
  }
});
test("Server Action en vuelo: suspensión antes de ejecutar impide escritura", async ({ page }) => {
  await loginFixture(page, "candidate", 400);
  await page.goto("/candidato/perfil");
  await expect(page.getByRole("button", { name: "Guardar correcciones", exact: true })).toBeVisible();
  const profile = fixtureId("profile", 400);
  const actor = fixtureId("candidate", 400);
  const before = runLocalMaintenanceSql(`select version from public.candidate_profiles where id='${profile}'`);
  let intercepted = false;
  await page.route("**/candidato/perfil", async (route) => {
    if (route.request().method() === "POST" && route.request().headers()["next-action"]) {
      intercepted = true;
      runLocalMaintenanceSql(`update public.accounts set status='suspended', suspended_reason='Prueba ficticia en vuelo', suspended_at=clock_timestamp(), suspended_by=(select id from public.accounts where auth_user_id='${fixtureId("admin",1)}') where auth_user_id='${actor}'`);
    }
    await route.continue();
  });
  try {
    const response = page.waitForResponse((r) => r.request().method() === "POST" && Boolean(r.request().headers()["next-action"]));
    await page.getByRole("button", { name: "Guardar correcciones", exact: true }).click();
    await response;
    expect(intercepted).toBe(true);
    expect(runLocalMaintenanceSql(`select version from public.candidate_profiles where id='${profile}'`)).toBe(before);
  } finally {
    runLocalMaintenanceSql(`update public.accounts set status='active', suspended_reason=null,suspended_at=null,suspended_by=null where auth_user_id='${actor}'`);
    if (!page.isClosed()) await page.unrouteAll({ behavior: "wait" });
  }
});
