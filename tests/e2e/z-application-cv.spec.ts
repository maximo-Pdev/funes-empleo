import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import sharp from "sharp";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { persistedReference } from "./fixtures/record-reference";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
test.use({ trace: "off", screenshot: "off" });
const fixture = (kind: string, n: number) => {
  const hash = createHash("md5").update(`funes-demo-v1:${kind}:${n}`).digest("hex");
  return `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
};
async function login(page: Page, email: string, role: "candidate" | "admin" | "company") {
  await page.goto("/"); await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await expect(page).toHaveURL({ candidate: /\/dashboard$/, admin: /\/account$/, company: /\/empresa$/ }[role]);
}
test("CV opcional por oferta, imágenes, general independiente y acceso exacto por derivación", async ({ page, browser }) => {
  test.setTimeout(120_000); assertLocalTargets();
  const profile = fixture("profile",490);
  const scope = `image-cv-e2e-${Date.now()}`;
  const offers = [1,2,3].map(n => fixture(scope,n));
  runLocalMaintenanceSql(`update public.candidate_profiles set status='active',availability='available',refresh_due_at=clock_timestamp()+interval '6 months' where id='${profile}';
    insert into public.job_openings select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
    'id',private.fixture_id('${scope}',n),'slug',null,'title','Oferta CV específica ficticia '||n,'status','published','version',1,
    'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),
    'closing_date',current_date+20,'published_at',clock_timestamp(),'archived_at',null))).*
    from public.job_openings t cross join generate_series(1,3) n where t.id=private.fixture_id('opening',1);`);
  const slugs = offers.map(id => runLocalMaintenanceSql(`select slug from public.job_openings where id='${id}'`));
  const initialGeneral = runLocalMaintenanceSql(`select id from public.cv_documents where candidate_id='${profile}' and opening_id is null and status='valid' and archived_at is null`);
  const png = await sharp({ create: { width:600,height:900,channels:3,background:"#fff" } }).png().toBuffer();
  const jpeg = await sharp({ create: { width:900,height:600,channels:3,background:"#fff" } }).jpeg().toBuffer();
  await login(page,"candidate490@example.invalid","candidate");
  await page.goto(`/dashboard?section=ofertas&oferta=${slugs[0]}`);
  const chosen = page.getByRole("region",{ name:"Oferta elegida",exact:true });
  await chosen.getByText("Usar otro CV para esta oferta",{exact:true}).click();
  const input = chosen.getByLabel("CV específico para esta oferta (opcional)");
  await expect(input).not.toHaveAttribute("accept",/webp/);
  await input.setInputFiles({name:"ficticio.png",mimeType:"image/png",buffer:Buffer.from("corrupt fictitious image")});
  await chosen.getByRole("button",{name:"Postularme",exact:true}).click();
  await expect(input).toHaveAttribute("aria-invalid","true");
  expect(await input.evaluate(node=>(node as HTMLInputElement).files?.[0]?.name)).toBe("ficticio.png");
  await input.setInputFiles({name:"oferta-uno.png",mimeType:"image/png",buffer:png});
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:"test-results/application-cv-mobile.png",fullPage:true});
  await page.setViewportSize({width:1440,height:900});
  await chosen.getByRole("button",{name:"Postularme",exact:true}).focus(); await page.keyboard.press("Enter");
  await expect(chosen.getByRole("button",{name:"Participación registrada",exact:true})).toBeDisabled();
  await page.goto(`/dashboard?section=ofertas&oferta=${slugs[1]}`);
  await chosen.getByText("Usar otro CV para esta oferta",{exact:true}).click();
  await chosen.getByLabel("CV específico para esta oferta (opcional)").setInputFiles({name:"oferta-dos.jpg",mimeType:"image/jpeg",buffer:jpeg});
  await chosen.getByRole("button",{name:"Postularme",exact:true}).click();
  await expect(chosen.getByRole("button",{name:"Participación registrada",exact:true})).toBeDisabled();
  await page.goto(`/dashboard?section=ofertas&oferta=${slugs[2]}`);
  await chosen.getByRole("button",{name:"Postularme",exact:true}).click();
  await expect(chosen.getByRole("button",{name:"Participación registrada",exact:true})).toBeDisabled();
  const rows = JSON.parse(runLocalMaintenanceSql(`select jsonb_agg(p order by opening_id) from (select id,opening_id,application_cv_document_id as cv from public.participations where candidate_id='${profile}' and opening_id in ('${offers.join("','")}')) p`)) as {id:string;opening_id:string;cv:string}[];
  const one = rows.find(r=>r.opening_id===offers[0])!, two=rows.find(r=>r.opening_id===offers[1])!, general=rows.find(r=>r.opening_id===offers[2])!;
  expect(one.cv).not.toBe(two.cv); expect(general.cv).toBe(initialGeneral);
  await page.goto("/dashboard?section=perfil");
  await expect(page.getByRole("link",{name:"Abrir mi CV en otra pestaña"})).toHaveAttribute("href",`/api/cv/${persistedReference("cv",initialGeneral)}`);
  await page.getByLabel("Elegir CV").setInputFiles({name:"general-nuevo.png",mimeType:"image/png",buffer:png});
  await page.getByRole("button",{name:"Cargar o reemplazar CV",exact:true}).click();
  await expect(page.getByText("CV guardado.",{exact:true})).toBeVisible();
  expect(runLocalMaintenanceSql(`select application_cv_document_id from public.participations where id='${general.id}'`)).toBe(initialGeneral);
  await page.goto("/dashboard?section=postulaciones");
  await expect(page.locator(`a[href="/api/cv/${persistedReference("cv",one.cv)}"]`)).toBeVisible();
  const adminContext = await browser.newContext(), companyContext=await browser.newContext(), otherContext=await browser.newContext();
  try {
    const admin=await adminContext.newPage(),company=await companyContext.newPage(),other=await otherContext.newPage();
    await login(admin,"admin1@example.invalid","admin");
    await admin.goto(`/admin/participations/${one.id}`);
    const link=admin.getByRole("link",{name:"Abrir CV de esta postulación: oferta-uno.pdf"});
    await expect(link).toBeVisible(); const url=(await link.getAttribute("href"))!;
    const pdf=await adminContext.request.get(url); expect(pdf.status()).toBe(200);
    expect(pdf.headers()["content-type"]).toContain("application/pdf"); expect(pdf.headers()["content-disposition"]).toMatch(/^inline/);
    expect((await pdf.body()).subarray(0,5).toString()).toBe("%PDF-");
    const origin=admin.url(); const popup=admin.waitForEvent("popup"); await link.click(); await (await popup).close(); expect(admin.url()).toBe(origin);
    await admin.getByLabel("Acción",{exact:true}).selectOption("refer");
    await admin.getByRole("textbox",{name:"Motivo interno"}).fill("Evaluación ficticia de CV específico.");
    await admin.getByRole("button",{name:"Registrar acción",exact:true}).click();
    await expect(admin.getByRole("status").filter({hasText:"Resultado o estado vigente"})).toContainText("Derivada");
    await login(company,"company1@example.invalid","company"); await login(other,"company2@example.invalid","company");
    expect((await companyContext.request.get(url)).status()).toBe(200); expect((await otherContext.request.get(url)).status()).toBe(404);
    expect((await companyContext.request.get(`/api/cv/${persistedReference("cv",two.cv)}`)).status()).toBe(404);
    await admin.getByLabel("Acción",{exact:true}).selectOption("cancel_individual");
    await admin.getByRole("textbox",{name:"Motivo interno"}).fill("Cancelación ficticia para verificar revocación.");
    await admin.getByRole("button",{name:"Registrar acción",exact:true}).click(); await expect(admin.getByRole("status").filter({hasText:"Resultado o estado vigente"})).toContainText("Cancelada");
    expect((await companyContext.request.get(url)).status()).toBe(404);
    await admin.goto("/admin/atencion-presencial");
    await admin.getByLabel("Nombre y apellido").fill("Persona asistida CV ficticia");
    await admin.getByLabel("DNI",{exact:true}).fill(`98${Date.now().toString().slice(-6)}`);
    await admin.getByLabel("Teléfono",{exact:true}).fill("3410000000");
    await admin.getByLabel("Localidad laboral").fill("Funes");
    await admin.getByLabel("Habilidades y experiencia").fill("Experiencia ficticia administrativa.");
    await admin.getByRole("combobox",{name:"Categorías laborales",exact:true}).click();
    await admin.getByRole("option",{name:"Categoría ficticia A",exact:true}).click(); await admin.keyboard.press("Escape");
    await admin.getByLabel(/Confirmo que la persona leyó y aceptó/).check();
    await admin.getByRole("button",{name:"Comprobar duplicados y guardar",exact:true}).click();
    await expect(admin).toHaveURL(/\/admin\/candidates\/can-[0-9a-f]{24}$/);
    await admin.getByLabel("Archivo de CV").setInputFiles({name:"asistido-ficticio.jpg",mimeType:"image/jpeg",buffer:jpeg});
    await admin.getByRole("button",{name:"Cargar CV",exact:true}).click();
    await expect(admin.getByText("CV guardado.",{exact:true})).toBeVisible();
  } finally {await adminContext.close();await companyContext.close();await otherContext.close();}
});
test("dos envíos simultáneos crean un solo caso y un único CV específico válido", async ({ page }) => {
  assertLocalTargets(); const scope=`cv-race-${Date.now()}`,opening=fixture(scope,1),profile=fixture("profile",489);
  runLocalMaintenanceSql(`update public.candidate_profiles set status='active',availability='available',refresh_due_at=clock_timestamp()+interval '6 months' where id='${profile}';
    insert into public.job_openings select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
    'id','${opening}','slug',null,'title','Oferta ficticia CV simultáneo','status','published','version',1,
    'closing_date',current_date+20,'published_at',clock_timestamp(),'archived_at',null))).*
    from public.job_openings t where t.id=private.fixture_id('opening',1);`);
  await login(page,"candidate489@example.invalid","candidate");
  const version=runLocalMaintenanceSql(`select version from public.candidate_profiles where id='${profile}'`);
  const buffer=readFileSync("tests/fixtures/cv-fictitious.pdf");
  const responses=await Promise.all([1,2].map(n=>page.context().request.post("/api/candidate/applications",{
    headers:{Origin:process.env.NEXT_PUBLIC_APP_URL!},multipart:{openingId:opening,candidateVersion:version,
      cv:{name:`simultaneo-${n}.pdf`,mimeType:"application/pdf",buffer}},
  })));
  expect(responses.map(r=>r.status()).sort()).toEqual([200,422]);
  expect(runLocalMaintenanceSql(`select count(*) from public.participations where candidate_id='${profile}' and opening_id='${opening}'`)).toBe("1");
  expect(runLocalMaintenanceSql(`select count(*) from public.cv_documents where candidate_id='${profile}' and opening_id='${opening}' and status='valid'`)).toBe("1");
  expect(runLocalMaintenanceSql(`select count(*) from public.audit_events where action='participation_created' and entity_id in(select id from public.participations where candidate_id='${profile}' and opening_id='${opening}')`)).toBe("1");
});
