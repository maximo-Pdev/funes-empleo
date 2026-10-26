import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { randomUUID } from "node:crypto";
import { loginFixture } from "./fixtures/quality";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { assertLocalTargets } from "../fixtures/credentials.mjs";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

test("empresa edita publicada, sigue moderación/derivaciones y cancela conservando resultados", async ({ page, browser }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const opening = randomUUID(), draft = randomUUID(), part = randomUUID(), final = randomUUID(), referral = randomUUID();
  const title = `Oferta ficticia gestión ${opening.slice(0, 8)}`, draftTitle = `Borrador ficticio ${draft.slice(0, 8)}`;
  runLocalMaintenanceSql(`begin;
    insert into public.job_openings
    select (jsonb_populate_record(null::public.job_openings,to_jsonb(template)||jsonb_build_object(
      'id',chosen.id,'slug',null,'title',chosen.title,'status',chosen.status,'version',1,'created_at',clock_timestamp(),
      'closing_date',current_date+30))).* from public.job_openings template cross join
      (values('${opening}'::uuid,'${title}','published'),('${draft}'::uuid,'${draftTitle}','draft')) chosen(id,title,status)
      where template.id=private.fixture_id('opening',1);
    insert into public.opening_categories(opening_id,category_id) values('${opening}',private.fixture_id('category',1));
    insert into public.participations
    select (jsonb_populate_record(null::public.participations,to_jsonb(template)||jsonb_build_object(
      'id',chosen.id,'candidate_id',private.fixture_id('profile',chosen.person),'opening_id','${opening}',
      'status',chosen.status,'final_outcome_at',case when chosen.person=2 then now() end))).*
      from public.participations template cross join (values('${part}'::uuid,1,'referred'),('${final}'::uuid,2,'not_selected')) chosen(id,person,status)
      where template.id=private.fixture_id('participation',1);
    insert into public.referrals
    select (jsonb_populate_record(null::public.referrals,to_jsonb(template)||jsonb_build_object(
      'id','${referral}','participation_id','${part}','post_hire_access_until',null))).*
      from public.referrals template where template.id=private.fixture_id('referral',1);
    insert into public.opening_moderation_events(opening_id,decision,previous_status,new_status,company_message,internal_reason,actor_type,actor_account_id,created_at)
      select '${opening}','changes_requested','pending_review','changes_requested','Mensaje ficticio '||n,'Privado ficticio '||n,
      'account',private.fixture_id('admin',1),now()-n*interval '1 hour' from generate_series(1,7) n;
    commit;`);
  const finalBefore = runLocalMaintenanceSql(`select to_jsonb(p)::text from public.participations p where id='${final}';`);
  const slug = runLocalMaintenanceSql(`select slug from public.job_openings where id='${opening}';`);
  const adminContext = await browser.newContext({ baseURL: test.info().project.use.baseURL });
  try {
    const admin = await adminContext.newPage();
    await loginFixture(admin, "admin");
    await admin.goto("/admin/openings");
    await expect(admin.getByRole("link", { name: title, exact: true })).toBeVisible();
    await expect(admin.getByRole("link", { name: draftTitle, exact: true })).toHaveCount(0);
    await expect(admin.getByRole("option", { name: "Borrador", exact: true })).toHaveCount(0);
    await loginFixture(page, "company");
    await page.goto(`/empresa/ofertas/${opening}`);
    await expect(page).toHaveURL(/\/empresa\/ofertas\/ofe-[0-9a-f]{24}$/);
    const companyUrl = page.url();
    await expect(page.getByRole("heading", { name: "Candidatos derivados" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Historial de moderación" })).toBeVisible();
    const history = page.locator('section[aria-labelledby="opening-history"]');
    await expect(history.getByRole("listitem")).toHaveCount(5);
    await expect(page.locator("body")).not.toContainText("Privado ficticio");
    await history.getByRole("button", { name: "Mostrar más" }).click();
    await expect(history.getByRole("listitem")).toHaveCount(7);
    await expect(page.getByRole("button", { name: "Eliminar oferta", exact: true })).toHaveCSS("background-color", "rgb(153, 27, 27)");
    await page.screenshot({ path: test.info().outputPath("oferta-empresa-1440.png"), fullPage: true });
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.getByLabel("Resultado informado").selectOption("other");
    await page.getByLabel("Detalle breve (opcional)").fill("Respuesta ficticia desde la página integrada.");
    await page.getByRole("button", { name: "Enviar informe", exact: true }).click();
    await expect(page.getByText("El resultado informado quedó pendiente de revisión municipal.", { exact: true })).toBeVisible();
    expect(runLocalMaintenanceSql(`select count(*) from public.company_feedback where referral_id='${referral}' and review_status='pending_admin';`)).toBe("1");
    await expect(page.getByLabel("Título", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Información de la oferta" })).toContainText("Tareas ficticias");
    await page.getByRole("button", { name: "Editar oferta", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Editar oferta", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Cancelar edición", exact: true }).click();
    await expect(page.getByRole("button", { name: "Editar oferta", exact: true })).toBeFocused();
    await expect(page.getByLabel("Título", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Editar oferta", exact: true }).click();
    await page.getByLabel("Título", { exact: true }).fill("");
    await page.getByRole("button", { name: "Guardar cambios y enviar a revisión" }).click();
    await expect(page.getByLabel("Título", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Tareas", { exact: true })).toHaveValue("Tareas ficticias");
    await page.getByLabel("Título", { exact: true }).fill(`${title} editada`);
    await page.getByRole("button", { name: "Guardar cambios y enviar a revisión" }).click();
    await expect(page.getByText("Estado:")).toContainText("Pendiente de revisión");
    await expect(page.getByLabel("Título", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Información de la oferta" })).toContainText("Tareas ficticias");
    await expect(page.getByText("Cambios enviados a revisión.", { exact: false })).toBeVisible();
    expect(runLocalMaintenanceSql(`select count(*) from private.public_offer_rows where id='${opening}';`)).toBe("0");
    expect(runLocalMaintenanceSql(`select slug from public.job_openings where id='${opening}';`)).toBe(slug);
    await admin.goto(`/admin/openings/${opening}`);
    await admin.getByLabel("Decisión").selectOption("approved");
    await admin.getByRole("button", { name: "Guardar decisión" }).click();
    await expect(admin.getByText("Publicada", { exact: true })).toBeVisible();
    await page.goto(`/ofertas/${slug}`);
    await expect(page.getByRole("heading", { name: `${title} editada`, exact: true })).toBeVisible();
    await page.goto(companyUrl);
    await page.getByLabel("Motivo de la cancelación").fill("Cancelación ficticia de prueba.");
    await page.getByLabel(/Confirmo que quiero cancelar/).check();
    await page.getByRole("button", { name: "Eliminar oferta", exact: true }).click();
    await expect(page.getByText("Estado:")).toContainText("Cancelada");
    await expect(page.getByRole("button", { name: "Eliminar oferta", exact: true })).toHaveCount(0);
    expect(runLocalMaintenanceSql(`select status from public.participations where id='${part}';`)).toBe("cancelled");
    expect(runLocalMaintenanceSql(`select access_status from public.referrals where id='${referral}';`)).toBe("revoked");
    expect(runLocalMaintenanceSql(`select to_jsonb(p)::text from public.participations p where id='${final}';`)).toBe(finalBefore);
    await page.goto("/empresa/ofertas");
    const card = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: `${title} editada`, exact: true }) });
    await expect(card).toContainText("Cancelada");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(companyUrl);
    await expect(page.getByRole("heading", { level: 1, name: `${title} editada`, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: test.info().outputPath("oferta-cancelada-390.png"), fullPage: true });
  } finally { await adminContext.close(); }
});
