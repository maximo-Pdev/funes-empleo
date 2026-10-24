begin;
set local search_path=public,extensions;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee410000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee410000-0000-4000-8000-000000000002',private.fixture_id('candidate',1)),
 ('ee410000-0000-4000-8000-000000000003',private.fixture_id('company',1));
select set_config('aa.data',jsonb_build_object('name','Alta activa ficticia','dni','99007001','phone','3410000000','email','',
 'locality','Funes','summary','Experiencia ficticia','availability','available','detail','','address','',
 'categories',jsonb_build_array(private.fixture_id('category',1)))::text,true);
select set_config('aa.hash',(select policy_hash from public.candidate_consent_policy()),true);
create function pg_temp.active_registration() returns jsonb language sql as $$
 select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb,true,'demo-not-approved',current_setting('aa.hash'))
$$;
create function pg_temp.registration_snapshot() returns jsonb language sql as $$
 select jsonb_build_array((select count(*) from public.candidate_profiles),(select count(*) from public.candidate_private_data),
 (select count(*) from public.candidate_contacts),(select count(*) from public.candidate_categories),
 (select count(*) from public.candidate_consents),(select count(*) from public.audit_events))
$$;
select ok(not has_function_privilege('anon','public.create_active_assisted_candidate(jsonb,boolean,text,text,integer,uuid,text,text,text[])','execute'),'Anónimo no ejecuta alta activa');
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee410000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select pg_temp.active_registration()$$,'P0001','FORBIDDEN','Candidato no crea perfiles activos');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee410000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select pg_temp.active_registration()$$,'P0001','FORBIDDEN','Empresa no crea perfiles activos');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee410000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb,false,'demo-not-approved',current_setting('aa.hash'))$$,'P0001','CONSENT_REQUIRED','No hay aceptación implícita');
select throws_ok($$select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb,true,'vieja',current_setting('aa.hash'))$$,'P0001','INVALID_INPUT','Política obsoleta rechazada');
select throws_ok($$select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb||'{"locality":""}',true,'demo-not-approved',current_setting('aa.hash'))$$,'P0001','INVALID_INPUT','Localidad requerida también en DB');
select throws_ok($$select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb||'{"availability":"unavailable"}',true,'demo-not-approved',current_setting('aa.hash'))$$,'P0001','INVALID_INPUT','No activa indisponibles');
select throws_ok($$select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb||'{"summary":""}',true,'demo-not-approved',current_setting('aa.hash'))$$,'P0001','INVALID_INPUT','Experiencia requerida');
select throws_ok($$select public.create_active_assisted_candidate(current_setting('aa.data')::jsonb||'{"categories":[]}',true,'demo-not-approved',current_setting('aa.hash'))$$,'P0001','INVALID_INPUT','Categoría laboral requerida');
select set_config('aa.id',(pg_temp.active_registration()->>'candidateId'),true);
select is((select status::text from public.candidate_profiles where id=current_setting('aa.id')::uuid),'active','Perfil nace activo sin paso manual');
select ok((select activated_at is not null and last_confirmed_at is not null and refresh_due_at>now() from public.candidate_profiles where id=current_setting('aa.id')::uuid),'Fechas de activación y vigencia completas');
select is((select count(*) from public.cv_documents where candidate_id=current_setting('aa.id')::uuid),0::bigint,'Alta no inventa un CV');
select is((select count(*) from public.candidate_consents where candidate_id=current_setting('aa.id')::uuid and status='accepted' and source='assisted' and recorded_by=private.fixture_id('admin',1) and policy_hash=current_setting('aa.hash')),1::bigint,'Aceptación append-only con actor y política exactos');
select is((select count(*) from public.audit_events where entity_id=current_setting('aa.id')::uuid and actor_account_id=private.fixture_id('admin',1) and action in ('profile_created','consent_accepted','profile_activated')),3::bigint,'Alta, aceptación y activación auditadas');
select is(pg_temp.active_registration()->>'status','duplicates','Segunda alta devuelve coincidencias');
select is((select count(*) from public.candidate_consents where candidate_id=current_setting('aa.id')::uuid),1::bigint,'Duplicado no acepta otra vez');
select lives_ok(format('select public.assisted_candidate_command(%L,(select version from public.candidate_profiles where id=%L),%L,%L,%L)',current_setting('aa.id'),current_setting('aa.id'),'withdraw_consent','demo-not-approved',current_setting('aa.hash')),'Retiro explícito conservado');
select set_config('aa.review',(pg_temp.active_registration()->'matches'->0->>'reviewId'),true);
select lives_ok(format('select public.create_active_assisted_candidate(current_setting(%L)::jsonb,true,%L,current_setting(%L),(select version from public.candidate_profiles where id=%L),%L,%L,%L)',
 'aa.data','demo-not-approved','aa.hash',current_setting('aa.id'),current_setting('aa.review'),'use_or_update_existing','Mismo perfil ficticio'),'Usar existente conserva identidad');
select is((select status::text from public.candidate_profiles where id=current_setting('aa.id')::uuid),'consent_withdrawn','Usar existente no reactiva ni reacepta');
select is((select count(*) from public.candidate_consents where candidate_id=current_setting('aa.id')::uuid),2::bigint,'Historial previo intacto');
reset role;
create function pg_temp.fail_activation_audit() returns trigger language plpgsql as $$
begin if new.action=current_setting('aa.fail',true) then raise exception 'ACTIVE_REGISTRATION_AUDIT_FAILURE'; end if; return new; end $$;
create trigger active_registration_test before insert on public.audit_events for each row execute function pg_temp.fail_activation_audit();
select set_config('aa.data',(current_setting('aa.data')::jsonb||'{"dni":"99007002"}')::text,true);
select set_config('aa.before',pg_temp.registration_snapshot()::text,true);
select set_config('aa.fail','profile_activated',true);
set local role authenticated;
select throws_ok($$select pg_temp.active_registration()$$,'P0001','ACTIVE_REGISTRATION_AUDIT_FAILURE','Fallo en auditoría final aborta toda el alta');
reset role;
select is(pg_temp.registration_snapshot(),current_setting('aa.before')::jsonb,'Rollback incluye perfil, contactos, rubros, consentimiento y auditoría');
select set_config('aa.fail','consent_accepted',true);
set local role authenticated;
select throws_ok($$select pg_temp.active_registration()$$,'P0001','ACTIVE_REGISTRATION_AUDIT_FAILURE','Fallo de auditoría del consentimiento aborta alta');
reset role;
select is(pg_temp.registration_snapshot(),current_setting('aa.before')::jsonb,'Rollback antes de activar no deja datos parciales');
select * from finish();
rollback;
