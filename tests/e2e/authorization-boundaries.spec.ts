import { expect, test } from "@playwright/test";
import { fixtureId, loginFixture, protectedPages } from "./fixtures/quality";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { readFileSync } from "node:fs";

const deniedMessage = /No tenés permiso|Iniciá sesión|No encontramos el recurso solicitado o no tenés acceso a él/;
for (const role of ["candidate", "company", "admin"] as const) {
  test(`${role}: sesión suspendida rechazada por todas sus páginas y handlers`, async ({ page }) => {
    test.setTimeout(120000);
    const n = role === "admin" ? 4 : role === "candidate" ? 400 : 40;
    await loginFixture(page, role, n);
    const actor = fixtureId(role, n);
    const baseline = runLocalMaintenanceSql("select count(*) from public.audit_events");
    runLocalMaintenanceSql(`update public.accounts set status='suspended', suspended_reason='Prueba ficticia', suspended_at=clock_timestamp(), suspended_by='${fixtureId("admin",1)}' where id='${actor}'`);
    try {
      for (const target of protectedPages().filter(p => p.role === role)) {
        await page.goto(target.path);
        await expect(page).toHaveURL(/\/(account-suspended|session-expired)$/);
      }
      const exportResponse = await page.request.get("/api/admin/exports/operations.csv?from=2026-09-01&to=2026-09-20");
      expect(exportResponse.status()).toBe(403);
      const headers = { Origin: "http://127.0.0.1:3000", "x-fictional-data": "true", "Content-Type": "text/csv" };
      for (const response of [
        await page.request.post("/api/admin/imports/preview", { data: "dni,nombre\n99000001,Prueba", headers }),
        await page.request.post("/api/admin/imports/00000000-0000-4000-8000-000000000001/confirm", { data: "{}", headers }),
      ]) {
        expect(response.status()).toBe(400);
        expect(await response.text()).toMatch(deniedMessage);
        expect(response.headers()["cache-control"]).toContain("no-store");
      }
      const upload = await page.request.post("/api/candidate/cv", { multipart: { candidateId: fixtureId("profile", n), version: "1",
        cv: { name: "cv-ficticio.pdf", mimeType: "application/pdf", buffer: readFileSync("tests/fixtures/cv-fictitious.pdf") } }, maxRedirects: 0 });
      expect(upload.status()).toBe(303);
      expect(upload.headers().location).toContain("/login?cv=denied");
      const cv = await page.request.get(`/api/cv/${fixtureId("cv", 1)}`);
      expect([401,403,404]).toContain(cv.status());
      expect(cv.headers()["cache-control"]).toContain("no-store");
      expect(await cv.text()).not.toContain("%PDF-");
      expect(runLocalMaintenanceSql("select count(*) from public.audit_events")).toBe(baseline);
    } finally {
      runLocalMaintenanceSql(`update public.accounts set status='active', suspended_reason=null, suspended_at=null, suspended_by=null where id='${actor}'`);
    }
  });
}

test("empresa: oferta y derivación ajenas e inexistentes muestran el mismo NOT_FOUND", async ({ page }) => {
  await loginFixture(page, "company", 1);
  for (const path of ["/empresa/ofertas/", "/company/openings/"]) {
    const suffix = path.includes("/company/") ? "/referrals" : "";
    const foreign = await page.goto(`${path}${fixtureId("opening",2)}${suffix}`);
    await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
    const foreignText = await page.locator("body").innerText();
    const absent = await page.goto(`${path}00000000-0000-4000-8000-000000000001${suffix}`);
    await expect(page.getByRole("heading", { name: "No encontramos la página", exact: true })).toBeVisible();
    // Next returns 200 once streaming starts, otherwise 404. Both IDs must behave alike.
    expect([200, 404]).toContain(foreign?.status());
    expect(absent?.status()).toBe(foreign?.status());
    await expect(page.locator('head meta[name="robots"]')).toHaveAttribute("content", "noindex");
    expect(await page.locator("body").innerText()).toBe(foreignText);
    expect(foreignText).not.toMatch(/Persona ficticia|Oferta ficticia|candidate|storage_path/);
  }
});

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
test("handlers administrativos: anónimo, candidato y empresa sin permiso ni contenido", async ({ page }) => {
  for (const role of ["anonymous", "candidate", "company"] as const) {
    await page.context().clearCookies();
    if (role !== "anonymous") await loginFixture(page, role);
    const headers = { Origin: "http://127.0.0.1:3000", "x-fictional-data": "true", "Content-Type": "text/csv" };
    const responses = [
      await page.request.get("/api/admin/exports/operations.csv?from=2026-09-01&to=2026-09-20"),
      await page.request.post("/api/admin/imports/preview", { data: "dni,nombre\n99000001,Prueba", headers }),
      await page.request.post("/api/admin/imports/00000000-0000-4000-8000-000000000001/confirm", { data: "{}", headers }),
    ];
    expect(responses[0]?.status()).toBe(403);
    for (const response of responses.slice(1)) {
      expect(response.status()).toBe(400);
      expect(await response.text()).toMatch(deniedMessage);
    }
    for (const response of responses) {
      expect(response.headers()["cache-control"]).toContain("no-store");
      expect(await response.text()).not.toMatch(/Persona ficticia|dni_normalized|storage_path|stack trace/i);
    }
    if (role !== "candidate") {
      const upload = await page.request.post("/api/candidate/cv", { multipart: {}, maxRedirects: 0 });
      expect(upload.status()).toBe(303);
      expect(upload.headers().location).toContain("cv=denied");
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
