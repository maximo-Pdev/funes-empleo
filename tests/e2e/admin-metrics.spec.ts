import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { parse } from "csv-parse/sync";
import { runLocalMaintenanceSql } from "./local-maintenance";
const fixtureId = (kind: string, n: number) => {
  const h = createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex");
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
};
test.use({ trace: "off", screenshot: "off" });
test("administración: fixture exacto, filtros, tiempos y CSV en menos de 30 segundos", async ({ page }) => {
  test.setTimeout(60000);
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local");
  expect(runLocalMaintenanceSql("select (select count(*) from public.candidate_profiles)||','||(select count(*) from public.company_profiles)||','||(select count(*) from public.job_openings)||','||(select count(*) from public.participations)" )).toBe("500,50,100,1000");
  const auditBefore = Number(runLocalMaintenanceSql("select count(*) from private.metrics_exports"));
  runLocalMaintenanceSql(`update public.job_openings set title='=OFERTA FICTICIA' where id='${fixtureId("opening",2)}'`);
  try {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto("/admin/metrics?from=invalido");
  await expect(page.getByRole("heading", { name: "Métricas operativas" })).toBeVisible();
  await page.getByLabel("Desde", { exact: true }).fill("2026-09-01");
  await page.getByLabel("Hasta", { exact: true }).fill("2026-09-20");
  await page.getByRole("combobox", { name: "Categoría", exact: true }).selectOption(fixtureId("category",1));
  const started = Date.now();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByTestId("metric-active_candidates").locator("dd")).toHaveText("200");
  await expect(page.getByTestId("metric-companies").locator("dd")).toHaveText("50");
  await expect(page.getByTestId("metric-applications").locator("dd")).toHaveText("500");
  await expect(page.getByTestId("metric-hired").locator("dd")).toHaveText("25");
  await expect(page.getByTestId(`duration-first_hire_days-${fixtureId("opening",22)}`)).toContainText("10 días");
  await expect(page.getByTestId(`duration-coverage_days-${fixtureId("opening",22)}`)).toContainText("Pendiente");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar CSV filtrado" }).click();
  const file = await download;
  expect(await file.failure()).toBeNull();
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  expect(Date.now() - started).toBeLessThan(30000);
  const csv = Buffer.concat(chunks).toString("utf8");
  const rows: Record<string,string>[] = parse(csv, { columns: true, bom: true });
  expect(rows.find((r) => r.indicador === "active_candidates")?.valor).toBe("200");
  expect(rows.find((r) => r.indicador === "companies")?.categoria_codigo).toBe("");
  expect(rows.filter((r) => r.unidad === "days")).toHaveLength(100);
  expect(rows.find((r) => r.indicador === "coverage_days" && r.oferta_codigo === fixtureId("opening",22))?.valor).toBe("");
  expect(rows.every((r) => r.periodo_desde === "2026-09-01" && r.periodo_hasta === "2026-09-20")).toBe(true);
  expect(rows.filter((r) => r.unidad !== "days").every((r) => !r.oferta_codigo && !r.oferta_titulo)).toBe(true);
  expect(csv).toContain("'=OFERTA FICTICIA");
  expect(csv).not.toMatch(/Persona ficticia|@example.invalid|dni|summary_internal/);
  expect(Number(runLocalMaintenanceSql("select count(*) from private.metrics_exports"))).toBe(auditBefore + 1);
  expect(runLocalMaintenanceSql("select count(*) from public.audit_events e join private.metrics_exports x on x.id=e.entity_id and x.request_id=e.request_id where e.action='metrics_exported' and e.actor_account_id=x.actor_id and x.period_from='2026-09-01' and x.period_to='2026-09-20'")).not.toBe("0");
  await page.setViewportSize({ width: 360, height: 800 });
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/metrics-mobile.png" });
  } finally {
    runLocalMaintenanceSql(`update public.job_openings set title='Oferta ficticia 002' where id='${fixtureId("opening",2)}'`);
  }
});

test("métricas: rechazo anónimo, empresarial y filtros inválidos", async ({ page, request }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local");
  const url = "/api/admin/exports/operations.csv?from=2026-09-01&to=2026-09-20";
  expect((await request.get(url)).status()).toBe(403);
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("company1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  const denied = await page.request.get(url);
  expect(denied.status()).toBe(403);
  expect(denied.headers()["cache-control"]).toBe("private, no-store");
  expect(await denied.text()).not.toMatch(/Persona|Oferta ficticia|SELECT|stack/);
  await page.goto("/admin/metrics");
  await expect(page).toHaveURL(/\/account$/);
});

test("seguimiento: canales cronológicos y plantillas sin envío", async ({ page }) => {
  test.skip(!process.env.NEXT_PUBLIC_SUPABASE_URL?.startsWith("http://127.0.0.1:54321"), "Solo fixture local");
  runLocalMaintenanceSql(`insert into public.contact_events(participation_id,channel,direction,occurred_at,summary_internal,next_action_at,recorded_by)
    select '${fixtureId("participation",1)}',channel,'outbound','2026-09-20 12:00+00'::timestamptz + n*interval '1 hour',
      'Seguimiento ficticio '||n,'2026-09-28 12:00+00','${fixtureId("admin",1)}'
    from (values (1,'phone'),(2,'email'),(3,'whatsapp'),(4,'in_person')) v(n,channel)
    where not exists(select 1 from public.contact_events c where c.participation_id='${fixtureId("participation",1)}' and c.summary_internal='Seguimiento ficticio '||n)`);
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin1@example.invalid");
  await page.getByLabel("Contraseña", { exact: true }).fill("Fictitious-Local-Only-2026!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/account$/);
  await page.goto(`/admin/participations/${fixtureId("participation",1)}`);
  const timeline = page.getByRole("region", { name: "Historial de contactos" });
  await expect(timeline.locator("li")).toHaveCount(4);
  await expect(timeline.locator("li").first()).toContainText("Teléfono");
  await expect(timeline.locator("li").last()).toContainText("Presencial");
  await expect(timeline.locator("li").first()).toContainText("Próximo seguimiento");
  await page.getByLabel("Tipo de mensaje").selectOption("appointment");
  await expect(page.getByLabel("Texto editable")).toHaveValue(/coordinar/);
  await expect(page.getByText("No se envían mensajes desde el portal.", { exact: false })).toBeVisible();
});
