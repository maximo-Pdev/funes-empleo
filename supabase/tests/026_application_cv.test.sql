-- EXTRA096: fictitious actors, scoped CVs, ownership, referral and rollback.
begin;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee260000-0000-4000-8000-000000000001',private.fixture_id('candidate',200)),
 ('ee260000-0000-4000-8000-000000000002',private.fixture_id('candidate',203)),
 ('ee260000-0000-4000-8000-000000000003',private.fixture_id('admin',1)),
 ('ee260000-0000-4000-8000-000000000004',private.fixture_id('company',1)),
 ('ee260000-0000-4000-8000-000000000005',private.fixture_id('company',2));
insert into public.job_openings
select (jsonb_populate_record(null::public.job_openings,to_jsonb(template)||jsonb_build_object(
 'id',private.fixture_id('scv-offer',n),'slug',null,'title','Oferta CV ficticia '||n,
 'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),
 'status','published','closing_date',current_date+20,'version',1,'archived_at',null))).*
from public.job_openings template cross join generate_series(1,8) n where template.id=private.fixture_id('opening',1);
insert into public.opening_categories(opening_id,category_id)
select private.fixture_id('scv-offer',7),category_id from public.candidate_categories where candidate_id=private.fixture_id('profile',200);
create function pg_temp.scv_actor(kind text,n integer,session_suffix text) returns void language plpgsql as $$
begin
 perform set_config('request.jwt.claim.sub',private.fixture_id(kind,n)::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id(kind,n)::text,
  'session_id','ee260000-0000-4000-8000-'||session_suffix)::text,true);
end $$;
create function pg_temp.scv_reserve(n integer) returns void language sql as $$
 select public.reserve_application_cv(private.fixture_id('scv-offer',n),1,private.fixture_id('scv-doc',n),
 private.fixture_id('profile',200)::text||'/'||private.fixture_id('scv-doc',n)::text||'.pdf','oferta-ficticia.pdf',608,repeat('0',64))
$$;
create function pg_temp.scv_apply(n integer) returns uuid language sql as $$
 select public.apply_to_opening_with_cv(private.fixture_id('scv-offer',n),1,private.fixture_id('scv-doc',n))
$$;
create function pg_temp.scv_fault() returns trigger language plpgsql as $$
begin
 if current_setting('scv.fail',true)='yes' and new.action='participation_created' then raise exception 'SCV_AUDIT_FAILURE'; end if;
 return new;
end $$;
create trigger scv_audit_fault before insert on public.audit_events for each row execute function pg_temp.scv_fault();
set local role authenticated;
select pg_temp.scv_actor('candidate',200,'000000000001');
select lives_ok($$select pg_temp.scv_reserve(1)$$,'Candidato reserva CV específico sin modificar perfil');
select lives_ok($$select pg_temp.scv_reserve(2)$$,'Segunda oferta tiene reserva independiente');
select lives_ok($$select pg_temp.scv_reserve(3)$$,'Reserva para prueba atómica');
select lives_ok($$select pg_temp.scv_reserve(4)$$,'Reserva sin objeto');
select throws_ok($$select pg_temp.scv_apply(4)$$,'P0001','INVALID_INPUT','Objeto faltante no crea participación');
select is((select status::text from public.cv_documents where id=private.fixture_id('scv-doc',4)),'rejected','Objeto faltante no promueve documento');
select throws_ok($$select public.apply_to_opening_with_cv(private.fixture_id('scv-offer',1),99,private.fixture_id('scv-doc',1))$$,
 'P0001','CONFLICT_STALE_DATA','Versión obsoleta no postula');
select throws_ok($$select public.commit_candidate_cv(private.fixture_id('profile',200),1,private.fixture_id('scv-doc',1),
 private.fixture_id('profile',200)::text||'/'||private.fixture_id('scv-doc',1)::text||'.pdf','oferta-ficticia.pdf',608,repeat('0',64))$$,
 'P0001','INVALID_INPUT','Un CV específico no se confirma como CV general');
reset role;
insert into storage.objects(bucket_id,name,metadata)
select 'candidate-cvs',private.fixture_id('profile',200)::text||'/'||private.fixture_id('scv-doc',n)::text||'.pdf',
 jsonb_build_object('mimetype','application/pdf','size',608) from generate_series(1,3) n;
set local role authenticated;
select pg_temp.scv_actor('candidate',203,'000000000002');
select throws_ok($$select pg_temp.scv_apply(1)$$,'P0001','INVALID_INPUT','No se puede usar el documento de otra persona');
select is((select count(*) from public.cv_documents where id=private.fixture_id('scv-doc',1)),0::bigint,'Metadatos ajenos ocultos');
select pg_temp.scv_actor('candidate',200,'000000000001');
select throws_ok($$select public.apply_to_opening_with_cv(private.fixture_id('scv-offer',2),1,private.fixture_id('scv-doc',1))$$,
 'P0001','INVALID_INPUT','No se cruza CV entre ofertas');
select set_config('scv.fail','yes',true);
select throws_ok($$select pg_temp.scv_apply(3)$$,'P0001','SCV_AUDIT_FAILURE','Fallo de auditoría revierte toda la operación');
select is((select status::text from public.cv_documents where id=private.fixture_id('scv-doc',3)),'rejected','Rollback conserva reserva pendiente');
select is((select count(*) from public.my_candidate_participations_with_cv() where opening_id=private.fixture_id('scv-offer',3)),0::bigint,'Rollback no deja participación');
select is((select count(*) from public.audit_events where entity_id=private.fixture_id('scv-doc',3)),0::bigint,'Rollback no deja evento parcial');
select set_config('scv.fail','no',true);
select set_config('scv.part1',pg_temp.scv_apply(1)::text,true);
select set_config('scv.part2',pg_temp.scv_apply(2)::text,true);
select set_config('scv.generalpart',public.apply_to_opening(private.fixture_id('scv-offer',5),1)::text,true);
select is((select cv_document_id from public.my_candidate_participations_with_cv() where id=current_setting('scv.part1')::uuid),
 private.fixture_id('scv-doc',1),'Proyección propia identifica CV seleccionado');
select is((select cv_document_id from public.my_candidate_participations_with_cv() where id=current_setting('scv.generalpart')::uuid),
 private.fixture_id('cv',200),'Sin archivo se fija CV general actual');
select is((select status::text from public.cv_documents where id=private.fixture_id('cv',200)),'valid','General permanece vigente');
select is((select count(*) from public.cv_documents where candidate_id=private.fixture_id('profile',200) and status='valid'),3::bigint,'General y dos específicos coexisten');
select throws_ok($$select pg_temp.scv_apply(1)$$,'P0001','INVALID_INPUT','No se reutiliza una reserva ya confirmada');
reset role;
select is((select version from public.participations where id=current_setting('scv.part1')::uuid),1,'Selección no agrega una transición artificial');
select is((select count(*) from private.opening_candidate_pool(private.fixture_id('scv-offer',7)) where id=private.fixture_id('profile',200)),1::bigint,'Varios CV específicos no duplican matching');
select ok(exists(select 1 from public.audit_events where entity_id=private.fixture_id('scv-doc',1) and action='cv_uploaded'
 and actor_account_id=private.fixture_id('candidate',200)),'Auditoría atribuye carga al candidato');
select throws_ok($$update public.cv_documents set opening_id=null where id=private.fixture_id('scv-doc',1)$$,
 'P0001','IMMUTABLE_CV_SCOPE','Ámbito no puede cambiar');
select throws_ok($$update public.participations set application_cv_document_id=private.fixture_id('cv',200) where id=current_setting('scv.part1')::uuid$$,
 'P0001','IMMUTABLE_PARTICIPATION_CV','Selección no puede cambiar');
update public.cv_documents set status='superseded',superseded_at=clock_timestamp() where id=private.fixture_id('cv',200);
insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by)
values(private.fixture_id('scv-general',1),private.fixture_id('profile',200),private.fixture_id('profile',200)::text||'/'||private.fixture_id('scv-general',1)::text||'.pdf',
 'general-nuevo-ficticio.pdf','application/pdf',608,repeat('0',64),'valid','fictitious_fixture',private.fixture_id('candidate',200));
set local role authenticated;
select pg_temp.scv_actor('admin',1,'000000000003');
select lives_ok($$select public.transition_participation(current_setting('scv.part1')::uuid,1,'refer','Evaluación ficticia')$$,'Oficina deriva CV específico');
select lives_ok($$select public.transition_participation(current_setting('scv.generalpart')::uuid,1,'refer','Evaluación ficticia')$$,'CV general sustituido sigue siendo el seleccionado');
select is((select cv_document_id from public.referrals where participation_id=current_setting('scv.part1')::uuid),private.fixture_id('scv-doc',1),'Derivación fija específico');
select is((select cv_document_id from public.referrals where participation_id=current_setting('scv.generalpart')::uuid),private.fixture_id('cv',200),'Derivación conserva general original');
select set_config('scv.nomination',public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('scv-offer',6),1,'admin_nomination')::text,true);
select lives_ok($$select public.transition_participation(current_setting('scv.nomination')::uuid,1,'refer','Evaluación ficticia')$$,'Nominaciones conservan flujo vigente');
select is((select cv_document_id from public.referrals where participation_id=current_setting('scv.nomination')::uuid),private.fixture_id('scv-general',1),'Nominación sin selección usa general vigente');
select pg_temp.scv_actor('company',1,'000000000004');
select ok(private.can_read_cv(private.fixture_id('scv-doc',1)),'Empresa propia accede al CV derivado');
select ok(not private.can_read_cv(private.fixture_id('scv-doc',2)),'Empresa no ve CV de otra postulación sin derivar');
select ok(not private.can_read_cv(private.fixture_id('scv-doc',3)),'Reserva pendiente nunca se expone');
select throws_ok($$select pg_temp.scv_reserve(7)$$,'P0001','FORBIDDEN','Empresa no reserva CV');
select pg_temp.scv_actor('company',2,'000000000005');
select ok(not private.can_read_cv(private.fixture_id('scv-doc',1)),'Empresa ajena no accede');
select pg_temp.scv_actor('candidate',200,'000000000001');
select lives_ok($$select public.transition_participation(current_setting('scv.part1')::uuid,2,'withdraw')$$,'Retiro individual conserva regla existente');
select pg_temp.scv_actor('company',1,'000000000004');
select ok(not private.can_read_cv(private.fixture_id('scv-doc',1)),'Retiro revoca acceso al documento');
select ok(private.can_read_cv(private.fixture_id('cv',200)),'Otro caso mantiene su permiso');
select pg_temp.scv_actor('candidate',200,'000000000001');
select lives_ok($$select public.apply_to_opening(private.fixture_id('scv-offer',3),1)$$,'Postulación general previa prepara conflicto de unicidad');
select throws_ok($$select pg_temp.scv_apply(3)$$,'P0001','INVALID_TRANSITION','Duplicado revierte promoción del CV pendiente');
select is((select status::text from public.cv_documents where id=private.fixture_id('scv-doc',3)),'rejected','Conflicto no deja CV específico válido huérfano');
reset role;
select is((select status::text from public.participations where id=current_setting('scv.part2')::uuid),'received','Otra participación permanece intacta');
update public.cv_documents set status='superseded',superseded_at=clock_timestamp() where id=private.fixture_id('scv-general',1);
select is((select count(*) from private.opening_candidate_pool(private.fixture_id('scv-offer',7)) where id=private.fixture_id('profile',200)),0::bigint,'CV específicos no habilitan matching sin general vigente');
set local role authenticated;
select pg_temp.scv_actor('candidate',200,'000000000001');
select throws_ok($$select pg_temp.scv_reserve(7)$$,'P0001','VALID_CV_REQUIRED','CV específico no sustituye requisito de general');
reset role;
update public.candidate_profiles set status='draft' where id=private.fixture_id('profile',200);
set local role authenticated;
select pg_temp.scv_actor('candidate',200,'000000000001');
select throws_ok($$select public.activate_candidate((select version from public.candidate_profiles where id=private.fixture_id('profile',200)))$$,
 'P0001','INVALID_TRANSITION','Activación exige CV general aunque haya específicos');
reset role;
select ok(not has_function_privilege('anon','public.apply_to_opening_with_cv(uuid,integer,uuid)','EXECUTE'),'Anónimo no puede postular');
select ok(not has_function_privilege('authenticated','private.create_participation_with_cv(uuid,integer,uuid,integer,text,uuid)','EXECUTE'),'Helper privado no se expone');
select * from finish();
rollback;
