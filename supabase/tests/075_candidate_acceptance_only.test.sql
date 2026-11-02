-- EXTRA-121: transactional regression on fictitious acceptance fixtures only.
-- Requires migration 20261102090000; never execute on a shared curated target.
begin;
select no_plan();
select has_function('public','change_candidate_consent',array['integer','text','text','text'],
  'Se conserva el contrato RPC sin habilitar retiro propio');
select ok(not has_function_privilege('anon','public.change_candidate_consent(integer,text,text,text)','EXECUTE'),
  'Anónimo no puede aceptar');
select ok(not has_table_privilege('authenticated','public.candidate_consents','INSERT,UPDATE,DELETE'),
  'Historial no admite escritura directa autenticada');

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
  ('ee750000-0000-4000-8000-000000000001',private.fixture_id('candidate',5));
-- Historical withdrawal is prepared by the trusted test fixture, not the retired RPC.
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,recorded_at,source)
values(private.fixture_id('profile',5),'demo-not-approved',repeat('0',64),'withdrawn',
  private.fixture_id('candidate',5),clock_timestamp(),'self_service');
update public.candidate_profiles set status='consent_withdrawn' where id=private.fixture_id('profile',5);
update public.participations set status='withdrawn',final_outcome_at=clock_timestamp(),
  final_outcome_by=private.fixture_id('candidate',5),withdrawal_reason='consent_withdrawn'
where candidate_id=private.fixture_id('profile',5) and status not in
  ('hired','not_selected','withdrawn','cancelled','no_company_response');
update public.referrals set access_status='revoked',access_change_reason='consent_withdrawn'
where candidate_id=private.fixture_id('profile',5) and access_status='active';
create temporary table consent_history_before as select * from public.candidate_consents;
create temporary table consent_cases_before as select * from public.participations;
create temporary table consent_access_before as select * from public.referrals;
create temporary table consent_profiles_before as select * from public.candidate_profiles;
create temporary table consent_audit_before as select * from public.audit_events;
select ok(not private.current_consent(private.fixture_id('profile',5)),'Retiro histórico sigue bloqueando consentimiento vigente');

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',5)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',5)::text,
  'session_id','ee750000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.change_candidate_consent((select version from public.candidate_profiles),
  'withdrawn','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,
  'P0001','INVALID_INPUT','RPC directo rechaza retiro');
select throws_ok($$select public.change_candidate_consent((select version from public.candidate_profiles),
  null,'demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,
  'P0001','INVALID_INPUT','RPC directo rechaza estado nulo');
reset role;
select results_eq('select to_jsonb(c) from public.candidate_consents c order by id',
  'select to_jsonb(c) from consent_history_before c order by id','Rechazos no escriben consentimientos');
select results_eq('select to_jsonb(c) from public.candidate_profiles c order by id',
  'select to_jsonb(c) from consent_profiles_before c order by id','Rechazos no cambian perfiles ni versiones');
select results_eq('select to_jsonb(c) from public.audit_events c order by id',
  'select to_jsonb(c) from consent_audit_before c order by id','Rechazos no escriben auditoría');
set local role authenticated;
select throws_ok($$select public.change_candidate_consent((select version from public.candidate_profiles),
  'accepted','demo-not-approved',repeat('f',64))$$,'P0001','INVALID_INPUT','Aceptación exige hash vigente');
select throws_ok($$select public.change_candidate_consent(0,'accepted','demo-not-approved',
  (select policy_hash from public.candidate_consent_policy()))$$,'P0001','CONFLICT_STALE_DATA','Aceptación exige versión vigente');
select throws_ok($$select public.activate_candidate((select version from public.candidate_profiles))$$,
  'P0001','INVALID_TRANSITION','Retiro histórico mantiene bloqueada la activación');
select lives_ok($$select public.change_candidate_consent((select version from public.candidate_profiles),
  'accepted','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,
  'Perfil inactivo con retiro histórico admite aceptación explícita');
select is((select status::text from public.candidate_profiles),'draft','Reaceptación no activa el perfil');
select throws_ok($$select public.change_candidate_consent((select version from public.candidate_profiles),
  'accepted','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,
  'P0001','INVALID_TRANSITION','Aceptación vigente no se duplica');
reset role;
select ok(private.current_consent(private.fixture_id('profile',5)),'Aceptación afirmativa queda vigente');
select is((select count(*) from public.candidate_consents),
  (select count(*)+1 from consent_history_before),'Solo se agrega un consentimiento');
select ok(not exists(select 1 from consent_history_before b left join public.candidate_consents c using(id)
  where c.id is null or to_jsonb(b)<>to_jsonb(c)),'Todo consentimiento histórico permanece idéntico');
select results_eq('select to_jsonb(c) from public.participations c order by id',
  'select to_jsonb(c) from consent_cases_before c order by id','Rechazo y reaceptación no reabren ni modifican casos');
select results_eq('select to_jsonb(c) from public.referrals c order by id',
  'select to_jsonb(c) from consent_access_before c order by id','Rechazo y reaceptación no restauran ni modifican accesos');
select throws_ok($$update public.candidate_consents set status='withdrawn'
  where id=private.fixture_id('consent',5)$$,'P0001','APPEND_ONLY','Historial sigue inmutable');

-- Fresh account/profile has no operational consent: initial acceptance remains reachable.
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,
 raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change)
values('ee750000-0000-4000-8000-000000000010','00000000-0000-0000-0000-000000000000',
 'authenticated','authenticated','acceptance-only@example.invalid','fictitious-hash',clock_timestamp(),
 '{"provider":"email","providers":["email"]}'::jsonb,'{"role":"candidate"}'::jsonb,'','','','');
insert into auth.sessions(id,user_id) values('ee750000-0000-4000-8000-000000000011','ee750000-0000-4000-8000-000000000010');
set local role authenticated;
select set_config('request.jwt.claim.sub','ee750000-0000-4000-8000-000000000010',true);
select set_config('request.jwt.claims',jsonb_build_object('sub','ee750000-0000-4000-8000-000000000010',
 'session_id','ee750000-0000-4000-8000-000000000011')::text,true);
select lives_ok($$select public.bootstrap_candidate('Persona ficticia aceptación','98765431')$$,'Alta de prueba sin consentimiento automático');
select is((select count(*) from public.candidate_consents),0::bigint,'Términos y alta no conceden consentimiento operativo');
select lives_ok($$select public.change_candidate_consent((select version from public.candidate_profiles),
 'accepted','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'Aceptación inicial pendiente sigue disponible');
select is((select count(*) from public.candidate_consents where status='accepted'),1::bigint,'Aceptación inicial queda registrada');
select throws_ok($$select public.change_account_status((select account_id from public.candidate_profiles),1,'archive',null,true)$$,
 'P0001','FORBIDDEN','Aceptación no concede archivo propio de cuenta');
reset role;
select * from finish();
rollback;
