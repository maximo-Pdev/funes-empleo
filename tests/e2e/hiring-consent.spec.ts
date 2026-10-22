import { expect, test, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { assertLocalTargets, localFixturePassword } from "../fixtures/credentials.mjs";
import { runLocalMaintenanceSql } from "./local-maintenance";

test.use({ trace: "off", screenshot: "off" });
test.beforeEach(() => assertLocalTargets());

async function signIn(page: Page, identity: string) {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill(`${identity}@example.invalid`);
  await page.getByLabel("Contraseña", { exact: true }).fill(localFixturePassword());
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
}

for (const late of [false, true]) {
  test(`contratación tardía=${late}: retiro global atómico, bloqueo por candidato y otros casos intactos`, async ({ browser }) => {
    const candidateId = randomUUID();
    const consentId = randomUUID();
    const cvId = randomUUID();
    const openingId = randomUUID();
    const otherOpeningId = randomUUID();
    const participationId = randomUUID();
    const otherParticipationId = randomUUID();
    const name = `Persona ficticia contratación ${candidateId.slice(0, 8)}`;
    runLocalMaintenanceSql(`begin;
      insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name,status,availability,last_confirmed_at,refresh_due_at)
      values('${candidateId}','assisted',private.fixture_id('admin',1),'${name}','active','available',now(),now()+interval '1 month');
      insert into public.candidate_consents(id,candidate_id,policy_version,policy_hash,status,recorded_by,source)
      select '${consentId}','${candidateId}',version,policy_hash,'accepted',private.fixture_id('admin',1),'assisted'
      from private.consent_policies where version='demo-not-approved';
      insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by)
      values('${cvId}','${candidateId}','${candidateId}/${cvId}.pdf','cv-ficticio.pdf','application/pdf',608,repeat('0',64),'valid','fictitious_fixture',private.fixture_id('admin',1));
      insert into public.job_openings
      select (jsonb_populate_record(null::public.job_openings,to_jsonb(template)||jsonb_build_object(
        'id',chosen.id,'slug',null,'title','Oferta ficticia contratación','status','paused','closing_date',(now()+interval '1 month')::date,
        'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',chosen.company))))).*
      from public.job_openings template cross join (values('${openingId}'::uuid,1),('${otherOpeningId}'::uuid,2)) chosen(id,company)
      where template.id=private.fixture_id('opening',1);
      insert into public.participations(id,candidate_id,opening_id,origin,created_by,status)
      values('${participationId}','${candidateId}','${openingId}','admin_nomination',private.fixture_id('admin',1),'${late ? "no_company_response" : "referred"}'),
        ('${otherParticipationId}','${candidateId}','${otherOpeningId}','admin_nomination',private.fixture_id('admin',1),'referred');
      insert into public.referrals(participation_id,candidate_id,referred_by,referred_at,access_status,consent_event_id,cv_document_id,feedback_due_at,
        access_changed_at,access_changed_actor_type,access_changed_by_account_id,access_change_reason)
      select chosen.id,'${candidateId}',private.fixture_id('admin',1),now()-interval '1 day',chosen.access::public.referral_access_status,
        '${consentId}','${cvId}',now()+interval '29 days',now(),'account',private.fixture_id('admin',1),'referral_created'
      from (values('${participationId}'::uuid,'${late ? "revoked" : "active"}'),('${otherParticipationId}'::uuid,'active')) chosen(id,access);
      commit;`);
    expect(runLocalMaintenanceSql(`select count(*) from private.public_offer_rows where id in ('${openingId}','${otherOpeningId}');`)).toBe("0");
    const otherCaseBefore = runLocalMaintenanceSql(`select to_jsonb(part)::text from public.participations part where id='${otherParticipationId}';`);
    const adminContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
    const companyContext = await browser.newContext({ baseURL: "http://127.0.0.1:3000" });
    const blocker = spawn("docker", ["exec", "-i", "supabase_db_funes-empleo", "psql", "-X", "-qAt", "-U", "postgres", "-d", "postgres", "-v", "ON_ERROR_STOP=1"], { stdio: ["pipe", "pipe", "pipe"] });
    const blockerDone = new Promise<number | null>((resolve, reject) => { blocker.on("error", reject); blocker.on("close", resolve); });
    blocker.stdout.resume(); blocker.stderr.resume();
    try {
      const admin = await adminContext.newPage();
      const company = await companyContext.newPage();
      await signIn(admin, "admin1"); await signIn(company, "company2");
      await company.goto(`/company/openings/${otherOpeningId}/referrals`);
      await expect(company.getByText(name, { exact: true })).toBeVisible();
      await admin.goto(`/admin/participations/${participationId}`);
      if (late) {
        await admin.getByLabel("Canal", { exact: true }).selectOption("phone");
        await admin.getByLabel("Dirección").selectOption("inbound");
        await admin.getByLabel("Fecha y hora (Funes)").fill("2026-09-24T14:00");
        await admin.locator("#contact-summary").fill("Respuesta tardía ficticia de contratación.");
        await admin.getByRole("button", { name: "Guardar contacto" }).click();
        await expect(admin.getByText("Respuesta tardía ficticia de contratación.", { exact: true })).toBeVisible();
        await admin.reload();
      }
      await admin.getByLabel("Acción").selectOption(late ? "correct_hired" : "confirm_hired");
      await admin.getByRole("textbox", { name: "Motivo interno" }).fill("Contratación ficticia confirmada.");
      if (late) {
        const contactId = runLocalMaintenanceSql(`select id from public.contact_events where participation_id='${participationId}' limit 1;`);
        expect(contactId).toMatch(/^[0-9a-f-]{36}$/);
        await admin.getByLabel("Contacto municipal (opcional)").selectOption(contactId);
        await expect(admin.getByLabel("Contacto municipal (opcional)")).not.toHaveValue("");
      }
      const marker = `hiring-${candidateId}`;
      blocker.stdin.write(`begin; set application_name='${marker}'; select id from public.candidate_profiles where id='${candidateId}' for update;\n`);
      let blockerPid = "";
      await expect.poll(() => {
        blockerPid = runLocalMaintenanceSql(`select pid from pg_stat_activity where application_name='${marker}' and state='idle in transaction';`);
        return /^\d+$/.test(blockerPid);
      }).toBe(true);
      await admin.getByRole("button", { name: "Registrar acción" }).click();
      await expect(admin.locator("[data-field-error]")).toHaveCount(0);
      await expect.poll(() => runLocalMaintenanceSql(`select count(*) from pg_stat_activity where ${blockerPid}=any(pg_blocking_pids(pid));`)).not.toBe("0");
      blocker.stdin.end("rollback;\n");
      expect(await blockerDone).toBe(0);
      await expect(admin.getByRole("status").filter({ hasText: "Resultado o estado vigente" })).toContainText("Persona contratada");
      expect(runLocalMaintenanceSql(`select private.current_consent('${candidateId}');`)).toBe("f");
      expect(runLocalMaintenanceSql(`select count(*) from public.referrals where candidate_id='${candidateId}' and access_status='active';`)).toBe("0");
      expect(runLocalMaintenanceSql(`select to_jsonb(part)::text from public.participations part where id='${otherParticipationId}';`)).toBe(otherCaseBefore);
      await company.reload();
      await expect(company.getByText(name, { exact: true })).toHaveCount(0);
      await expect(company.getByRole("link", { name: "Descargar CV asociado a esta derivación" })).toHaveCount(0);
      expect([403, 404]).toContain((await company.request.get(`/api/cv/${cvId}`)).status());
    } finally {
      if (!blocker.stdin.writableEnded) blocker.stdin.end("rollback;\n");
      await blockerDone;
      await Promise.all([adminContext.close(), companyContext.close()]);
    }
  });
}
