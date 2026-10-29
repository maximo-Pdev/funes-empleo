begin;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
-- A fresh fixture also inserts audited facts. Isolate this test's new facts;
-- TRUNCATE is fictional/test-only and the final ROLLBACK restores every row.
truncate public.account_notifications;
insert into auth.sessions(id,user_id) values
 ('ee740000-0000-4000-8000-000000000001',private.fixture_id('candidate',200)),
 ('ee740000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
 ('ee740000-0000-4000-8000-000000000003',private.fixture_id('admin',1)),
 ('ee740000-0000-4000-8000-000000000004',private.fixture_id('admin',2)),
 ('ee740000-0000-4000-8000-000000000005',private.fixture_id('candidate',203));
create function pg_temp.notice_actor(kind text,n integer,suffix text) returns void language plpgsql as $$
begin
 perform set_config('request.jwt.claim.sub',private.fixture_id(kind,n)::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id(kind,n)::text,
 'session_id','ee740000-0000-4000-8000-'||suffix)::text,true);
end $$;
select is((select count(*) from public.account_notifications),0::bigint,'Sin nuevos hechos no aparecen avisos por consultar historia');
select ok((select relrowsecurity from pg_class where oid='public.account_notifications'::regclass),'Tabla expuesta tiene RLS');
select ok(not has_table_privilege('authenticated','public.account_notifications','INSERT,UPDATE,DELETE'),'No hay escrituras directas');
select ok(not has_function_privilege('anon','public.list_my_notifications(integer,integer)','EXECUTE'),'Anónimo no ejecuta lista');
insert into public.job_openings
select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
 'id',private.fixture_id('notice-offer',n),'slug',null,'title','Oferta aviso ficticia '||n,
 'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),
 'status',case when n in(4,5) then 'draft' else 'published' end,'closing_date',current_date+30,'version',1,'archived_at',null))).*
from public.job_openings t cross join generate_series(1,5) n where t.id=private.fixture_id('opening',1);
insert into public.opening_categories(opening_id,category_id)
select private.fixture_id('notice-offer',n),private.fixture_id('category',1) from generate_series(1,5) n;
set local role authenticated;
select pg_temp.notice_actor('candidate',200,'000000000001');
select set_config('notice.self',public.apply_to_opening(private.fixture_id('notice-offer',1),1)::text,true);
reset role;
select is((select count(*) from public.account_notifications where kind='admin_application'),4::bigint,'Postulación propia avisa a los cuatro admins');
select is((select count(*) from public.account_notifications where recipient_account_id=private.fixture_id('candidate',200)),0::bigint,'No avisa al candidato su propia postulación');
set local role authenticated;
select pg_temp.notice_actor('admin',1,'000000000003');
select set_config('notice.nominated',public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('notice-offer',2),1,'admin_nomination')::text,true);
select set_config('notice.late',public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('notice-offer',3),1,'admin_nomination')::text,true);
select lives_ok($$select public.record_preinterview(current_setting('notice.nominated')::uuid,1,'video',clock_timestamp()+interval '1 day',null,'Resumen interno ficticio reservado','preselect','Evaluación ficticia')$$,'Preentrevista real dispara un aviso');
select lives_ok($$select public.transition_participation(current_setting('notice.nominated')::uuid,2,'refer','Evaluación ficticia')$$,'Derivar funciona con evento previo al cambio de estado');
select lives_ok($$select public.transition_participation(current_setting('notice.late')::uuid,1,'refer','Evaluación ficticia')$$,'Otra derivación independiente');
reset role;
select is((select count(*) from public.account_notifications where kind='candidate_nominated'),2::bigint,'Una nominación produce un aviso personal');
select is((select count(*) from public.account_notifications where kind='candidate_preinterview'),1::bigint,'Sin duplicado por transición de etapa');
select is((select count(*) from public.account_notifications where kind='candidate_referred'),2::bigint,'Avisos candidatos de derivación');
select is((select count(*) from public.account_notifications where kind='company_referral'),2::bigint,'Avisos empresa de derivación');
select set_config('notice.referral',(select id::text from public.referrals where participation_id=current_setting('notice.nominated')::uuid),true);
select set_config('notice.late_referral',(select id::text from public.referrals where participation_id=current_setting('notice.late')::uuid),true);
set local role authenticated;
select pg_temp.notice_actor('company',1,'000000000002');
select set_config('notice.feedback',public.submit_company_feedback(current_setting('notice.referral')::uuid,'hired')::text,true);
select set_config('notice.late_feedback',public.submit_company_feedback(current_setting('notice.late_referral')::uuid,'not_selected','Motivo ficticio')::text,true);
reset role;
select is((select count(*) from public.account_notifications where kind='admin_hired_report'),4::bigint,'Informe contratado notifica a cada admin');
select is((select count(*) from public.account_notifications where kind='admin_not_selected_report'),4::bigint,'Informe no seleccionado notifica a cada admin');
select is((select count(*) from public.account_notifications where kind in('candidate_hired','candidate_not_selected')),0::bigint,'Informe pendiente no adelanta resultado al candidato');
set local role authenticated;
select pg_temp.notice_actor('admin',1,'000000000003');
select lives_ok($$select public.transition_participation(current_setting('notice.nominated')::uuid,3,'hire',p_feedback=>current_setting('notice.feedback')::uuid)$$,'Confirmación normal produce aviso');
reset role;
update public.participations set status='no_company_response',final_outcome_at=clock_timestamp(),final_outcome_by=private.fixture_id('admin',1) where id=current_setting('notice.late')::uuid;
set local role authenticated;
select pg_temp.notice_actor('admin',1,'000000000003');
select lives_ok($$select public.transition_participation(current_setting('notice.late')::uuid,3,'late_not_selected','Respuesta tardía ficticia',p_feedback=>current_setting('notice.late_feedback')::uuid)$$,'Confirmación tardía produce aviso');
reset role;
select is((select count(*) from public.account_notifications where kind='candidate_hired'),1::bigint,'Contratación confirmada notifica una vez');
select is((select count(*) from public.account_notifications where kind='candidate_not_selected'),1::bigint,'No selección tardía notifica una vez');
select is((select status::text from public.participations where id=current_setting('notice.self')::uuid),'received','Avisos no modifican otras participaciones');
select is((select availability from public.candidate_profiles where id=private.fixture_id('profile',200)),'unavailable','Contratar conserva regla de disponibilidad');
select is((select status::text from public.candidate_consents where candidate_id=private.fixture_id('profile',200) order by recorded_at desc,id desc limit 1),'accepted','Avisos conservan consentimiento');

set local role authenticated;
select pg_temp.notice_actor('company',1,'000000000002');
select lives_ok($$select public.transition_opening(private.fixture_id('notice-offer',4),1,'submit')$$,'Envío a revisión genera avisos');
select lives_ok($$select public.transition_opening(private.fixture_id('notice-offer',5),1,'submit')$$,'Segundo envío');
select pg_temp.notice_actor('admin',1,'000000000003');
select lives_ok($$select public.transition_opening(private.fixture_id('notice-offer',4),2,'approve')$$,'Publicación genera aviso empresa');
select lives_ok($$select public.transition_opening(private.fixture_id('notice-offer',5),2,'reject','Motivo interno ficticio','Corrección ficticia')$$,'Rechazo genera aviso empresa');
reset role;
select is((select count(*) from public.account_notifications where kind='admin_review'),8::bigint,'Cada envío a revisión avisa a cuatro admins');
select is((select count(*) from public.account_notifications where kind='company_published'),1::bigint,'Solo empresa titular recibe aprobación');
select is((select count(*) from public.account_notifications where kind='company_rejected'),1::bigint,'Solo empresa titular recibe rechazo');
-- Actual completed-company event, excluding raw account registration.
select private.record_event('company_profiles',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),'profile_created',null,'active',private.fixture_id('company',1));
select is((select count(*) from public.account_notifications where kind='admin_company_registered'),4::bigint,'Registro empresarial completo avisa a cuatro admins');
select set_config('notice.before',(select count(*)::text from public.account_notifications),true);
select private.record_event('company_interviews',gen_random_uuid(),'interview_recorded',null,'scheduled',private.fixture_id('company',1));
select private.record_event('participations',current_setting('notice.nominated')::uuid,'participation_advanced','received','under_review',private.fixture_id('admin',1));
select is((select count(*)::text from public.account_notifications),current_setting('notice.before'),'Entrevista empresarial y etapas internas excluidas');
select private.emit_account_notification(a,n.recipient_account_id,n.kind,n.resource_id)
from public.account_notifications n join public.audit_events a on a.id=n.source_event_id;
select is((select count(*)::text from public.account_notifications),current_setting('notice.before'),'Reintentar misma fuente no duplica');

select set_config('notice.adminref',(select reference from public.account_notifications where recipient_account_id=private.fixture_id('admin',1) order by created_at,id limit 1),true);
select set_config('notice.candidateref',(select reference from public.account_notifications where recipient_account_id=private.fixture_id('candidate',200) and kind='candidate_nominated' and resource_id=current_setting('notice.nominated')::uuid),true);
set local role authenticated;
select pg_temp.notice_actor('admin',2,'000000000004');
select throws_ok($$select public.open_my_notification(current_setting('notice.adminref'))$$,'P0001','NOT_FOUND','Otro administrador no lee ni marca aviso ajeno');
select throws_ok($$select public.list_my_notifications(0,20)$$,'P0001','INVALID_INPUT','Paginación validada en DB');
select pg_temp.notice_actor('admin',1,'000000000003');
select is(jsonb_array_length(public.list_my_notifications(1,5)->'items'),5,'Cinco avisos recientes');
select lives_ok($$select public.open_my_notification(current_setting('notice.adminref'))$$,'Titular abre aviso');
select set_config('notice.read',(public.open_my_notification(current_setting('notice.adminref'))->>'readAt'),true);
select is(public.open_my_notification(current_setting('notice.adminref'))->>'readAt',current_setting('notice.read'),'Apertura repetida conserva fecha inicial');
select pg_temp.notice_actor('candidate',200,'000000000001');
select is(jsonb_array_length(public.my_candidate_preinterview_agenda()),1,'Agenda propia muestra la preentrevista');
select is(public.my_candidate_preinterview_agenda()->0->>'channel','video','Agenda muestra canal');
select ok(not (public.my_candidate_preinterview_agenda()::text ~ 'summary|recommendation|Resumen|[0-9a-f]{8}-[0-9a-f]{4}-'),'Agenda sin datos internos ni UUID');
select ok(not (public.list_my_notifications()::text ~ 'Resumen|Motivo interno|summary|recommendation|[0-9a-f]{8}-[0-9a-f]{4}-'),'Avisos no filtran notas ni UUID');
select pg_temp.notice_actor('candidate',203,'000000000005');
select is(jsonb_array_length(public.my_candidate_preinterview_agenda()),0,'Agenda ajena no se expone');
select throws_ok($$select public.open_my_notification(current_setting('notice.candidateref'))$$,'P0001','NOT_FOUND','Candidato no abre aviso ajeno');
reset role;
select ok(exists(select 1 from public.account_notifications where recipient_account_id=private.fixture_id('admin',2) and read_at is null),'Lectura de admin1 no marca admin2');
-- Exercise ownership RLS even if a future migration adds a SELECT grant.
grant select on public.account_notifications to authenticated;
set local role authenticated;
select pg_temp.notice_actor('admin',1,'000000000003');
select is((select count(*) from public.account_notifications where recipient_account_id<>private.fixture_id('admin',1)),0::bigint,'RLS no da visibilidad de otros avisos por ser administrador');
select throws_ok($$update public.account_notifications set read_at=clock_timestamp()$$,'42501',null,'Escritura directa sigue denegada');
reset role;
update public.accounts set status='suspended',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1),suspended_reason='Prueba ficticia de avisos' where id=private.fixture_id('admin',2);
set local role authenticated;
select pg_temp.notice_actor('admin',2,'000000000004');
select throws_ok($$select public.list_my_notifications()$$,'P0001','AUTH_REQUIRED','Cuenta suspendida no consulta avisos');
select is((select count(*) from public.account_notifications),0::bigint,'RLS también bloquea cuenta suspendida');
reset role;
select set_config('notice.suspended_admin',(select count(*)::text from public.account_notifications where recipient_account_id=private.fixture_id('admin',2)),true);
select private.record_event('job_openings',private.fixture_id('notice-offer',4),'opening_submitted','published','pending_review',private.fixture_id('company',1));
select is((select count(*)::text from public.account_notifications where recipient_account_id=private.fixture_id('admin',2)),current_setting('notice.suspended_admin'),'Fanout no entrega a administradores suspendidos');
update public.accounts set status='active',suspended_at=null,suspended_by=null,suspended_reason=null where id=private.fixture_id('admin',2);
-- No linked account means there is no personal recipient and no deferred backfill.
insert into public.candidate_profiles
select (jsonb_populate_record(null::public.candidate_profiles,to_jsonb(c)||jsonb_build_object('id',private.fixture_id('notice-assisted',1),'account_id',null,'origin','assisted','managed_by_admin_id',private.fixture_id('admin',1)))).*
from public.candidate_profiles c where c.id=private.fixture_id('profile',499);
insert into public.participations
select (jsonb_populate_record(null::public.participations,to_jsonb(p)||jsonb_build_object('id',private.fixture_id('notice-assisted-part',1),
 'candidate_id',private.fixture_id('notice-assisted',1),'opening_id',private.fixture_id('notice-offer',1),'application_cv_document_id',null,'origin','admin_nomination'))).*
from public.participations p where p.id=current_setting('notice.self')::uuid;
select set_config('notice.assisted_count',(select count(*)::text from public.account_notifications),true);
select private.record_event('participations',private.fixture_id('notice-assisted-part',1),'participation_created',null,'received',private.fixture_id('admin',1));
select is((select count(*)::text from public.account_notifications),current_setting('notice.assisted_count'),'Perfil asistido sin cuenta no recibe aviso personal ficticio');
update public.participations set archived_at=clock_timestamp(),archived_by=private.fixture_id('admin',1) where id=current_setting('notice.nominated')::uuid;
set local role authenticated;
select pg_temp.notice_actor('candidate',200,'000000000001');
select is(public.open_my_notification(current_setting('notice.candidateref'))->>'available','false','Archivo elimina destino actual');
select is(public.open_my_notification(current_setting('notice.candidateref'))->'subject','null'::jsonb,'Archivo no conserva asunto personal');
reset role;
update auth.sessions set not_after=clock_timestamp()-interval '1 minute' where id='ee740000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.list_my_notifications()$$,'P0001','AUTH_REQUIRED','Sesión revocada no lee');
reset role;
-- A failure to persist a notification must abort the workflow and source audit.
create function pg_temp.fail_notification() returns trigger language plpgsql as $$
begin raise exception 'NOTIFICATION_WRITE_FAILURE'; end $$;
create trigger notice_write_failure before insert on public.account_notifications for each row execute function pg_temp.fail_notification();
select set_config('notice.auditcount',(select count(*)::text from public.audit_events),true);
set local role authenticated;
select pg_temp.notice_actor('candidate',203,'000000000005');
select throws_ok($$select public.apply_to_opening(private.fixture_id('notice-offer',1),1)$$,'P0001','NOTIFICATION_WRITE_FAILURE','Fallo de aviso revierte postulación');
reset role;
select is((select count(*)::text from public.audit_events),current_setting('notice.auditcount'),'Rollback no deja auditoría parcial');
select is((select count(*) from public.participations where candidate_id=private.fixture_id('profile',203) and opening_id=private.fixture_id('notice-offer',1)),0::bigint,'Rollback no deja participación parcial');
select * from finish();
rollback;
