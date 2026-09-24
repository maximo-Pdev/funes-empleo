-- US2: only fictitious local identities. All mutations are rolled back.
begin;
select no_plan();
select has_function('public','bootstrap_candidate',array['text','text'],'Alta verificada crea perfil o deja reclamo presencial');
select has_function('public','save_candidate_profile',array['integer','text','text','text','text','text','text','text','uuid[]'],'Corrección propia transaccional');
select has_function('public','change_candidate_consent',array['integer','text','text','text'],'Consentimiento versionado y retiro atómico');
select has_function('public','my_candidate_participations',array[]::text[],'Proyección limitada del candidato');
select has_function('public','published_offers',array['integer','integer','uuid'],'Proyección pública de ofertas');
select has_function('public','refresh_candidate_freshness',array['uuid'],'Vigencia a demanda atribuida a una cuenta');
select ok(not has_table_privilege('authenticated','public.candidate_profiles','UPDATE,DELETE'),'Perfil no admite mutación directa');
select ok(not has_table_privilege('authenticated','public.candidate_consents','INSERT,UPDATE,DELETE'),'Consentimiento solo por función append-only');
select ok(not has_table_privilege('authenticated','public.cv_documents','INSERT,UPDATE,DELETE'),'Metadatos CV solo por función protegida');
select ok(not has_table_privilege('anon','public.candidate_profiles','SELECT'),'Anónimo sin padrón');

set local role anon;
select ok((public.published_offers(1,2,null)->>'total')::integer > 0,'Público consulta ofertas vigentes');
select ok(not ((public.published_offers(1,1,null)->'items'->0) ?| array['cuit_normalized','responsible_name','email','phone','version']),
  'Proyección pública excluye datos privados y versión interna');
select throws_ok($$select public.my_candidate_participations()$$,'42501','permission denied for function my_candidate_participations','Anónimo no consulta participaciones');
reset role;

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee200000-0000-4000-8000-000000000001',private.fixture_id('candidate',5)),
 ('ee200000-0000-4000-8000-000000000002',private.fixture_id('candidate',6)),
 ('ee200000-0000-4000-8000-000000000003',private.fixture_id('admin',1)),
 ('ee200000-0000-4000-8000-000000000004',private.fixture_id('company',1));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',5)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',5)::text,'session_id','ee200000-0000-4000-8000-000000000001')::text,true);
select is((select count(*) from public.candidate_profiles),1::bigint,'Candidato solo ve su perfil');
select is((select count(*) from public.candidate_private_data),1::bigint,'Candidato solo ve su DNI y domicilio');
select is((select count(*) from public.candidate_contacts),1::bigint,'Candidato solo ve sus contactos');
select is((select count(*) from public.candidate_consents),1::bigint,'Candidato solo ve sus consentimientos');
select is((select count(*) from public.cv_documents),1::bigint,'Candidato solo ve sus metadatos CV');
select is((select count(*) from public.internal_notes),0::bigint,'Notas internas ocultas');
select is((select count(*) from public.participations),0::bigint,'Tabla de etapas internas no se expone');
select ok((select count(*) from public.my_candidate_participations())=2,'Proyección contiene solo casos propios');
select ok(not exists(select 1 from public.my_candidate_participations() where display_status not in
  ('received','hired','not_selected','withdrawn','cancelled','no_company_response')),'La proyección no revela etapas internas');
select throws_ok($$select public.save_candidate_profile(1,'Intruso','90000006','Funes','Prueba','available','', '',array[]::uuid[])$$,
  'P0001','DUPLICATE_PROFILE','DNI ajeno no se puede tomar');
select lives_ok($$select public.save_candidate_profile(1,'Persona ficticia 005','90000005','Funes','Experiencia ficticia','available','','',
  array[private.fixture_id('category',1),private.fixture_id('category',2)])$$,'Corrección propia admite varias categorías');
select is((select count(*) from public.candidate_categories where candidate_id=private.fixture_id('profile',5)),2::bigint,'Se guardan ambas categorías');
select throws_ok($$select public.save_candidate_profile(1,'Nombre obsoleto','90000005','Funes','Prueba','available','','',array[]::uuid[])$$,
  'P0001','CONFLICT_STALE_DATA','Versión obsoleta no sobrescribe cambios');
reset role;
insert into public.participations(id,candidate_id,opening_id,origin,created_by,status,final_outcome_at,final_outcome_by)
values('ee500000-0000-4000-8000-000000000002',private.fixture_id('profile',5),
  private.fixture_id('opening',70),'self_application',private.fixture_id('candidate',5),
  'not_selected',clock_timestamp(),private.fixture_id('admin',1));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',5)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',5)::text,
  'session_id','ee200000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.change_candidate_consent(2,'withdrawn','demo-not-approved',
  (select policy_hash from public.candidate_consent_policy()))$$,'Retiro de consentimiento transaccional');
select is((select count(*) from public.my_candidate_participations() where display_status='withdrawn'),2::bigint,
  'Retiro cierra todas las participaciones abiertas');
select is((select display_status from public.my_candidate_participations()
  where id='ee500000-0000-4000-8000-000000000002'),'not_selected',
  'Retiro de consentimiento conserva resultados finales previos');
select throws_ok($$select public.change_candidate_consent(3,'accepted','demo-not-approved',repeat('0',64))$$,
  'P0001','INVALID_INPUT','No se acepta hash inventado');
select lives_ok($$select public.change_candidate_consent(3,'accepted','demo-not-approved',
  (select policy_hash from public.candidate_consent_policy()))$$,'Nueva aceptación queda en historial');
select is((select count(*) from public.my_candidate_participations() where display_status='withdrawn'),2::bigint,
  'Reaceptar no reabre participaciones');
select is((select count(*) from public.candidate_consents),3::bigint,'Consentimientos son append-only');
select throws_ok($$select public.change_account_status(private.fixture_id('candidate',5),1,'restore','motivo',true)$$,
  'P0001','FORBIDDEN','Candidato no se restaura a sí mismo');
select lives_ok($$select public.change_account_status(private.fixture_id('candidate',5),1,'archive',null,true)$$,
  'Solicitud de eliminación archiva cuenta y perfil inmediatamente');
select is((select count(*) from public.candidate_profiles),0::bigint,'Archivado pierde lectura privada aun con sesión previa');
select throws_ok($$select public.apply_to_opening(private.fixture_id('opening',1),4)$$,
  'P0001','AUTH_REQUIRED','Archivado no crea operaciones nuevas');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee200000-0000-4000-8000-000000000004')::text,true);
select ok(not private.can_read_cv(private.fixture_id('cv',5)),'Retiro y archivo revocan CV empresarial');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee200000-0000-4000-8000-000000000003')::text,true);
select lives_ok($$select public.change_account_status(private.fixture_id('candidate',5),2,'restore','Motivo ficticio',true)$$,
  'Solo administración restaura con motivo');
select is((select status::text from public.candidate_profiles where id=private.fixture_id('profile',5)),
  'draft','Restauración vuelve a borrador');
select is((select count(*) from public.participations where candidate_id=private.fixture_id('profile',5) and status='withdrawn'),2::bigint,
  'Restauración no reactiva casos');
select is((select count(*) from public.referrals where candidate_id=private.fixture_id('profile',5) and access_status='active'),0::bigint,
  'Restauración no recupera permisos empresariales');

reset role;
insert into auth.sessions(id,user_id) values('ee200000-0000-4000-8000-000000000005',
  private.fixture_id('candidate',5));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',5)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',5)::text,
  'session_id','ee200000-0000-4000-8000-000000000005')::text,true);
select throws_ok($$select public.activate_candidate((select version from public.candidate_profiles
  where id=private.fixture_id('profile',5)))$$,'P0001','INVALID_TRANSITION',
  'Perfil restaurado no se activa sin un CV vigente y demás requisitos actuales');
reset role;
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change)
values('ee300000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000',
  'authenticated','authenticated','assisted-claim@example.invalid','fictitious-hash',clock_timestamp(),
  '{"provider":"email","providers":["email"]}'::jsonb,'{"role":"candidate"}'::jsonb,'','','','');
insert into auth.sessions(id,user_id) values('ee300000-0000-4000-8000-000000000002',
  'ee300000-0000-4000-8000-000000000001');
insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name,status)
values('ee400000-0000-4000-8000-000000000001','assisted',private.fixture_id('admin',1),
  'Persona asistida ficticia','draft');
insert into public.candidate_private_data(candidate_id,dni_normalized,dni_display)
values('ee400000-0000-4000-8000-000000000001','98765432','98765432');
set local role authenticated;
select set_config('request.jwt.claim.sub','ee300000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims',jsonb_build_object('sub','ee300000-0000-4000-8000-000000000001',
  'session_id','ee300000-0000-4000-8000-000000000002')::text,true);
select is(public.bootstrap_candidate('Persona asistida ficticia','98.765.432'),
  'pending_in_person_claim','DNI asistido requiere vinculación presencial');
reset role;
select is((select count(*) from public.candidate_profiles where
  id='ee400000-0000-4000-8000-000000000001' or account_id=(select id from public.accounts
  where auth_user_id='ee300000-0000-4000-8000-000000000001')),1::bigint,
  'Reclamo asistido no duplica el perfil');
select is((select count(*) from private.candidate_claim_requests where
  candidate_id='ee400000-0000-4000-8000-000000000001'),1::bigint,
  'Solicitud privada queda pendiente de revisión presencial');

insert into public.participations(id,candidate_id,opening_id,origin,created_by,status)
values('ee500000-0000-4000-8000-000000000001',private.fixture_id('profile',6),
  private.fixture_id('opening',70),'admin_nomination',private.fixture_id('admin',1),'under_review');
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',6)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',6)::text,
  'session_id','ee200000-0000-4000-8000-000000000002')::text,true);
select lives_ok($$select public.transition_participation('ee500000-0000-4000-8000-000000000001',
  1,'withdraw',null)$$,'Candidato puede retirar una nominación administrativa abierta');
select is((select display_status from public.my_candidate_participations()
  where id='ee500000-0000-4000-8000-000000000001'),'withdrawn',
  'La nominación retirada queda como resultado final visible');
select lives_ok($$select public.reserve_candidate_cv(private.fixture_id('profile',6),
  (select version from public.candidate_profiles where id=private.fixture_id('profile',6)),
  'ee600000-0000-4000-8000-000000000001',
  private.fixture_id('profile',6)::text||'/ee600000-0000-4000-8000-000000000001.pdf',
  'cv-nuevo-ficticio.pdf',1426,repeat('a',64))$$,
  'Se reserva una clave única sin sustituir el CV vigente');
reset role;
select is((select status::text from public.cv_documents where id=private.fixture_id('cv',6)),
  'valid','Reserva fallida o pendiente no sustituye CV anterior');
insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',
  private.fixture_id('profile',6)::text||'/ee600000-0000-4000-8000-000000000001.pdf',
  '{"size":1426,"mimetype":"application/pdf"}'::jsonb);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',6)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',6)::text,
  'session_id','ee200000-0000-4000-8000-000000000002')::text,true);
select lives_ok($$select public.commit_candidate_cv(private.fixture_id('profile',6),
  (select version from public.candidate_profiles where id=private.fixture_id('profile',6)),
  'ee600000-0000-4000-8000-000000000001',
  private.fixture_id('profile',6)::text||'/ee600000-0000-4000-8000-000000000001.pdf',
  'cv-nuevo-ficticio.pdf',1426,repeat('a',64))$$,
  'Nuevo CV validado sustituye al vigente');
reset role;
select is((select status::text from public.cv_documents where id=private.fixture_id('cv',6)),
  'superseded','La versión anterior se conserva');
select is((select status::text from public.cv_documents where id='ee600000-0000-4000-8000-000000000001'),
  'valid','La versión nueva queda vigente');
select ok(not exists(select 1 from public.referrals where candidate_id=private.fixture_id('profile',6)
  and cv_document_id<>private.fixture_id('cv',6)),
  'Las derivaciones anteriores conservan exactamente su versión de CV');

update public.candidate_profiles set status='active', refresh_due_at=clock_timestamp()-interval '1 minute'
  where id=private.fixture_id('profile',6);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',6)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',6)::text,
  'session_id','ee200000-0000-4000-8000-000000000002')::text,true);
select is(public.refresh_candidate_freshness(private.fixture_id('profile',6)),1,
  'Consulta propia materializa vencimiento a seis meses');
select is(public.refresh_candidate_freshness(private.fixture_id('profile',6)),0,
  'La transición de vigencia es idempotente');
select is((select status::text from public.candidate_profiles where id=private.fixture_id('profile',6)),
  'needs_update','Perfil vencido se conserva para actualización');
reset role;
select is((select count(*) from public.audit_events where entity_id=private.fixture_id('profile',6)
  and action='freshness_due' and actor_account_id=private.fixture_id('candidate',6)),1::bigint,
  'La vigencia registra a la cuenta solicitante una sola vez');

select set_config('test.expired_opening',private.fixture_id('opening',1)::text,true);
update public.job_openings set closing_date=(clock_timestamp() at time zone 'America/Buenos_Aires')::date-1
  where id=private.fixture_id('opening',1);
set local role anon;
select is((public.published_offers(1,1,current_setting('test.expired_opening')::uuid)->>'total')::integer,0,
  'Oferta vencida desaparece del público sin borrar su historial');
select * from finish();
rollback;
