import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { assertLocalTargets } from "../fixtures/credentials.mjs";
import { fixtureId, loginFixture } from "./fixtures/quality";
import { persistedReference } from "./fixtures/record-reference";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace:"off",screenshot:"off" });
test.beforeEach(()=>assertLocalTargets());

test("historial resumido filtra antes de paginar, supera50, conserva auditoría y funciona por teclado",async({ page })=>{
  test.setTimeout(120_000);
  await loginFixture(page,"admin");
  const candidate=fixtureId("profile",1);
  // Read the real linked account rather than accepting a client-supplied scope.
  const linked=runLocalMaintenanceSql(`select account_id from public.candidate_profiles where id='${candidate}'`);
  expect(linked).toMatch(/^[0-9a-f-]{36}$/);
  const actor=runLocalMaintenanceSql("select id from public.accounts where role='admin' and status='active' order by id limit 1");
  const path=`/admin/candidates/${persistedReference("candidate",candidate)}`;
  await page.goto(path); await expect(page.getByRole("heading",{ level:1 })).toBeVisible();
  // Append explicitly fictitious display fixtures only in the guarded isolated DB.
  // 80 newer hidden events must not push the 61 older visible events out of view.
  runLocalMaintenanceSql(`
    insert into public.audit_events(entity_type,entity_id,action,actor_type,actor_account_id,occurred_at,previous_state,new_state)
    select 'candidate_profiles','${candidate}','profile_updated','account','${actor}','2025-01-02T00:00:00.123456Z','active','active' from generate_series(1,80);
    with visible as (select (array['profile_activated','consent_accepted','consent_withdrawn','availability_changed','account_suspended','account_reactivated','profile_linked','freshness_due'])[1+(n%8)] as action from generate_series(1,61) n)
    insert into public.audit_events(entity_type,entity_id,action,actor_type,actor_account_id,occurred_at,previous_state,new_state)
    select case when action like 'account_%' then 'accounts' else 'candidate_profiles' end,
      case when action like 'account_%' then '${linked}'::uuid else '${candidate}'::uuid end,
      action,'account','${actor}','2025-01-01T00:00:00.123456Z','active','active' from visible;
  `);
  const scope=`((entity_type='candidate_profiles' and entity_id='${candidate}') or (entity_type='accounts' and entity_id='${linked}'))`;
  const fingerprint=()=>runLocalMaintenanceSql(`select md5(string_agg(row_to_json(a)::text,'' order by a.id)) from public.audit_events a where ${scope}`);
  const expected=JSON.parse(runLocalMaintenanceSql(`select coalesce(json_agg(x),'[]') from (select action,occurred_at from public.audit_events where ${scope} and action in ('profile_activated','consent_accepted','consent_withdrawn','availability_changed','account_suspended','account_reactivated','profile_linked','freshness_due') order by occurred_at desc,id desc) x`)) as { action:string;occurred_at:string }[];
  expect(expected.length).toBeGreaterThan(50);
  await page.reload();
  const region=page.getByRole("region",{ name:"Historial de cuenta y perfil",exact:true });
  const entries=region.getByRole("listitem");
  await expect(entries).toHaveCount(5);
  // A newer event arriving between pages must not duplicate/shift older entries.
  runLocalMaintenanceSql(`insert into public.audit_events(entity_type,entity_id,action,actor_type,actor_account_id,occurred_at,previous_state,new_state) values('candidate_profiles','${candidate}','profile_activated','account','${actor}','2031-01-01T00:00:00Z','draft','active')`);
  const before=fingerprint();
  expect(await region.innerText()).not.toMatch(/Perfil creado|Perfil actualizado|Cuenta creada|Cuenta verificada|cta-|→|[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/i);
  const visibleActions=["Perfil activado","Consentimiento aceptado","Consentimiento retirado","Disponibilidad actualizada","Cuenta suspendida","Cuenta reactivada","Perfil vinculado","Perfil pendiente de actualización"];
  let count=5;
  while(count<expected.length){
    const more=region.getByRole("button",{ name:"Ver más",exact:true });
    await more.focus(); await page.keyboard.press("Enter");
    const previous=count; count=Math.min(count+5,expected.length);
    await expect(entries).toHaveCount(count);
    await expect(entries.nth(previous)).toBeFocused();
  }
  await expect(region.getByRole("button",{ name:"Ver más",exact:true })).toHaveCount(0);
  expect(await entries.locator("time").evaluateAll(elements=>elements.map(element=>element.getAttribute("datetime")))).toEqual(expected.map(event=>event.occurred_at));
  for(const label of visibleActions) await expect(region.getByText(label,{ exact:true }).first()).toBeVisible();
  for(const width of [1440,390]){
    await page.setViewportSize({ width,height:1000 });
    expect(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)).toBe(false);
    expect((await new AxeBuilder({ page }).include('section[aria-labelledby="candidate-history"]').analyze()).violations).toEqual([]);
  }
  expect(fingerprint()).toBe(before);
  await page.reload();
  await expect(entries).toHaveCount(5);
  await expect(entries.first().locator('time')).toHaveAttribute('datetime',/^2031-01-01/);
  await expect(entries.first().locator('time')).toContainText('21:00:00');
});
