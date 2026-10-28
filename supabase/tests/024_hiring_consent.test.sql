begin;
select no_plan();

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee240000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee240000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
 ('ee240000-0000-4000-8000-000000000003',private.fixture_id('company',2)),
 ('ee240000-0000-4000-8000-000000000004',private.fixture_id('candidate',200));

insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name,status,availability,last_confirmed_at,refresh_due_at)
select private.fixture_id('hc-profile',number),'assisted',private.fixture_id('admin',1),
 'Persona ficticia contratación '||number,'active','available',clock_timestamp(),clock_timestamp()+interval '1 month'
from generate_series(1,3) number;
insert into public.candidate_consents(id,candidate_id,policy_version,policy_hash,status,recorded_by,source,recorded_at)
select private.fixture_id('hc-consent',number),private.fixture_id('hc-profile',number),policy.version,policy.policy_hash,
 'accepted',private.fixture_id('admin',1),'assisted',clock_timestamp()-interval '1 minute'
from generate_series(1,3) number cross join private.consent_policies policy where policy.version='demo-not-approved';
insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by)
select private.fixture_id('hc-cv',number),private.fixture_id('hc-profile',number),
 private.fixture_id('hc-profile',number)::text||'/'||private.fixture_id('hc-cv',number)::text||'.pdf',
 'cv-ficticio.pdf','application/pdf',608,repeat('0',64),'valid','fictitious_fixture',private.fixture_id('admin',1)
from generate_series(1,3) number;
insert into public.job_openings
select (jsonb_populate_record(null::public.job_openings,to_jsonb(template)||jsonb_build_object(
 'id',private.fixture_id('hc-opening',number),'slug',null,'title','Oferta ficticia contratación '||number,
 'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',case when number%2=0 then 2 else 1 end)),
 'status','published','closing_date',(clock_timestamp()+interval '1 month')::date))).*
from public.job_openings template cross join generate_series(1,9) number where template.id=private.fixture_id('opening',1);
insert into public.participations(id,candidate_id,opening_id,origin,created_by,status,final_outcome_at,final_outcome_by)
select private.fixture_id('hc-part',number),private.fixture_id('hc-profile',case when number<=4 or number=9 then 1 when number<=6 then 2 else 3 end),
 private.fixture_id('hc-opening',number),'admin_nomination',private.fixture_id('admin',1),
 case when number=3 then 'under_review' when number=4 then 'not_selected' when number=5 then 'no_company_response' when number=9 then 'hired' else 'referred' end::public.participation_status,
 case when number in (4,5,9) then clock_timestamp()-interval '1 day' end,
 case when number in (4,5,9) then private.fixture_id('admin',1) end
from generate_series(1,9) number;
insert into public.referrals(id,participation_id,candidate_id,referred_by,referred_at,access_status,consent_event_id,cv_document_id,
 feedback_due_at,access_changed_at,access_changed_actor_type,access_changed_by_account_id,access_change_reason)
select private.fixture_id('hc-referral',number),private.fixture_id('hc-part',number),
 private.fixture_id('hc-profile',case when number<=4 or number=9 then 1 when number<=6 then 2 else 3 end),private.fixture_id('admin',1),
 now()-interval '1 day',case when number=5 then 'revoked' else 'active' end::public.referral_access_status,
 private.fixture_id('hc-consent',case when number<=4 or number=9 then 1 when number<=6 then 2 else 3 end),
 private.fixture_id('hc-cv',case when number<=4 or number=9 then 1 when number<=6 then 2 else 3 end),
 now()+interval '29 days',clock_timestamp(),'account',private.fixture_id('admin',1),
 case when number=5 then 'no_company_response' else 'referral_created' end
from generate_series(1,9) number where number not in (3,4);
update public.referrals set post_hire_access_until=clock_timestamp()+interval '1 day' where id=private.fixture_id('hc-referral',9);

create function pg_temp.hiring_snapshot() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'profiles',(select jsonb_agg(to_jsonb(candidate) order by id) from public.candidate_profiles candidate
   where id in (select private.fixture_id('hc-profile',number) from generate_series(1,3) number)),
 'consents',(select jsonb_agg(to_jsonb(consent) order by id) from public.candidate_consents consent
   where candidate_id in (select private.fixture_id('hc-profile',number) from generate_series(1,3) number)),
 'parts',(select jsonb_agg(to_jsonb(part) order by id) from public.participations part
   where candidate_id in (select private.fixture_id('hc-profile',number) from generate_series(1,3) number)),
 'referrals',(select jsonb_agg(to_jsonb(referral) order by id) from public.referrals referral
   where candidate_id in (select private.fixture_id('hc-profile',number) from generate_series(1,3) number)),
 'audit_count',(select count(*) from public.audit_events),
 'decision_count',(select count(*) from private.workflow_decisions))
$$;
create temporary table unchanged_parts as select * from public.participations
where id in (select private.fixture_id('hc-part',number) from generate_series(2,9) number where number<>5);
create temporary table original_consents as select * from public.candidate_consents
where id in (select private.fixture_id('hc-consent',number) from generate_series(1,3) number);
select private.workflow_event('participations',private.fixture_id('hc-part',5),'no_company_response','referred','no_company_response',null);
create function pg_temp.fail_hiring_audit() returns trigger language plpgsql as $$
begin
 if current_setting('hc.fail_action',true)=new.action then raise exception 'HIRING_AUDIT_FAILURE'; end if;
 return new;
end $$;
create trigger test_hiring_audit before insert on public.audit_events for each row execute function pg_temp.fail_hiring_audit();

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee240000-0000-4000-8000-000000000002')::text,true);
select ok((public.company_referral(private.fixture_id('hc-referral',1))->'candidate') is not null,'Antes de contratar la empresa ve su perfil derivado');
select ok(not(public.company_referral(private.fixture_id('hc-referral',1)) ? 'hiredCandidate'),'Sin contratación confirmada no se muestra ese resultado');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire','Intento ficticio')$$,
 'P0001','NOT_FOUND','La empresa no confirma contratación ni retira consentimiento');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',200)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',200)::text,'session_id','ee240000-0000-4000-8000-000000000004')::text,true);
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire','Intento ficticio')$$,
 'P0001','NOT_FOUND','El candidato tampoco confirma contratación ni retira consentimiento ajeno');
select ok(not has_function_privilege('anon','public.transition_participation(uuid,integer,text,text,uuid,uuid,uuid)','EXECUTE'),'El anónimo no puede invocar la transición');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee240000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),2,'hire','Contratación ficticia')$$,'P0001','CONFLICT_STALE_DATA','Versión obsoleta no contrata');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire')$$,'P0001','INVALID_INPUT','Contratación exige evidencia o motivo');
select lives_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire','Contratación ficticia')$$,'Contratación normal conserva consentimiento y cambia disponibilidad');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',1)),'hired','Resultado hired');
select is((select status::text from public.candidate_profiles where id=private.fixture_id('hc-profile',1)),'unavailable','Perfil No disponible');
select is((select availability from public.candidate_profiles where id=private.fixture_id('hc-profile',1)),'unavailable','Disponibilidad No disponible');
select is((select version from public.candidate_profiles where id=private.fixture_id('hc-profile',1)),2,'Versión del perfil invalidada');
select ok(private.current_consent(private.fixture_id('hc-profile',1)),'Consentimiento sigue vigente');
select is((select count(*) from public.candidate_consents where candidate_id=private.fixture_id('hc-profile',1)),1::bigint,'No se registra otra aceptación ni retiro');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('hc-profile',1) and access_status='active'),3::bigint,'Otros permisos intactos');
select ok((select r.post_hire_access_until=p.final_outcome_at+interval '720 hours' from public.referrals r join public.participations p on p.id=r.participation_id where r.id=private.fixture_id('hc-referral',1)),'Ventana exactamente720h desde confirmación');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',3),1,'refer','Otra derivación ficticia')$$,'P0001','INVALID_TRANSITION','No disponible impide nuevas derivaciones');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire','Reintento ficticio')$$,'P0001','CONFLICT_STALE_DATA','Reintento no duplica resultado o ventana');
reset role;
select ok(not exists(select 1 from original_consents o join public.candidate_consents c using(id) where to_jsonb(o)<>to_jsonb(c)),'Consentimiento original inalterado');
select ok(not exists(select 1 from public.candidate_consents where source='hiring_workflow' and candidate_id=private.fixture_id('hc-profile',1)),'Sin retiro automático');
select ok(exists(select 1 from public.audit_events e join private.workflow_decisions d on d.id=(e.metadata_safe->>'decision_id')::uuid where e.entity_id=private.fixture_id('hc-profile',1) and e.action='availability_changed' and e.reason_code='hired' and e.actor_account_id=private.fixture_id('admin',1) and e.actor_type='account' and e.occurred_at is not null and d.entity_id=private.fixture_id('hc-part',1) and d.command='hiring_availability'),'Actor fecha y causa de disponibilidad auditados');
select is((select count(*) from public.audit_events where action='referral_revoked' and entity_id in (private.fixture_id('hc-referral',1),private.fixture_id('hc-referral',2),private.fixture_id('hc-referral',9))),0::bigint,'No revoca otras derivaciones');
select ok(not exists(select 1 from unchanged_parts o join public.participations c using(id) where to_jsonb(o)<>to_jsonb(c)),'Todos los campos de otros casos preservados');
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee240000-0000-4000-8000-000000000002')::text,true);
select ok(public.company_referral(private.fixture_id('hc-referral',1)) ? 'candidate','Empresa contratante conserva perfil durante ventana');
select ok(private.can_read_cv(private.fixture_id('hc-cv',1)),'Empresa contratante conserva CV');
reset role;
savepoint expiry;
update public.referrals set post_hire_access_until=clock_timestamp() where id in (private.fixture_id('hc-referral',1),private.fixture_id('hc-referral',9));
set local role authenticated;
select ok(not(public.company_referral(private.fixture_id('hc-referral',1)) ? 'candidate'),'Frontera720h deniega sin esperar Cron');
select ok(not private.can_read_cv(private.fixture_id('hc-cv',1)),'CV denegado al vencer todas las derivaciones propias');
reset role;
rollback to savepoint expiry;
update public.company_profiles set status='suspended' where account_id=private.fixture_id('company',1);
set local role authenticated;
select throws_ok($$select public.company_referral(private.fixture_id('hc-referral',1))$$,'P0001','NOT_FOUND','Empresa suspendida no consulta');
reset role;
update public.company_profiles set status='active' where account_id=private.fixture_id('company',1);
update public.accounts set status='suspended',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1),suspended_reason='Suspensión ficticia' where id=private.fixture_id('company',1);
set local role authenticated;
select throws_ok($$select public.company_referral(private.fixture_id('hc-referral',1))$$,'P0001','NOT_FOUND','Cuenta suspendida no consulta');
reset role;
update public.accounts set status='active',suspended_at=null,suspended_by=null,suspended_reason=null where id=private.fixture_id('company',1);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2)::text,'session_id','ee240000-0000-4000-8000-000000000003')::text,true);
select ok(public.company_referral(private.fixture_id('hc-referral',2)) ? 'candidate','Otra empresa conserva perfil de su derivación');
select ok(private.can_read_cv(private.fixture_id('hc-cv',1)),'Otra empresa conserva su CV autorizado');
select throws_ok($$select public.company_referral(private.fixture_id('hc-referral',1))$$,'P0001','NOT_FOUND','Empresa ajena no lee otra derivación');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee240000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.record_contact(private.fixture_id('hc-part',5),1,'phone','inbound',clock_timestamp()-interval '1 minute','Respuesta tardía ficticia')$$,'Evidencia tardía');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',5),2,'late_hire','Respuesta ficticia')$$,'P0001','INVALID_INPUT','Tardía exige evidencia');
reset role;
select set_config('hc.before_late',pg_temp.hiring_snapshot()::text,true);
select set_config('hc.fail_action','outcome_corrected',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',5),2,'late_hire','Respuesta ficticia',null,null,(select id from public.contact_events where participation_id=private.fixture_id('hc-part',5) limit 1))$$,'P0001','HIRING_AUDIT_FAILURE','Fallo de auditoría tardía aborta todo');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before_late')::jsonb,'Rollback tardío íntegro');
select set_config('hc.fail_action','',true);
set local role authenticated;
select lives_ok($$select public.transition_participation(private.fixture_id('hc-part',5),2,'late_hire','Respuesta ficticia',null,null,(select id from public.contact_events where participation_id=private.fixture_id('hc-part',5) limit 1))$$,'Tardía cambia disponibilidad');
select ok(private.current_consent(private.fixture_id('hc-profile',2)),'Tardía conserva consentimiento');
select is((select availability from public.candidate_profiles where id=private.fixture_id('hc-profile',2)),'unavailable','Tardía No disponible');
select is((select access_status::text from public.referrals where id=private.fixture_id('hc-referral',6)),'active','Tardía conserva otro permiso');
select is((select access_status::text from public.referrals where id=private.fixture_id('hc-referral',5)),'revoked','Tardía no revive revoked');
select ok((select post_hire_access_until is null from public.referrals where id=private.fixture_id('hc-referral',5)),'Tardía revocada no recibe ventana');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',6)),'referred','Otro caso sigue abierto');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee240000-0000-4000-8000-000000000002')::text,true);
select is(public.company_referral(private.fixture_id('hc-referral',5))->'hiredCandidate',jsonb_build_object('displayName','Persona ficticia contratación 2','outcome','hired'),'Tardía solo nombre y resultado');
select ok(not(public.company_referral(private.fixture_id('hc-referral',5)) ? 'candidate'),'Tardía no restaura perfil');
select ok(not private.can_read_cv(private.fixture_id('hc-cv',2)),'Tardía no restaura CV');
reset role;
select ok(not exists(select 1 from unchanged_parts o join public.participations c using(id) where to_jsonb(o)<>to_jsonb(c)),'Otros casos e historial preservados después de ambas contrataciones');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee240000-0000-4000-8000-000000000001')::text,true);
select set_config('hc.before',pg_temp.hiring_snapshot()::text,true);
select set_config('hc.fail_action','availability_changed',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación ficticia')$$,'P0001','HIRING_AUDIT_FAILURE','Fallo disponibilidad aborta contratación');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before')::jsonb,'Rollback disponibilidad y resultado');
select set_config('hc.fail_action','outcome_confirmed',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación ficticia')$$,'P0001','HIRING_AUDIT_FAILURE','Fallo final revierte disponibilidad y ventana');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before')::jsonb,'Rollback tras todos los efectos');
select set_config('hc.fail_action','',true);
set local role authenticated;
select throws_ok($$select public.assisted_candidate_command(private.fixture_id('hc-profile',1),2,'accept_consent','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'P0001','INVALID_TRANSITION','No se acepta de nuevo mientras sigue vigente');
select lives_ok($$select public.assisted_candidate_command(private.fixture_id('hc-profile',1),2,'withdraw_consent','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'Retiro manual explícito sigue disponible');
select ok(not private.current_consent(private.fixture_id('hc-profile',1)),'Retiro manual invalida consentimiento');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',3)),'withdrawn','Retiro manual cierra caso abierto');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',1)),'hired','Retiro manual conserva resultado final');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('hc-profile',1) and access_status='active'),0::bigint,'Retiro manual revoca todos sus permisos');
select lives_ok($$select public.assisted_candidate_command(private.fixture_id('hc-profile',1),3,'accept_consent','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'Solo acción afirmativa vuelve a consentir');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('hc-profile',1) and access_status='active'),0::bigint,'Reaceptación no restaura permisos');
reset role;
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source,recorded_at)
select private.fixture_id('hc-profile',3),version,policy_hash,'withdrawn',private.fixture_id('admin',1),'assisted',clock_timestamp()
from private.consent_policies where version='demo-not-approved';
set local role authenticated;
select lives_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación histórica ficticia')$$,'Resultado puede confirmarse con consentimiento ya retirado');
select ok(not private.current_consent(private.fixture_id('hc-profile',3)),'Contratar no reacepta un retiro anterior');
select is((select count(*) from public.candidate_consents where candidate_id=private.fixture_id('hc-profile',3)),2::bigint,'Historial de retiro previo permanece exacto');
select ok((select post_hire_access_until is null from public.referrals where id=private.fixture_id('hc-referral',7)),'Consentimiento retirado no obtiene ventana');
reset role;
select throws_ok($$update public.candidate_consents set status='withdrawn' where id=private.fixture_id('hc-consent',1)$$,'P0001','APPEND_ONLY','Historial no se reescribe');
select ok(not has_table_privilege('authenticated','public.candidate_consents','INSERT,UPDATE,DELETE'),'Cliente no escribe consentimiento directo');
select throws_ok($$insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source) select candidate_id,policy_version,policy_hash,'accepted',recorded_by,'hiring_workflow' from original_consents limit 1$$,'23514',null,'Origen automático legado nunca acepta');
select * from finish();
rollback;
