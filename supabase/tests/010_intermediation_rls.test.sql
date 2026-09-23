-- US1: isolated fictitious assertions; rolled back after pgTAP.
begin;
select no_plan();

select has_function('public','transition_opening',array['uuid','integer','text','text','text'], 'La moderación se ejecuta en una función atómica');
select has_function('public','transition_participation',array['uuid','integer','text','text','uuid','uuid','uuid'], 'La participación usa transición atómica');
select has_function('public','company_referral',array['uuid'], 'Proyección empresarial protegida');
select has_function('public','company_referral_references',array['uuid'], 'Referencia no personal tras revocar');
select has_function('public','admin_workflow_timeline',array['text','uuid'], 'Solo administración reconstruye motivos y estados');
select has_function('private','can_read_cv',array['uuid'], 'CV revalida derivación en base');
select ok(not has_table_privilege('authenticated','public.participations','UPDATE,DELETE'), 'Ningún cliente actualiza participaciones directamente');
select ok(not has_table_privilege('authenticated','public.referrals','INSERT,UPDATE,DELETE'), 'La derivación no es editable directamente');
select ok(not has_table_privilege('authenticated','public.audit_events','INSERT,UPDATE,DELETE'), 'La auditoría es inmutable para clientes');
select ok(not has_table_privilege('authenticated','public.candidate_private_data','UPDATE,DELETE'), 'DNI y domicilio no pueden mutarse por empresa');

-- Live sessions for isolated fictional actors from the local seed.
-- The deterministic fixture helper is available only inside this rolled-back test transaction.
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
  ('ee000000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
  ('ee000000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
  ('ee000000-0000-4000-8000-000000000003',private.fixture_id('company',2)),
  ('ee000000-0000-4000-8000-000000000004',private.fixture_id('candidate',200)),
  ('ee000000-0000-4000-8000-000000000005',private.fixture_id('candidate',203));

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('opening',1),1,'admin_nomination')$$,
  'Solo administración nomina al candidato ficticio');
select set_config('us1.participation',(select id::text from public.participations
  where candidate_id=private.fixture_id('profile',200) and opening_id=private.fixture_id('opening',1)),true);
select throws_ok($$select public.transition_participation((select id from public.participations where candidate_id=private.fixture_id('profile',200) and opening_id=private.fixture_id('opening',1)),1,'refer',null)$$,
  'P0001','INVALID_INPUT','Un salto de etapas sin motivo no deriva');
select lives_ok($$select public.transition_participation((select id from public.participations where candidate_id=private.fixture_id('profile',200) and opening_id=private.fixture_id('opening',1)),1,'refer','Evaluación municipal ficticia')$$,
  'La Oficina deriva explícitamente y guarda el salto motivado');
select set_config('us1.referral',(select r.id::text from public.referrals r
  where r.participation_id=current_setting('us1.participation')::uuid),true);
select is((select r.cv_document_id from public.referrals r join public.participations p on p.id=r.participation_id where p.candidate_id=private.fixture_id('profile',200) and p.opening_id=private.fixture_id('opening',1)),
  private.fixture_id('cv',200),'Derivación fija el CV exacto');
select is((select r.consent_event_id from public.referrals r join public.participations p on p.id=r.participation_id where p.candidate_id=private.fixture_id('profile',200) and p.opening_id=private.fixture_id('opening',1)),
  private.fixture_id('consent',200),'Derivación fija el consentimiento vigente');
select ok((select r.feedback_due_at = r.referred_at + interval '720 hours' from public.referrals r join public.participations p on p.id=r.participation_id where p.candidate_id=private.fixture_id('profile',200) and p.opening_id=private.fixture_id('opening',1)),
  'El plazo de respuesta es exactamente 720 horas');
select ok(exists(select 1 from public.audit_events where entity_type='participations' and action='stage_skipped'
  and reason_code='decision_recorded' and metadata_safe ? 'decision_id' and actor_account_id=private.fixture_id('admin',1)),
  'El salto conserva actor y referencia opaca al motivo');

reset role;
insert into public.candidate_contacts(id,candidate_id,kind,value,normalized_value)
values(private.fixture_id('us1-contact',1),private.fixture_id('profile',200),'phone',
  '+000000000001','+000000000001');
update public.cv_documents set status='superseded',superseded_at=clock_timestamp()
  where id=private.fixture_id('cv',200);
insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,
  sha256,status,validation_result,uploaded_by)
values(private.fixture_id('us1-cv',1),private.fixture_id('profile',200),
  private.fixture_id('profile',200)::text||'/'||private.fixture_id('us1-cv',1)::text||'.pdf',
  'cv-ficticio-nuevo.pdf','application/pdf',608,repeat('0',64),'valid','fictitious_fixture',
  private.fixture_id('candidate',200));
set local role authenticated;

select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select is((select count(*) from public.candidate_profiles),0::bigint,'Empresa no navega el padrón');
select is((select count(*) from public.candidate_private_data),0::bigint,'Empresa no consulta DNI ni domicilio');
select is((select count(*) from public.internal_notes),0::bigint,'Empresa no consulta notas internas');
select ok((public.company_referral(current_setting('us1.referral')::uuid)->'candidate') ? 'cvDocumentId',
  'Proyección propia entrega el identificador de CV autorizado');
select is(jsonb_array_length(public.company_referral(current_setting('us1.referral')::uuid)->'candidate'->'contacts'),
  2,'Proyección incluye todos los contactos vigentes, incluso posteriores a la derivación');
select is((public.company_referral(current_setting('us1.referral')::uuid)->'candidate'->>'cvDocumentId')::uuid,
  private.fixture_id('cv',200),'Reemplazar el CV no cambia la versión derivada');
select ok(private.can_read_cv(private.fixture_id('cv',200)),'Empresa propia puede descargar solo el CV derivado');
select ok(not private.can_read_cv(private.fixture_id('us1-cv',1)),'Empresa no descarga el CV nuevo no derivado');

select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2)::text,'session_id','ee000000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.company_referral(current_setting('us1.referral')::uuid)$$,
  'P0001','NOT_FOUND','Empresa ajena no descubre la derivación');
select throws_ok($$select public.transition_participation(current_setting('us1.participation')::uuid,2,'hire')$$,
  'P0001','NOT_FOUND','Empresa no confirma contratación');
select throws_ok($$select public.transition_participation(current_setting('us1.participation')::uuid,2,'preselect')$$,
  'P0001','NOT_FOUND','Empresa no realiza la preselección municipal');

select set_config('request.jwt.claim.sub',private.fixture_id('candidate',200)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',200)::text,'session_id','ee000000-0000-4000-8000-000000000004')::text,true);
select lives_ok($$select public.transition_participation(current_setting('us1.participation')::uuid,2,'withdraw')$$,
  'Candidato retira su nominación administrativa');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select is((select count(*) from jsonb_object_keys(public.company_referral(current_setting('us1.referral')::uuid))),
  4::bigint,'Tras revocación solo quedan cuatro campos no personales');
select ok(not private.can_read_cv(private.fixture_id('cv',200)),'Retiro revoca la descarga inmediatamente');

select set_config('request.jwt.claim.sub',private.fixture_id('candidate',203)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',203)::text,'session_id','ee000000-0000-4000-8000-000000000005')::text,true);
select set_config('us1.self_application',public.create_participation(private.fixture_id('profile',203),1,
  private.fixture_id('opening',1),1,'self_application')::text,true);
select ok(length(current_setting('us1.self_application'))=36,
  'Candidato crea una postulación propia sobre una oferta publicada');
select lives_ok($$select public.transition_participation(current_setting('us1.self_application')::uuid,1,'withdraw')$$,
  'Candidato también puede retirar su postulación propia');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select is((select status::text from public.participations where id=current_setting('us1.self_application')::uuid),
  'withdrawn','El retiro propio conserva el origen y cierra solo ese caso');

select lives_ok($$select public.create_participation(private.fixture_id('profile',201),1,private.fixture_id('opening',1),1,'admin_nomination')$$,
  'Otra nominación queda abierta para probar retiro asistido');
select set_config('us1.admin_withdrawal',(select id::text from public.participations where candidate_id=private.fixture_id('profile',201) and opening_id=private.fixture_id('opening',1)),true);
select throws_ok($$select public.transition_participation(current_setting('us1.admin_withdrawal')::uuid,1,'withdraw')$$,
  'P0001','INVALID_INPUT','Administrador no retira sin solicitud registrada');
select lives_ok($$select public.record_contact(current_setting('us1.admin_withdrawal')::uuid,1,'in_person','inbound',clock_timestamp()-interval '1 minute','Solicitud ficticia de retiro')$$,
  'La solicitud presencial queda registrada por el administrador');
select set_config('us1.withdrawal_request',(select id::text from public.contact_events where participation_id=current_setting('us1.admin_withdrawal')::uuid limit 1),true);
select lives_ok($$select public.transition_participation(current_setting('us1.admin_withdrawal')::uuid,2,'withdraw',null,current_setting('us1.withdrawal_request')::uuid)$$,
  'Administrador registra retiro solicitado sin cambiar otros casos');
select is((select status::text from public.participations where id=current_setting('us1.admin_withdrawal')::uuid),
  'withdrawn','La nominación asistida termina como retirada');
select lives_ok($$select public.create_participation(private.fixture_id('profile',202),1,private.fixture_id('opening',1),1,'admin_nomination')$$,
  'Caso separado para cancelación individual');
select set_config('us1.individual_cancel',(select id::text from public.participations where candidate_id=private.fixture_id('profile',202) and opening_id=private.fixture_id('opening',1)),true);
select throws_ok($$select public.transition_participation(current_setting('us1.individual_cancel')::uuid,1,'cancel')$$,
  'P0001','INVALID_INPUT','Cancelar un caso individual exige motivo');
select lives_ok($$select public.transition_participation(current_setting('us1.individual_cancel')::uuid,1,'cancel','Motivo operativo ficticio')$$,
  'La Oficina cancela solo ese caso');
select is((select status::text from public.job_openings where id=private.fixture_id('opening',1)),
  'published','La cancelación individual no cancela la oferta');
select throws_ok($$select public.transition_participation(current_setting('us1.individual_cancel')::uuid,1,'cancel','Motivo repetido')$$,
  'P0001','CONFLICT_STALE_DATA','Conflicto de versión no duplica cancelación ni historial');
select lives_ok($$select public.create_participation(private.fixture_id('profile',204),1,private.fixture_id('opening',1),1,'admin_nomination')$$,
  'Nominación separada para feedback de proceso cancelado');
select set_config('us1.process_cancel',(select id::text from public.participations where
  candidate_id=private.fixture_id('profile',204) and opening_id=private.fixture_id('opening',1)),true);
select lives_ok($$select public.transition_participation(current_setting('us1.process_cancel')::uuid,1,'refer','Salto ficticio')$$,
  'La Oficina deriva explícitamente el caso a cancelar');
select set_config('us1.process_referral',(select id::text from public.referrals where
  participation_id=current_setting('us1.process_cancel')::uuid),true);
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select set_config('us1.process_feedback',public.submit_company_feedback(current_setting('us1.process_referral')::uuid,
  'process_cancelled','Proceso ficticio cancelado')::text,true);
select ok(length(current_setting('us1.process_feedback'))=36,
  'Empresa comunica cancelación de una persona sin cancelar la oferta');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.transition_participation(current_setting('us1.process_cancel')::uuid,2,
  'cancel','Decisión municipal ficticia',null,current_setting('us1.process_feedback')::uuid)$$,
  'La Oficina acepta ese feedback y cancela solo la participación');
select is((select review_status::text from public.company_feedback where id=current_setting('us1.process_feedback')::uuid),
  'accepted','La comunicación que fundamenta la cancelación queda revisada');
select is((select status::text from public.job_openings where id=private.fixture_id('opening',1)),
  'published','La cancelación informada no cancela la oferta');

reset role;
insert into public.job_openings(id,company_id,title,tasks,requirements,vacancies,location,
  modality,schedule,contract_type,closing_date,status)
values(private.fixture_id('us1-opening',1),private.fixture_id('business',1),'Oferta ficticia US1',
  'Tareas ficticias','Requisitos ficticios',1,'Funes','onsite','Horario ficticio','fixed_term',
  '2026-12-31','draft');
insert into public.opening_categories(opening_id,category_id)
values(private.fixture_id('us1-opening',1),private.fixture_id('category',1));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select lives_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),1,'submit')$$,
  'Empresa solo envía borrador a revisión');
select throws_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),2,'approve')$$,
  'P0001','FORBIDDEN','Empresa no publica directamente');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),1,'approve')$$,
  'P0001','CONFLICT_STALE_DATA','Versión obsoleta no aprueba la oferta');
select lives_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),2,'approve')$$,
  'Solo la Oficina aprueba y publica');
select throws_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),3,'pause')$$,
  'P0001','INVALID_INPUT','Pausa municipal exige motivo interno');
select lives_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),3,'pause','Motivo ficticio')$$,
  'Pausa conserva estado y motivo interno');
select is((select moderation_message_public from public.job_openings where id=private.fixture_id('us1-opening',1)),
  null::text,'La empresa no ve motivo interno de la pausa');
select lives_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),4,'resume')$$,
  'Reanudar no requiere motivo');
select lives_ok($$select public.transition_opening(private.fixture_id('us1-opening',1),5,'close','Cierre ficticio')$$,
  'Cerrar oferta conserva participaciones existentes');
select ok(exists(select 1 from public.audit_events where entity_id=private.fixture_id('us1-opening',1)
  and action='opening_closed' and actor_account_id=private.fixture_id('admin',1)),
  'Moderación tiene actor individual y auditoría');

reset role;
-- A separate old referral exercises the exact deadline without moving the clock
-- or waiting for the seed's 1,000 newer referrals.
insert into public.participations(id,candidate_id,opening_id,origin,created_by,status,feedback_due_at)
values(private.fixture_id('us1-part',1),private.fixture_id('profile',210),private.fixture_id('opening',1),
  'admin_nomination',private.fixture_id('admin',1),'referred','2026-09-19 12:00:00+00');
insert into public.referrals(id,participation_id,candidate_id,referred_by,referred_at,access_status,
  consent_event_id,cv_document_id,feedback_due_at,access_changed_actor_type,
  access_changed_by_account_id,access_change_reason)
values(private.fixture_id('us1-referral',1),private.fixture_id('us1-part',1),private.fixture_id('profile',210),
  private.fixture_id('admin',1),'2026-08-20 12:00:00+00','active',
  private.fixture_id('consent',210),private.fixture_id('cv',210),'2026-09-19 12:00:00+00',
  'account',private.fixture_id('admin',1),'referral_created');
select is(private.run_daily_employment_maintenance('2026-09-19 11:59:59.999999+00')->>'noCompanyResponse','0',
  'No hay cierre antes del instante exacto');
select is((select status::text from public.participations where id=private.fixture_id('us1-part',1)),
  'referred','El caso sigue abierto un microsegundo antes');
select is(private.run_daily_employment_maintenance('2026-09-19 12:00:00+00')->>'noCompanyResponse','1',
  'El cierre ocurre en el instante exacto');
select is((select access_status::text from public.referrals where id=private.fixture_id('us1-referral',1)),
  'revoked','Sin respuesta revoca el acceso en la misma transacción');
select is(private.run_daily_employment_maintenance('2026-09-19 12:00:00+00')->>'noCompanyResponse','0',
  'La automatización repetida no duplica cierres');
select is((select count(*) from public.audit_events where entity_id=private.fixture_id('us1-part',1) and action='no_company_response'),
  1::bigint,'El cierre automático conserva un único evento system');
select is((select actor_type from public.audit_events where entity_id=private.fixture_id('us1-part',1) and action='no_company_response'),
  'system','El actor del cierre automático es system');

insert into public.job_openings(id,company_id,title,tasks,requirements,vacancies,location,modality,
  schedule,contract_type,closing_date,status,published_at)
values(private.fixture_id('us1-expiring',1),private.fixture_id('business',1),'Oferta ficticia por vencer',
  'Tareas ficticias','Requisitos ficticios',1,'Funes','onsite','Horario ficticio','fixed_term',
  '2026-09-19','published','2026-09-18 12:00:00+00');
insert into public.participations(id,candidate_id,opening_id,origin,created_by,status)
values(private.fixture_id('us1-existing',1),private.fixture_id('profile',211),
  private.fixture_id('us1-expiring',1),'self_application',private.fixture_id('candidate',211),'received');
select is(private.run_daily_employment_maintenance('2026-09-20 02:59:59.999999+00')->>'closedOpenings','0',
  'La oferta sigue publicada hasta terminar su fecha en Funes');
select is(private.run_daily_employment_maintenance('2026-09-20 03:00:00+00')->>'closedOpenings','1',
  'La oferta cierra al límite exclusivo local');
select is((select status::text from public.participations where id=private.fixture_id('us1-existing',1)),
  'received','El cierre automático no termina participaciones previas');
select is(private.run_daily_employment_maintenance('2026-09-20 03:00:00+00')->>'closedOpenings','0',
  'No duplica el cierre de oferta');
select is((select count(*) from public.audit_events where entity_id=private.fixture_id('us1-expiring',1)
  and action='opening_auto_closed' and actor_type='system'),1::bigint,
  'Cierre automático registra un solo evento system');

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select lives_ok($$select public.submit_company_feedback(private.fixture_id('us1-referral',1),'hired','Respuesta ficticia tardía')$$,
  'Empresa informa tarde usando solo referencia no personal');
select is((select count(*) from jsonb_object_keys(public.company_referral(private.fixture_id('us1-referral',1)))),
  4::bigint,'El feedback no restablece datos privados');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.transition_participation(private.fixture_id('us1-part',1),2,'late_hire','Corrección ficticia')$$,
  'P0001','INVALID_INPUT','Corrección tardía sin evidencia se rechaza');
select lives_ok($$select public.transition_participation(private.fixture_id('us1-part',1),2,'late_hire','Corrección ficticia',null,
  (select id from public.company_feedback where referral_id=private.fixture_id('us1-referral',1) limit 1))$$,
  'Administrador corrige con feedback propio registrado');
select is((select status::text from public.participations where id=private.fixture_id('us1-part',1)),
  'hired','El resultado vigente es contratación');
select is((select access_status::text from public.referrals where id=private.fixture_id('us1-referral',1)),
  'revoked','La corrección tardía no reabre el permiso');
select is((select count(*) from public.audit_events where entity_id=private.fixture_id('us1-part',1) and action in ('no_company_response','outcome_corrected')),
  2::bigint,'El historial conserva cierre automático y corrección');

reset role;
insert into public.participations(id,candidate_id,opening_id,origin,created_by,status,feedback_due_at)
values(private.fixture_id('us1-part',2),private.fixture_id('profile',206),private.fixture_id('opening',1),
  'admin_nomination',private.fixture_id('admin',1),'referred','2026-09-19 12:00:00+00');
insert into public.referrals(id,participation_id,candidate_id,referred_by,referred_at,access_status,
  consent_event_id,cv_document_id,feedback_due_at,access_changed_actor_type,
  access_changed_by_account_id,access_change_reason)
values(private.fixture_id('us1-referral',2),private.fixture_id('us1-part',2),private.fixture_id('profile',206),
  private.fixture_id('admin',1),'2026-08-20 12:00:00+00','active',
  private.fixture_id('consent',206),private.fixture_id('cv',206),'2026-09-19 12:00:00+00',
  'account',private.fixture_id('admin',1),'referral_created');
select is(private.run_daily_employment_maintenance('2026-09-19 12:00:00+00')->>'noCompanyResponse','1',
  'Segundo caso se cierra sin respuesta al límite');
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.record_contact(private.fixture_id('us1-part',2),2,'phone','inbound',
  clock_timestamp()-interval '1 minute','Respuesta tardía ficticia recibida por la Oficina')$$,
  'Contacto municipal fechado registra la evidencia alternativa');
select set_config('us1.late_contact',(select id::text from public.contact_events where
  participation_id=private.fixture_id('us1-part',2)),true);
select lives_ok($$select public.transition_participation(private.fixture_id('us1-part',2),3,
  'late_not_selected','Corrección municipal ficticia',null,null,current_setting('us1.late_contact')::uuid)$$,
  'Oficina corrige falta de respuesta usando contacto municipal vinculado');
select is((select status::text from public.participations where id=private.fixture_id('us1-part',2)),
  'not_selected','La corrección por contacto queda como resultado vigente');
select is((select access_status::text from public.referrals where id=private.fixture_id('us1-referral',2)),
  'revoked','El contacto tardío no reactiva acceso empresarial');

reset role;
update public.referrals set post_hire_access_until=clock_timestamp()-interval '1 second'
where id=private.fixture_id('referral',1);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select ok(not private.can_company_read_referral(private.fixture_id('referral',1)),
  'El límite poscontratación niega esta derivación antes de que Cron materialice revocación');
reset role;
select is(private.run_daily_employment_maintenance(clock_timestamp())->>'expiredPostHireAccess','1',
  'Cron materializa una revocación poscontratación vencida');
select is((select access_change_reason from public.referrals where id=private.fixture_id('referral',1)),
  'post_hire_window_ended','La revocación lleva el motivo aprobado');
select is(private.run_daily_employment_maintenance(clock_timestamp())->>'expiredPostHireAccess','0',
  'No duplica eventos de vencimiento poscontratación');

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.transition_opening(private.fixture_id('opening',2),1,'cancel','Cancelación ficticia')$$,
  'Cancelar oferta completa cierra sus participaciones todavía abiertas');
select is((select count(*) from public.participations where opening_id=private.fixture_id('opening',2)
  and status not in ('hired','not_selected','withdrawn','cancelled','no_company_response')),
  0::bigint,'No quedan casos abiertos tras cancelación de la oferta');
select is((select status::text from public.participations where id=private.fixture_id('participation',11)),
  'hired','Contratación final previa no se modifica');
select is((select access_status::text from public.referrals where id=private.fixture_id('referral',15)),
  'revoked','Cancelar oferta revoca permisos de casos que seguían abiertos');

reset role;
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
values(private.fixture_id('profile',5),'demo-not-approved',repeat('0',64),'withdrawn',
  private.fixture_id('candidate',5),'self_service');
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select ok(not private.can_company_read_referral(private.fixture_id('referral',5)),
  'Retiro de consentimiento deniega nueva lectura aun antes de materializar revocación');
select is((select count(*) from jsonb_object_keys(public.company_referral(private.fixture_id('referral',5)))),
  4::bigint,'La proyección no revela datos con consentimiento retirado');

select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.change_account_status(private.fixture_id('candidate',6),1,'suspend','Motivo ficticio',true)$$,
  'Suspensión de candidato revoca acceso empresarial sin finalizar caso');
select is((select access_status::text from public.referrals where id=private.fixture_id('referral',6)),
  'revoked','Suspensión materializa revocación');
select is((select status::text from public.participations where id=private.fixture_id('participation',6)),
  'referred','Suspensión no fabrica resultado final');
select lives_ok($$select public.change_account_status(private.fixture_id('candidate',205),1,'suspend','Motivo ficticio',true)$$,
  'La Oficina suspende otra cuenta ficticia antes de una nominación');
select throws_ok($$select public.create_participation(private.fixture_id('profile',205),1,
  private.fixture_id('opening',1),1,'admin_nomination')$$,
  'P0001','INVALID_TRANSITION','Una cuenta candidata suspendida no ingresa a nuevas nominaciones');

reset role;
update public.candidate_profiles set status='archived',archived_at=clock_timestamp(),
  archived_by=private.fixture_id('admin',1) where id=private.fixture_id('profile',7);
update public.referrals set access_status='revoked',access_changed_at=clock_timestamp(),
  access_changed_actor_type='account',access_changed_by_account_id=private.fixture_id('admin',1),
  access_change_reason='process_cancelled' where id=private.fixture_id('referral',8);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee000000-0000-4000-8000-000000000002')::text,true);
select ok(not private.can_company_read_referral(private.fixture_id('referral',7)),
  'Perfil archivado deniega datos empresariales aunque persista la derivación');
select ok(not private.can_company_read_referral(private.fixture_id('referral',8)),
  'Permiso revocado deniega datos y no puede reactivarse por lectura');
select throws_ok($$update public.audit_events set action='feedback_recorded'$$,
  '42501',null,'Rol de aplicación no modifica historial');
select throws_ok($$update public.company_feedback set message='reescritura'$$,
  '42501',null,'Empresa no reescribe feedback existente');
select throws_ok($$select * from public.admin_workflow_timeline('participations',current_setting('us1.individual_cancel')::uuid)$$,
  'P0001','FORBIDDEN','Empresa no consulta motivos del historial municipal');

reset role;
create function private.fail_us1_audit() returns trigger language plpgsql set search_path='' as $$
begin
  if (new.entity_id=private.fixture_id('opening',3) and new.action='opening_paused')
    or (new.entity_id=private.fixture_id('referral',9) and new.action='referral_revoked') then
    raise exception 'INJECTED_AUDIT_FAILURE';
  end if;
  return new;
end $$;
create trigger fail_us1_audit before insert on public.audit_events
for each row execute function private.fail_us1_audit();
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee000000-0000-4000-8000-000000000001')::text,true);
select ok(exists(select 1 from public.admin_workflow_timeline('participations',current_setting('us1.individual_cancel')::uuid)
  where reason='Motivo operativo ficticio' and previous_state='under_review' and new_state='cancelled'),
  'La Oficina reconstruye motivo y estados de una cancelación individual');
select throws_ok($$select public.transition_opening(private.fixture_id('opening',3),1,'pause','Motivo ficticio')$$,
  'P0001','INJECTED_AUDIT_FAILURE','Falla forzada de auditoría aborta transición completa');
select is((select status::text from public.job_openings where id=private.fixture_id('opening',3)),
  'published','Falla de auditoría revierte estado de oferta');
select is((select version from public.job_openings where id=private.fixture_id('opening',3)),
  1,'Falla de auditoría no consume versión');
select is((select count(*) from public.opening_moderation_events where opening_id=private.fixture_id('opening',3)
  and decision='paused'),0::bigint,'Falla de auditoría revierte evento de moderación');
select throws_ok($$select public.transition_participation(private.fixture_id('participation',9),1,'cancel','Motivo ficticio')$$,
  'P0001','INJECTED_AUDIT_FAILURE','Falla al auditar permiso aborta cancelación completa');
select is((select status::text from public.participations where id=private.fixture_id('participation',9)),
  'referred','Falla de auditoría revierte estado de participación');
select is((select access_status::text from public.referrals where id=private.fixture_id('referral',9)),
  'active','Falla de auditoría revierte revocación de permiso');
select ok(not has_function_privilege('authenticated','private.run_daily_employment_maintenance(timestamptz)','EXECUTE'),
  'La función programada no se invoca como usuario interactivo');

select * from finish();
rollback;
