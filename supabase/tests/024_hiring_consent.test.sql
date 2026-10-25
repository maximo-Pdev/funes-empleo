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
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),2,'hire','Contratación ficticia')$$,
 'P0001','CONFLICT_STALE_DATA','Versión obsoleta no contrata ni retira');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire')$$,
 'P0001','INVALID_INPUT','Contratación exige evidencia o motivo');
select lives_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire','Contratación ficticia')$$,
 'Contratación normal retira consentimiento y permisos en el mismo comando');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',1)),'hired','Solo el caso contratado cambia a hired');
select is((select status::text from public.candidate_profiles where id=private.fixture_id('hc-profile',1)),'consent_withdrawn','Perfil deja de ser apto para derivar');
select is((select version from public.candidate_profiles where id=private.fixture_id('hc-profile',1)),2,'El cambio invalida la versión anterior del perfil');
select is((select status::text from public.candidate_consents where candidate_id=private.fixture_id('hc-profile',1) order by recorded_at desc,id desc limit 1),
 'withdrawn','El último consentimiento global queda retirado');
select is((select count(*) from public.candidate_consents where candidate_id=private.fixture_id('hc-profile',1)),2::bigint,'Se agrega un retiro sin borrar la aceptación');
select ok(not private.current_consent(private.fixture_id('hc-profile',1)),'La autorización de consentimiento ya deniega nuevas derivaciones');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('hc-profile',1) and access_status='active'),0::bigint,'Revoca también el permiso de la otra empresa');
select ok((select post_hire_access_until is null from public.referrals where id=private.fixture_id('hc-referral',1)),'No crea una nueva ventana720h');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',3),1,'refer','Otra derivación ficticia')$$,
 'P0001','INVALID_TRANSITION','Un caso preservado no puede derivarse mientras el consentimiento esté retirado');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',1),1,'hire','Reintento ficticio')$$,
 'P0001','CONFLICT_STALE_DATA','Reintento no duplica retiro ni resultado');
reset role;
select ok(not exists(select 1 from original_consents original join public.candidate_consents current using(id)
 where to_jsonb(original)<>to_jsonb(current)),'El consentimiento anterior permanece inalterado');
select ok(exists(select 1 from public.candidate_consents withdrawal join original_consents original using(candidate_id)
 where withdrawal.source='hiring_workflow' and withdrawal.status='withdrawn' and withdrawal.policy_version=original.policy_version
 and withdrawal.policy_hash=original.policy_hash and withdrawal.recorded_at>original.recorded_at
 and withdrawal.recorded_by=private.fixture_id('admin',1)),'Retiro conserva política/hash, admin y fecha posterior');
select ok(exists(select 1 from public.audit_events event join private.workflow_decisions decision
 on decision.id=(event.metadata_safe->>'decision_id')::uuid
 where event.entity_id=private.fixture_id('hc-profile',1) and event.action='consent_withdrawn' and event.reason_code='hired'
 and event.actor_account_id=private.fixture_id('admin',1) and event.actor_type='account' and event.occurred_at is not null
 and decision.entity_id=private.fixture_id('hc-part',1) and decision.command='hiring_consent_withdrawal'),
 'Auditoría vincula actor, fecha y causa privada a la contratación');
select is((select count(*) from public.audit_events where action='referral_revoked' and reason_code='consent_withdrawn'
 and entity_id in (private.fixture_id('hc-referral',1),private.fixture_id('hc-referral',2),private.fixture_id('hc-referral',9))),3::bigint,'Cada permiso revocado conserva su evento');
select ok(not exists(select 1 from unchanged_parts original join public.participations current using(id)
 where to_jsonb(original)<>to_jsonb(current)),'Otros casos abiertos, finales y de otras personas conservan todos sus campos');
select is((select count(*) from public.candidate_consents where candidate_id=private.fixture_id('hc-profile',1)),2::bigint,'Reintento conserva exactamente dos eventos');

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee240000-0000-4000-8000-000000000002')::text,true);
select ok(not(public.company_referral(private.fixture_id('hc-referral',1)) ? 'candidate'),'Empresa contratante pierde perfil y contactos');
select is(public.company_referral(private.fixture_id('hc-referral',1))->'hiredCandidate',
 jsonb_build_object('displayName','Persona ficticia contratación 1','outcome','hired'),'Contratación normal conserva solo nombre y resultado confirmado');
select is((select count(*) from jsonb_object_keys(public.company_referral(private.fixture_id('hc-referral',1)))),6::bigint,'Respuesta revocada tiene cuatro metadatos, candidateName y nombre/resultado mínimos');
reset role;
update public.company_profiles set status='suspended' where account_id=private.fixture_id('company',1);
set local role authenticated;
select throws_ok($$select public.company_referral(private.fixture_id('hc-referral',1))$$,'P0001','NOT_FOUND','Empresa suspendida tampoco consulta nombre contratado');
reset role;
update public.company_profiles set status='active' where account_id=private.fixture_id('company',1);
update public.accounts set status='suspended',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1),
 suspended_reason='Suspensión ficticia' where id=private.fixture_id('company',1);
set local role authenticated;
select throws_ok($$select public.company_referral(private.fixture_id('hc-referral',1))$$,'P0001','NOT_FOUND','Cuenta inactiva no consulta nombre contratado');
reset role;
update public.accounts set status='active',suspended_at=null,suspended_by=null,suspended_reason=null where id=private.fixture_id('company',1);
set local role authenticated;
select ok(not private.can_read_cv(private.fixture_id('hc-cv',1)),'Empresa contratante pierde CV');
select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2)::text,'session_id','ee240000-0000-4000-8000-000000000003')::text,true);
select ok(not(public.company_referral(private.fixture_id('hc-referral',2)) ? 'candidate'),'La otra empresa tampoco recupera datos');
select ok(not(public.company_referral(private.fixture_id('hc-referral',2)) ? 'hiredCandidate'),'Caso no contratado no se presenta como contratación tras retiro global');
select throws_ok($$select public.company_referral(private.fixture_id('hc-referral',1))$$,'P0001','NOT_FOUND','Empresa ajena no puede leer el nombre contratado');
select ok(not private.can_read_cv(private.fixture_id('hc-cv',1)),'La otra empresa pierde CV');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee240000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.record_contact(private.fixture_id('hc-part',5),1,'phone','inbound',clock_timestamp()-interval '1 minute','Respuesta tardía ficticia')$$,'Se registra evidencia tardía');
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',5),2,'late_hire','Respuesta ficticia')$$,
 'P0001','INVALID_INPUT','Contratación tardía sin evidencia no retira consentimiento');
reset role;
select set_config('hc.before_late',pg_temp.hiring_snapshot()::text,true);
select set_config('hc.fail_action','outcome_corrected',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',5),2,'late_hire','Respuesta ficticia',null,null,
 (select id from public.contact_events where participation_id=private.fixture_id('hc-part',5) limit 1))$$,
 'P0001','HIRING_AUDIT_FAILURE','Fallo al auditar corrección tardía revierte todos sus efectos');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before_late')::jsonb,'Corrección tardía también es atómica');
select set_config('hc.fail_action','',true);
set local role authenticated;
select lives_ok($$select public.transition_participation(private.fixture_id('hc-part',5),2,'late_hire','Respuesta ficticia',null,null,
 (select id from public.contact_events where participation_id=private.fixture_id('hc-part',5) limit 1))$$,'Contratación tardía ejecuta el mismo retiro global');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',5)),'hired','Corrección tardía conserva resultado hired');
select ok(not private.current_consent(private.fixture_id('hc-profile',2)),'Corrección tardía también retira consentimiento');
select is((select access_status::text from public.referrals where id=private.fixture_id('hc-referral',6)),'revoked','Corrección tardía revoca otro permiso vigente');
select is((select access_status::text from public.referrals where id=private.fixture_id('hc-referral',5)),'revoked','Nunca revive el permiso tardío ya revocado');
select is((select status::text from public.participations where id=private.fixture_id('hc-part',6)),'referred','El otro caso sigue derivado, no se cierra');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee240000-0000-4000-8000-000000000002')::text,true);
select is(public.company_referral(private.fixture_id('hc-referral',5))->'hiredCandidate',
 jsonb_build_object('displayName','Persona ficticia contratación 2','outcome','hired'),'Contratación tardía conserva la misma proyección mínima');
select ok(not(public.company_referral(private.fixture_id('hc-referral',5)) ? 'candidate'),'El nombre tardío no restaura el perfil');
select ok(not private.can_read_cv(private.fixture_id('hc-cv',2)),'El nombre tardío no restaura acceso al CV');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee240000-0000-4000-8000-000000000001')::text,true);
reset role;
select ok(not exists(select 1 from unchanged_parts original join public.participations current using(id)
 where to_jsonb(original)<>to_jsonb(current)),'La contratación tardía también conserva todos los campos de otros casos y contrataciones previas');
set local role authenticated;
select is((select count(*) from public.audit_events where entity_id=private.fixture_id('hc-part',5)
 and action in ('no_company_response','outcome_corrected')),2::bigint,'Se conservan cierre anterior y corrección tardía');
reset role;

select set_config('hc.before',pg_temp.hiring_snapshot()::text,true);
select set_config('hc.fail_action','consent_withdrawn',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación ficticia')$$,
 'P0001','HIRING_AUDIT_FAILURE','Fallo de auditoría aborta contratación, retiro y permisos');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before')::jsonb,'Rollback íntegro: perfil, resultado, permisos, consentimientos, decisiones y eventos');
select set_config('hc.fail_action','referral_revoked',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación ficticia')$$,
 'P0001','HIRING_AUDIT_FAILURE','Fallo al auditar revocación revierte el retiro ya insertado');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before')::jsonb,'Rollback cuando falla la revocación');
select set_config('hc.fail_action','outcome_confirmed',true);
set local role authenticated;
select throws_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación ficticia')$$,
 'P0001','HIRING_AUDIT_FAILURE','Fallo en evento final revierte también los dos permisos ya revocados');
reset role;
select is(pg_temp.hiring_snapshot(),current_setting('hc.before')::jsonb,'Rollback tras ejecutar todos los efectos');
select set_config('hc.fail_action','',true);
set local role authenticated;
select lives_ok($$select public.assisted_candidate_command(private.fixture_id('hc-profile',1),2,'accept_consent',
 'demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'Una nueva aceptación usa el flujo afirmativo asistido existente');
select ok(private.current_consent(private.fixture_id('hc-profile',1)),'La aceptación explícita queda vigente');
select is((select status::text from public.candidate_profiles where id=private.fixture_id('hc-profile',1)),'draft','Aceptar no reactiva el perfil automáticamente');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('hc-profile',1) and access_status='active'),0::bigint,'Reaceptar no restaura ninguno de los permisos');
reset role;
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source,recorded_at)
select private.fixture_id('hc-profile',3),version,policy_hash,'withdrawn',private.fixture_id('admin',1),'assisted',clock_timestamp()
from private.consent_policies where version='demo-not-approved';
set local role authenticated;
select lives_ok($$select public.transition_participation(private.fixture_id('hc-part',7),1,'hire','Contratación ficticia')$$,'Puede confirmar un resultado con consentimiento ya retirado');
select is((select count(*) from public.candidate_consents where candidate_id=private.fixture_id('hc-profile',3)),2::bigint,'No duplica un retiro ya vigente');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('hc-profile',3) and access_status='active'),0::bigint,'Revoca permisos activos aunque el consentimiento ya estuviera retirado');
reset role;
select throws_ok($$update public.candidate_consents set status='accepted' where source='hiring_workflow'$$,
 'P0001','APPEND_ONLY','No se reescribe un consentimiento retirado');
select ok(not has_table_privilege('authenticated','public.candidate_consents','INSERT,UPDATE,DELETE'),'Clientes no pueden fingir nueva aceptación o retiro');
select throws_ok($$insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
 select candidate_id,policy_version,policy_hash,'accepted',recorded_by,'hiring_workflow' from original_consents limit 1$$,
 '23514',null,'La fuente automática no puede registrar aceptación');
select * from finish();
rollback;
