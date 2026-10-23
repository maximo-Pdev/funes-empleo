begin;
select no_plan();

select has_function('public','get_record_references',array['text','uuid[]'],'Lookup acotado de referencias');
select has_function('public','resolve_record_reference',array['text','text'],'Resolución autorizada de códigos');
select ok(not has_table_privilege(role,'private.record_references','SELECT,INSERT,UPDATE,DELETE'),'Sin acceso directo: '||role)
from unnest(array['anon','authenticated','service_role']) role;
select ok(not has_function_privilege('anon','public.get_record_references(text,uuid[])','EXECUTE'),'Anónimo sin lookup');
select ok(not has_function_privilege('service_role','public.resolve_record_reference(text,text)','EXECUTE'),'Sin bypass de sesión mediante service_role');
select ok(not has_function_privilege('authenticated','private.ensure_record_reference(text,uuid)','EXECUTE'),'Cliente no genera códigos');
select ok(not has_function_privilege('authenticated','private.record_reference_entropy()','EXECUTE'),'Cliente no invoca entropía privada');
select ok((select relrowsecurity from pg_class where oid='private.record_references'::regclass),'RLS en referencias');
select is((select count(*) from private.record_references),(select sum(total) from (
 select count(*) total from public.accounts union all select count(*) from public.candidate_profiles
 union all select count(*) from public.company_profiles union all select count(*) from public.job_openings
 union all select count(*) from public.participations union all select count(*) from public.referrals
 union all select count(*) from public.cv_documents union all select count(*) from public.import_batches
 union all select count(*) from public.job_categories) counts)::bigint,'Backfill completo de los nueve tipos');
select ok((select bool_and(reference ~ '^[a-z]{2,3}-[0-9a-f]{24}$' and reference not like '%'||replace(entity_id::text,'-','')||'%') from private.record_references),'Formato aleatorio, no UUID reformateado');
select is((select count(distinct reference) from private.record_references),(select count(*) from private.record_references),'Sin colisiones');
select throws_ok($$update private.record_references set reference='can-000000000000000000000000'$$,'P0001','APPEND_ONLY','Referencias inmutables incluso para mantenimiento accidental');
select throws_ok($$delete from private.record_references$$,'P0001','APPEND_ONLY','No se borran referencias');

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee250000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee250000-0000-4000-8000-000000000002',private.fixture_id('candidate',1)),
 ('ee250000-0000-4000-8000-000000000003',private.fixture_id('company',1)),
 ('ee250000-0000-4000-8000-000000000004',private.fixture_id('company',2));
insert into public.job_openings
select (jsonb_populate_record(null::public.job_openings,to_jsonb(template)||jsonb_build_object(
 'id',private.fixture_id('reference-opening',1),'slug',null,'title','Oferta ficticia referencias',
 'status','published','closing_date',(clock_timestamp()+interval '1 month')::date))).*
from public.job_openings template where template.id=private.fixture_id('opening',1);
insert into public.participations(id,candidate_id,opening_id,origin,created_by,status)
values(private.fixture_id('reference-part',1),private.fixture_id('profile',1),private.fixture_id('reference-opening',1),'admin_nomination',private.fixture_id('admin',1),'referred');
insert into public.referrals(id,participation_id,candidate_id,referred_by,referred_at,access_status,consent_event_id,cv_document_id,feedback_due_at,access_changed_at,access_changed_actor_type,access_changed_by_account_id,access_change_reason)
values(private.fixture_id('reference-referral',1),private.fixture_id('reference-part',1),private.fixture_id('profile',1),private.fixture_id('admin',1),
 now(),'active',private.fixture_id('consent',1),private.fixture_id('cv',1),now()+interval '720 hours',clock_timestamp(),'account',private.fixture_id('admin',1),'referral_created');
select set_config('refs.candidate',(select reference from private.record_references where kind='candidate' and entity_id=private.fixture_id('profile',1)),true);
select set_config('refs.other_candidate',(select reference from private.record_references where kind='candidate' and entity_id=private.fixture_id('profile',2)),true);
select set_config('refs.cv',(select reference from private.record_references where kind='cv' and entity_id=private.fixture_id('cv',1)),true);
select set_config('refs.opening',(select reference from private.record_references where kind='opening' and entity_id=private.fixture_id('reference-opening',1)),true);
select set_config('refs.referral',(select reference from private.record_references where kind='referral' and entity_id=private.fixture_id('reference-referral',1)),true);
select ok(current_setting('refs.opening') ~ '^ofe-[a-f0-9]{24}$' and current_setting('refs.referral') ~ '^der-[a-f0-9]{24}$','Nuevos registros reciben código en la misma transacción');
create temp table reference_snapshot as select to_jsonb(profile) profile,(select count(*) from public.audit_events) audit_count,
 (select count(*) from public.candidate_consents) consent_count from public.candidate_profiles profile where id=private.fixture_id('profile',1);
select lives_ok($$select private.ensure_record_reference('candidate',private.fixture_id('profile',1))$$,'Backfill idempotente no regenera referencia');
select is((select reference from private.record_references where kind='candidate' and entity_id=private.fixture_id('profile',1)),current_setting('refs.candidate'),'Código estable');
select is((select to_jsonb(profile) from public.candidate_profiles profile where id=private.fixture_id('profile',1)),(select profile from reference_snapshot),'Perfil y versión intactos');
select is((select count(*) from public.audit_events),(select audit_count from reference_snapshot),'Auditoría intacta');
select is((select count(*) from public.candidate_consents),(select consent_count from reference_snapshot),'Historial de consentimiento intacto');

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee250000-0000-4000-8000-000000000001')::text,true);
select is(public.resolve_record_reference('candidate',current_setting('refs.candidate')),private.fixture_id('profile',1),'Admin resuelve candidato');
select is(public.get_record_references('candidate',array[private.fixture_id('profile',1)])->>private.fixture_id('profile',1)::text,current_setting('refs.candidate'),'Lookup y resolución coinciden');
select is(public.resolve_record_reference('company',current_setting('refs.candidate')),null::uuid,'Código de otro tipo no resuelve');
select is(public.resolve_record_reference('candidate','can-000000000000000000000000'),null::uuid,'Código inexistente no revela información');
select throws_ok($$select public.get_record_references('candidate',array_fill(private.fixture_id('profile',1),array[1001]))$$,'P0001','VALIDATION_ERROR','Límite SQL de 1000 IDs');
select throws_ok($$select public.get_record_references('otro',array[]::uuid[])$$,'P0001','VALIDATION_ERROR','Catálogo cerrado');

select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1)::text,'session_id','ee250000-0000-4000-8000-000000000002')::text,true);
select is(public.resolve_record_reference('candidate',current_setting('refs.candidate')),private.fixture_id('profile',1),'Candidato resuelve perfil propio');
select is(public.resolve_record_reference('cv',current_setting('refs.cv')),private.fixture_id('cv',1),'Candidato resuelve CV propio');
select is(public.resolve_record_reference('candidate',current_setting('refs.other_candidate')),null::uuid,'Candidato no resuelve perfil ajeno');
select is(public.resolve_record_reference('opening',current_setting('refs.opening')),null::uuid,'Candidato no accede al detalle empresarial');

select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee250000-0000-4000-8000-000000000003')::text,true);
select is(public.resolve_record_reference('opening',current_setting('refs.opening')),private.fixture_id('reference-opening',1),'Empresa resuelve oferta propia');
select is(public.resolve_record_reference('referral',current_setting('refs.referral')),private.fixture_id('reference-referral',1),'Empresa resuelve derivación propia');
select is(public.resolve_record_reference('candidate',current_setting('refs.candidate')),null::uuid,'Empresa nunca obtiene ruta del padrón');
select is(public.resolve_record_reference('cv',current_setting('refs.cv')),private.fixture_id('cv',1),'CV depende de permiso vigente');
select is(public.get_record_references('candidate',array[private.fixture_id('profile',1)]),'{}'::jsonb,'Lookup ajeno vacío');
reset role;
update public.referrals set access_status='revoked',access_change_reason='consent_withdrawn',access_changed_at=clock_timestamp(),
 access_changed_actor_type='account',access_changed_by_account_id=private.fixture_id('admin',1) where cv_document_id=private.fixture_id('cv',1) and access_status='active';
set local role authenticated;
select is(public.resolve_record_reference('referral',current_setting('refs.referral')),private.fixture_id('reference-referral',1),'Stub no personal permanece tras revocación');
select is(public.resolve_record_reference('cv',current_setting('refs.cv')),null::uuid,'Referencia CV deja de resolver al revocar acceso');
select ok(not(public.company_referral(private.fixture_id('reference-referral',1)) ? 'candidate'),'Resolver derivación no recupera perfil');
select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2)::text,'session_id','ee250000-0000-4000-8000-000000000004')::text,true);
select is(public.resolve_record_reference('referral',current_setting('refs.referral')),null::uuid,'Empresa ajena no resuelve stub');
select is(public.resolve_record_reference('opening',current_setting('refs.opening')),null::uuid,'Empresa ajena no resuelve oferta');
reset role;
update public.accounts set status='suspended',suspended_reason='Prueba ficticia',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1) where id=private.fixture_id('company',2);
set local role authenticated;
select throws_ok($$select public.resolve_record_reference('referral',current_setting('refs.referral'))$$,'P0001','AUTH_REQUIRED','Suspensión revalidada en cada RPC');
reset role;
delete from auth.sessions where id='ee250000-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1)::text,'session_id','ee250000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.resolve_record_reference('candidate',current_setting('refs.candidate'))$$,'P0001','AUTH_REQUIRED','Sesión revocada no resuelve');
reset role;
create temporary sequence reference_rng;
create or replace function private.record_reference_entropy() returns bytea language plpgsql as $$
declare draw bigint;
begin
 draw:=nextval('pg_temp.reference_rng');
 return decode(repeat(case when draw<=2 or current_setting('refs.force_collision',true)='true' then 'ab' else 'cd' end,12),'hex');
end $$;
insert into private.record_references(kind,entity_id,reference) values('candidate',private.fixture_id('collision-placeholder',1),'can-'||repeat('ab',12));
select lives_ok($$insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name)
 values(private.fixture_id('reference-new',1),'assisted',private.fixture_id('admin',1),'Persona ficticia colisión')$$,'Dos colisiones se reintentan dentro del INSERT');
select is((select last_value from reference_rng),3::bigint,'Tercer intento obtiene referencia distinta');
select is((select reference from private.record_references where kind='candidate' and entity_id=private.fixture_id('reference-new',1)),'can-'||repeat('cd',12),'Código exitoso se conserva');
select set_config('refs.force_collision','true',true);
select set_config('refs.audit_count',(select count(*)::text from public.audit_events),true);
select throws_ok($$insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name)
 values(private.fixture_id('reference-new',2),'assisted',private.fixture_id('admin',1),'Persona ficticia rollback')$$,'P0001','INTERNAL_ERROR','Colisión persistente rechaza el alta de forma atómica');
select is((select last_value from reference_rng),8::bigint,'Reintentos limitados a cinco');
select ok(not exists(select 1 from public.candidate_profiles where id=private.fixture_id('reference-new',2)),'No queda perfil sin referencia');
select ok(not exists(select 1 from private.record_references where kind='candidate' and entity_id=private.fixture_id('reference-new',2)),'No queda referencia parcial');
select is((select count(*)::text from public.audit_events),current_setting('refs.audit_count'),'Fallo no deja auditoría parcial');
select lives_ok($$select private.ensure_record_reference('candidate',private.fixture_id('profile',1))$$,'Registro existente no necesita generar otro código');
select is((select reference from private.record_references where kind='candidate' and entity_id=private.fixture_id('profile',1)),current_setting('refs.candidate'),'Colisiones no regeneran códigos previos');
select * from finish();
rollback;
