import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { persistedReference } from "./fixtures/record-reference";

test.use({ trace: "off", screenshot: "off" });
test.beforeAll(() => {
  assertLocalTargets();
  expect(runLocalMaintenanceSql("select count(*) from auth.users where email is null or email not like '%@example.invalid'")).toBe("0");
  expect(runLocalMaintenanceSql("select display_name like 'Persona ficticia%' from public.candidate_profiles where id=private.fixture_id('profile',499)")).toBe("t");
  // Idempotent synthetic fixture additions only; no real or hosted data, no deletion.
  runLocalMaintenanceSql(`insert into public.internal_notes(id,candidate_id,note_kind,body,created_by,created_at)
    select private.fixture_id('collection-notes-116',n),private.fixture_id('profile',499),'applicant',
      'Nota ficticia de paginación '||n,private.fixture_id('admin',1),'2026-10-30 12:00:00+00'::timestamptz+n*interval '1 minute'
    from generate_series(1,57)n on conflict(id) do nothing;
    insert into public.contact_events(id,participation_id,channel,direction,occurred_at,summary_internal,recorded_by)
    select private.fixture_id('collection-contacts-116',n),private.fixture_id('participation',997),'phone','inbound',
      '2026-10-30 12:00:00+00'::timestamptz+n*interval '1 minute','Contacto ficticio de paginación '||n,private.fixture_id('admin',1)
    from generate_series(1,7)n on conflict(id) do nothing;
    insert into public.municipal_courses(id,title,url,published,created_by)
    select private.fixture_id('collection-course-116',n),'Curso ficticio de paginación '||lpad(n::text,2,'0'),
      'https://example.invalid/course-'||n,true,private.fixture_id('admin',1)
    from generate_series(1,12)n on conflict(id) do nothing;`);
});

test.beforeEach(async ({ page }) => {
  assertLocalTargets();
  await page.goto("/");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin$/);
});

test("notas: cinco por página y acceso completo a 57 registros conservados", async ({ page }) => {
  test.setTimeout(90000);
  const candidate = persistedReference("candidate", runLocalMaintenanceSql("select private.fixture_id('profile',499)"));
  await page.goto(`/admin/candidates/${candidate}`);
  const notes = page.getByRole("region", { name: "Notas internas", exact: true });
  const records = notes.locator(":scope > ul > li");
  const seen: string[] = [];
  for (let index = 1; index <= 12; index++) {
    await expect(records).toHaveCount(index === 12 ? 2 : 5);
    const entries = await records.allTextContents();
    expect(entries.length).toBe(index === 12 ? 2 : 5);
    seen.push(...entries);
    const next = notes.getByRole("link", { name: "Siguiente", exact: true });
    if (index < 12) { await next.click(); await expect(page).toHaveURL(new RegExp(`notesPage=${index + 1}#candidate-notes$`)); }
    else await expect(next).toHaveCount(0);
  }
  expect(seen).toHaveLength(57); expect(new Set(seen).size).toBe(57);
  expect((await new AxeBuilder({ page }).analyze()).violations.map(item => item.id)).toEqual([]);
  for (const width of [1920, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("contactos muestra cinco y revela los restantes en orden con foco", async ({ page }) => {
  const participation = persistedReference("participation", runLocalMaintenanceSql("select private.fixture_id('participation',997)"));
  await page.goto(`/admin/participations/${participation}`);
  const history = page.getByRole("region", { name: "Historial de contactos", exact: true });
  await expect(history.getByRole("listitem")).toHaveCount(5);
  await history.getByRole("button", { name: "Mostrar más: Historial de contactos" }).click();
  await expect(history.getByRole("listitem")).toHaveCount(7);
  await expect(history.getByRole("listitem").nth(5)).toBeFocused();
  await expect(history.getByRole("button")).toHaveCount(0);
  expect((await history.getByRole("listitem").allTextContents()).map(text => text.match(/Contacto ficticio de paginación (\d)/)?.[1])).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
});

test("ofertas y candidatos conservan filtros y navegan diez registros por página", async ({ page }) => {
  const status = runLocalMaintenanceSql("select status from public.job_openings where status<>'draft' and archived_at is null group by status having count(*)>10 order by count(*) desc,status limit 1");
  expect(status).toMatch(/^[a-z_]+$/);
  const total = Number(runLocalMaintenanceSql(`select count(*) from public.job_openings where status='${status}' and archived_at is null`));
  await page.goto(`/admin/openings?status=${status}`);
  const offers = page.getByRole("region", { name: "Listado de ofertas", exact: true });
  await expect(offers.locator("ul.space-y-3 > li")).toHaveCount(10);
  await offers.getByRole("link", { name: "Siguiente", exact: true }).click();
  await expect(page).toHaveURL(url => url.searchParams.get("status") === status && url.searchParams.get("page") === "2");
  await expect(offers.locator("ul.space-y-3 > li")).toHaveCount(Math.min(10, total - 10));
  await page.goto("/admin/candidates?eligibility=all&pageSize=50");
  await expect(page.locator("tbody tr")).toHaveCount(10);
});

test("cursos pagina diez enlaces en administración, público y candidato", async ({ page }) => {
  for (const [path, label, tag] of [["/admin/courses", "Enlaces municipales", "div"], ["/cursos", "Cursos municipales", "ul"]] as const) {
    await page.goto(path);
    const courses = page.locator(`[data-bounded-list="${label}"]`);
    await expect(courses.locator(`:scope > ${tag} > *`)).toHaveCount(10);
    const first = await courses.locator(`:scope > ${tag} > *`).first().textContent();
    await courses.getByRole("button", { name: "Siguiente", exact: true }).click();
    expect(await courses.locator(`:scope > ${tag} > *`).count()).toBeLessThanOrEqual(10);
    await courses.getByRole("button", { name: "Anterior", exact: true }).click();
    await expect(courses.locator(`:scope > ${tag} > *`).first()).toHaveText(first!);
  }
  // A separate browser context preserves the administrative session.
  const context = await page.context().browser()!.newContext();
  try {
    const candidate = await context.newPage();
    await candidate.goto(new URL("/", page.url()).href);
    await candidate.getByLabel("Correo electrónico").fill("candidate1@example.invalid");
    await candidate.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
    await candidate.getByRole("button", { name: "Ingresar", exact: true }).click();
    await expect(candidate).toHaveURL(/\/dashboard$/);
    await candidate.goto(new URL("/dashboard?section=cursos", page.url()).href);
    const courses = candidate.locator('[data-bounded-list="Cursos municipales"]');
    await expect(courses.locator(":scope > ul > li")).toHaveCount(10);
    await courses.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect(courses.locator(":scope > ul > li").first()).toBeFocused();
    expect((await new AxeBuilder({ page: candidate }).analyze()).violations.map(item => item.id)).toEqual([]);
  } finally { await context.close(); }
});

test("tiempos por oferta pagina diez sin truncar los datos exportados", async ({ page }) => {
  await page.goto("/admin/metrics?from=2026-09-01&to=2026-09-20");
  const durations = page.locator('[data-bounded-list="Tiempos por oferta"]');
  const records = durations.locator(":scope > ul > li");
  await expect(records).toHaveCount(10);
  const seen: string[] = [];
  for (;;) {
    const entries = await records.evaluateAll(elements => elements.map(element => element.getAttribute("data-testid")!));
    expect(entries.length).toBeLessThanOrEqual(10); seen.push(...entries);
    const next = durations.getByRole("button", { name: "Siguiente", exact: true });
    if (await next.isDisabled()) break;
    await next.click();
  }
  expect(seen.length).toBeGreaterThan(10); expect(new Set(seen).size).toBe(seen.length);
  const href = await page.getByRole("link", { name: "Descargar CSV filtrado", exact: true }).getAttribute("href");
  const response = await page.request.get(href!); expect(response.status()).toBe(200);
  const { parse } = await import("csv-parse/sync");
  const rows: { unidad: string }[] = parse(await response.text(), { columns: true, bom: true });
  expect(rows.filter(row => row.unidad === "days")).toHaveLength(seen.length);
});
