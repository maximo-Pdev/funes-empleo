import { randomUUID } from "node:crypto";
import { expect,test,type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { loginFixture,fixtureId } from "./fixtures/quality";
import { persistedReference } from "./fixtures/record-reference";
import { nominateFromOpening } from "./fixtures/nomination";
import { runLocalMaintenanceSql } from "./local-maintenance";
import { assertLocalTargets } from "../fixtures/credentials.mjs";

test.use({trace:"off",screenshot:"off"});
async function summary(page:Page) { const response=await page.request.get("/api/notifications?size=5");expect(response.ok()).toBe(true);return response.json() as Promise<{unread:number;items:{reference:string;kind:string;subject:string|null}[]}>; }
async function openNotice(page:Page,href:string,title:string,text:string) {
 await page.goto(href);
 await page.getByRole("main").getByRole("listitem").filter({hasText:title}).getByRole("button",{name:new RegExp(text)}).first().click();
}

test("avisos privados: postulación, nominación, agenda, derivación y contratación con lectura individual",async({page,browser})=>{
 test.setTimeout(150000);assertLocalTargets();
 const offers=[randomUUID(),randomUUID()] as const,profile=fixtureId("profile",480);
 const titles=[`Oferta ficticia de avisos propia ${offers[0].slice(0,8)}`,`Oferta ficticia de avisos municipal ${offers[1].slice(0,8)}`] as const;
 runLocalMaintenanceSql(`update public.candidate_profiles set status='active',availability='available',refresh_due_at=clock_timestamp()+interval '6 months' where id='${profile}';
  insert into public.job_openings select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
  'id',v.id,'slug',null,'title',v.title,'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),
  'status','published','version',1,'closing_date',current_date+30,'published_at',clock_timestamp(),'archived_at',null))).*
  from public.job_openings t cross join(values('${offers[0]}'::uuid,'${titles[0]}'),('${offers[1]}'::uuid,'${titles[1]}'))v(id,title) where t.id=private.fixture_id('opening',1);
  insert into public.opening_categories(opening_id,category_id) select '${offers[1]}',category_id from public.candidate_categories where candidate_id='${profile}';`);
 const adminContext=await browser.newContext(),otherAdminContext=await browser.newContext(),companyContext=await browser.newContext();
 try {
  const admin=await adminContext.newPage(),otherAdmin=await otherAdminContext.newPage(),company=await companyContext.newPage();
  await loginFixture(page,"candidate",480);await loginFixture(admin,"admin",1);await loginFixture(otherAdmin,"admin",2);await loginFixture(company,"company",1);
  const slug=runLocalMaintenanceSql(`select slug from public.job_openings where id='${offers[0]}'`);
  await page.goto(`/dashboard?section=ofertas&oferta=${slug}`);
  await page.getByRole("region",{name:"Oferta elegida",exact:true}).getByRole("button",{name:"Postularme",exact:true}).click();
  await expect(page.getByRole("region",{name:"Oferta elegida",exact:true}).getByRole("button",{name:"Participación registrada",exact:true})).toBeDisabled();
  const otherBefore=(await summary(otherAdmin)).unread;
  const adminBefore=(await summary(admin)).unread;
  await openNotice(admin,"/admin/notificaciones",titles[0],"Se recibió una nueva postulación");
  await expect(admin).toHaveURL(/\/admin\/participations\/cas-[0-9a-f]{24}$/);
  expect((await summary(admin)).unread).toBe(adminBefore-1);expect((await summary(otherAdmin)).unread).toBe(otherBefore);
  const otherReference=(await summary(otherAdmin)).items.find(i=>i.kind==="admin_application")!.reference;
  const denied=await admin.request.post("/api/notifications/open",{form:{reference:otherReference},maxRedirects:0});expect(denied.status()).toBe(404);
  await nominateFromOpening(admin,profile,offers[1]);
  const part=runLocalMaintenanceSql(`select id from public.participations where candidate_id='${profile}' and opening_id='${offers[1]}'`);
  const partRef=persistedReference("participation",part);
  await openNotice(page,"/dashboard?section=notificaciones",titles[1],"La Oficina te incorporó");
  await expect(page).toHaveURL(new RegExp(`section=postulaciones#${partRef}$`));
  await expect(page.locator(`#${partRef}`)).toContainText(titles[1]);
  await admin.getByLabel("Acción",{exact:true}).selectOption("record_preinterview");
  await admin.getByLabel("Canal de preentrevista").selectOption("video");
  await admin.locator("#preinterview-summary").fill("RESUMEN_INTERNO_NO_VISIBLE_AVISO");
  await admin.getByLabel("Fecha programada",{exact:true}).fill("2026-11-15T10:30");
  await admin.getByRole("button",{name:"Registrar acción",exact:true}).click();
  await expect.poll(()=>runLocalMaintenanceSql(`select count(*) from public.preinterviews where participation_id='${part}'`)).toBe("1");
  await openNotice(page,"/dashboard?section=notificaciones",titles[1],"La Oficina registró una preentrevista");
  await expect(page.locator(`#${partRef}`)).toContainText("Videollamada");
  await expect(page.locator(`#${partRef}`)).toContainText("15/11/2026");
  await expect(page.locator("body")).not.toContainText(/RESUMEN_INTERNO_NO_VISIBLE_AVISO|MOTIVO_INTERNO_NO_VISIBLE_AVISO|Recomendación/);
  await admin.reload();await admin.getByLabel("Acción",{exact:true}).selectOption("refer");
  await admin.getByLabel("Motivo interno",{exact:true}).fill("Derivación ficticia autorizada");
  await admin.getByRole("button",{name:"Registrar acción",exact:true}).click();
  await expect.poll(()=>runLocalMaintenanceSql(`select status from public.participations where id='${part}'`)).toBe("referred");
  await openNotice(company,"/empresa/notificaciones",titles[1],"Recibiste una nueva derivación");
  await expect(company).toHaveURL(/\/empresa\/ofertas\/ofe-[0-9a-f]{24}\?referral=der-[0-9a-f]{24}#derivaciones$/);
  await expect(company.getByRole("heading",{name:"Derivación de Persona ficticia 480",exact:true})).toBeVisible();
  await company.getByLabel("Resultado informado").selectOption("hired");await company.getByRole("button",{name:"Enviar informe",exact:true}).click();
  await expect(company.getByText("El resultado informado quedó pendiente de revisión municipal.",{exact:true})).toBeVisible();
  expect((await summary(page)).items.some(i=>i.kind==="candidate_hired"&&i.subject===titles[1])).toBe(false);
  await openNotice(admin,"/admin/notificaciones",titles[1],"Una empresa informó una contratación");
  await admin.getByRole("button",{name:"Confirmar resultado",exact:true}).click();
  await expect.poll(()=>runLocalMaintenanceSql(`select status from public.participations where id='${part}'`)).toBe("hired");
  await openNotice(page,"/dashboard?section=notificaciones",titles[1],"La Oficina confirmó tu contratación");
  await expect(page.locator(`#${partRef}`)).toContainText("Contratación confirmada");
  expect(runLocalMaintenanceSql(`select availability from public.candidate_profiles where id='${profile}'`)).toBe("unavailable");
  await page.setViewportSize({width:390,height:844});
  const bell=page.getByRole("button",{name:/^Notificaciones:/});await bell.focus();await page.keyboard.press("Enter");
  await expect(page.getByRole("heading",{name:"Notificaciones",exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:test.info().outputPath("notificaciones-390.png"),fullPage:true});
  await page.keyboard.press("Escape");await expect(bell).toBeFocused();
 } finally {await adminContext.close();await otherAdminContext.close();await companyContext.close();}
});

test("HTTP de avisos deniega anónimo, suspendido y origen cruzado sin escrituras",async({page})=>{
 assertLocalTargets();
 expect((await page.request.get("/api/notifications")).status()).toBe(401);
 await loginFixture(page,"candidate",481);
 const reference=(await summary(page)).items[0]?.reference??"aviso-"+"f".repeat(24);
 const before=runLocalMaintenanceSql("select count(*) from public.audit_events");
 const cross=await page.request.post("/api/notifications/open",{form:{reference},headers:{Origin:"https://foreign.invalid"},maxRedirects:0});expect(cross.status()).toBe(403);
 const candidate=fixtureId("candidate",481);
 runLocalMaintenanceSql(`update public.accounts set status='suspended',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1),suspended_reason='Prueba ficticia de avisos' where id='${candidate}'`);
 try {
  expect((await page.request.get("/api/notifications")).status()).toBe(403);
  expect((await page.request.post("/api/notifications/open",{form:{reference},maxRedirects:0})).status()).toBe(403);
 }finally{runLocalMaintenanceSql(`update public.accounts set status='active',suspended_at=null,suspended_by=null,suspended_reason=null where id='${candidate}'`);}
 expect(runLocalMaintenanceSql("select count(*) from public.audit_events")).toBe(before);
});

test("revisión, aprobación y rechazo enlazan la oferta propia sin exponer motivos internos",async({page,browser})=>{
 test.setTimeout(90000);assertLocalTargets();
 const ids=[randomUUID(),randomUUID()] as const;
 const titles=ids.map((id,index)=>`Oferta aviso moderación ficticia ${index}-${id.slice(0,8)}`);
 runLocalMaintenanceSql(`insert into public.job_openings select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
  'id',v.id,'slug',null,'title',v.title,'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),
  'status','draft','version',1,'closing_date',current_date+30,'archived_at',null))).*
  from public.job_openings t cross join(values('${ids[0]}'::uuid,'${titles[0]}'),('${ids[1]}'::uuid,'${titles[1]}'))v(id,title) where t.id=private.fixture_id('opening',1);
  insert into public.opening_categories(opening_id,category_id)values('${ids[0]}',private.fixture_id('category',1)),('${ids[1]}',private.fixture_id('category',1));`);
 const adminContext=await browser.newContext();
 try{
  const admin=await adminContext.newPage();await loginFixture(page,"company",1);await loginFixture(admin,"admin",1);
  for(const [index,id] of ids.entries()){
   await page.goto(`/empresa/ofertas/${persistedReference("opening",id)}`);
   await page.getByRole("button",{name:"Enviar a revisión municipal",exact:true}).click();
   await expect(page.getByText("Estado:")).toContainText("Pendiente de revisión");
   await openNotice(admin,"/admin/notificaciones",titles[index]!,"Hay una oferta pendiente de revisión");
   await expect(admin).toHaveURL(new RegExp(`/admin/openings/${persistedReference("opening",id)}$`));
   await admin.getByLabel("Decisión",{exact:true}).selectOption(index===0?"approved":"rejected");
   if(index===1){await admin.getByLabel("Explicación para la empresa").fill("Explicación pública ficticia");await admin.getByLabel("Motivo interno",{exact:true}).fill("MOTIVO_MODERACION_PRIVADO_AVISO");}
   await admin.getByRole("button",{name:"Guardar decisión",exact:true}).click();
   await expect.poll(()=>runLocalMaintenanceSql(`select status from public.job_openings where id='${id}'`)).toBe(index===0?"published":"rejected");
   await openNotice(page,"/empresa/notificaciones",titles[index]!,index===0?"La Oficina aprobó y publicó":"La Oficina rechazó");
   await expect(page).toHaveURL(new RegExp(`/empresa/ofertas/${persistedReference("opening",id)}$`));
   await expect(page.locator("body")).not.toContainText("MOTIVO_MODERACION_PRIVADO_AVISO");
  }
  await page.goto("/empresa/notificaciones");await page.setViewportSize({width:1440,height:900});
  await expect(page.getByRole("heading",{level:1,name:"Notificaciones",exact:true})).toBeVisible();
  await expect(page.getByRole("main").getByRole("listitem").first()).toBeVisible();
  expect((await new AxeBuilder({page}).analyze()).violations).toEqual([]);
  await page.screenshot({path:test.info().outputPath("notificaciones-empresa-1440.png"),fullPage:true});
 }finally{await adminContext.close();}
});
