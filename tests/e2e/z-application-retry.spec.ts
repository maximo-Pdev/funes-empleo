import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
test.use({ trace: "off", screenshot: "off" });
const fixture = (kind: string, n: number) => {
  const hash = createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex");
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
};
async function prepare(page: Page, n: number, title: string) {
  assertLocalTargets();
  const profile = fixture("profile", n), opening = fixture(`retry-${Date.now()}`, n);
  runLocalMaintenanceSql(`update public.candidate_profiles set status='active',availability='available',refresh_due_at=clock_timestamp()+interval '6 months' where id='${profile}';
    insert into public.job_openings select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
    'id','${opening}','slug',null,'title','${title}','status','published','version',1,
    'closing_date','2099-01-02','published_at',clock_timestamp(),'archived_at',null))).*
    from public.job_openings t where t.id=private.fixture_id('opening',1);`);
  await page.goto("/"); await page.getByLabel("Correo electrónico").fill(`candidate${n}@example.invalid`);
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Ingresar", exact: true }).click(); await expect(page).toHaveURL(/\/dashboard$/);
  const slug = runLocalMaintenanceSql(`select slug from public.job_openings where id='${opening}'`);
  const version = runLocalMaintenanceSql(`select version from public.candidate_profiles where id='${profile}'`);
  return { profile, opening, slug, version };
}
test("retirar y volver a postular conserva caso y CV anteriores y muestra rojo", async ({ page }) => {
  const title = "Oferta ficticia de nuevo intento";
  const { profile, opening, slug } = await prepare(page,488,title);
  const chosen = page.getByRole("region", { name: "Oferta elegida", exact: true });
  await page.goto(`/dashboard?section=ofertas&oferta=${slug}`);
  await expect(chosen).toContainText("Cierre: 02/01/2099");
  await chosen.getByRole("button", { name: "Postularme", exact: true }).click();
  await expect(chosen.getByRole("button", { name: "Participación registrada", exact: true })).toBeDisabled();
  const first = runLocalMaintenanceSql(`select id from public.participations where candidate_id='${profile}' and opening_id='${opening}'`);
  const originalCv = runLocalMaintenanceSql(`select application_cv_document_id from public.participations where id='${first}'`);
  await page.goto("/dashboard?section=postulaciones");
  const card = page.locator("li").filter({ has: page.getByRole("heading", { name:title, exact:true }) });
  await card.getByLabel("Confirmo que quiero retirar esta participación.").check();
  await card.getByRole("button", { name:"Retirar participación",exact:true }).click();
  await expect(card.locator("span.border-status-red")).toHaveText("Retirada");
  await page.goto(`/dashboard?section=ofertas&oferta=${slug}`);
  await expect(chosen.getByRole("button", { name:"Postularme",exact:true })).toBeEnabled();
  await chosen.getByText("Usar otro CV para esta oferta",{exact:true}).click();
  await chosen.getByLabel("CV específico para esta oferta (opcional)").setInputFiles({name:"reintento-ficticio.pdf",mimeType:"application/pdf",buffer:readFileSync("tests/fixtures/cv-fictitious.pdf")});
  await chosen.getByRole("button", { name:"Postularme",exact:true }).click();
  await expect(chosen.getByRole("button", { name:"Participación registrada",exact:true })).toBeDisabled();
  await page.goto("/dashboard?section=postulaciones");
  await expect(card).toHaveCount(2);
  await expect(card.filter({hasText:"Retirada"})).toContainText(/Recibida: \d{2}\/\d{2}\/\d{4}/);
  await expect(card.filter({has:page.locator("p").filter({hasText:/^Estado:/}).getByText("Recibida por la Oficina",{exact:true})})).toContainText("reintento-ficticio.pdf");
  expect(runLocalMaintenanceSql(`select status::text||':'||application_cv_document_id::text from public.participations where id='${first}'`)).toBe(`withdrawn:${originalCv}`);
  expect(runLocalMaintenanceSql(`select count(*) from public.participations where candidate_id='${profile}' and opening_id='${opening}' and status<>'withdrawn'`)).toBe("1");
  for (const width of [390,1440]) {
    await page.setViewportSize({width,height:900});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  }
});
test("dos reintentos simultáneos después de retirar crean un solo caso", async ({ page }) => {
  const { profile, opening, version } = await prepare(page,487,"Oferta ficticia reintento simultaneo");
  const request = () => page.context().request.post("/api/candidate/applications", {
    headers:{Origin:process.env.NEXT_PUBLIC_APP_URL!}, multipart:{openingId:opening,candidateVersion:version},
  });
  expect((await request()).status()).toBe(200);
  await page.goto("/dashboard?section=postulaciones");
  const card = page.locator("li").filter({has:page.getByRole("heading",{name:"Oferta ficticia reintento simultaneo",exact:true})});
  await card.getByLabel("Confirmo que quiero retirar esta participación.").check();
  await card.getByRole("button",{name:"Retirar participación",exact:true}).click(); await expect(card).toContainText("Retirada");
  const responses = await Promise.all([request(),request()]);
  expect(responses.map(r=>r.status()).sort()).toEqual([200,422]);
  expect(runLocalMaintenanceSql(`select count(*) from public.participations where candidate_id='${profile}' and opening_id='${opening}'`)).toBe("2");
  expect(runLocalMaintenanceSql(`select count(*) from public.audit_events where action='participation_created' and entity_id in(select id from public.participations where candidate_id='${profile}' and opening_id='${opening}')`)).toBe("2");
});
