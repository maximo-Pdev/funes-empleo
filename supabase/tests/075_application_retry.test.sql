-- EXTRA102: new voluntary cases after withdrawal, never reopen old history.
begin;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee750000-0000-4000-8000-000000000001',private.fixture_id('candidate',200)),
 ('ee750000-0000-4000-8000-000000000002',private.fixture_id('admin',1)),
 ('ee750000-0000-4000-8000-000000000003',private.fixture_id('company',1)),
 ('ee750000-0000-4000-8000-000000000004',private.fixture_id('candidate',203));
insert into public.job_openings
select (jsonb_populate_record(null::public.job_openings,to_jsonb(t)||jsonb_build_object(
 'id',private.fixture_id('retry-offer',n),'slug',null,'title','Oferta reintento ficticia '||n,
 'company_id',(select id from public.company_profiles where account_id=private.fixture_id('company',1)),
 'status','published','closing_date',current_date+20,'version',1,'archived_at',null))).*
from public.job_openings t cross join generate_series(1,8) n where t.id=private.fixture_id('opening',1);
insert into public.opening_categories(opening_id,category_id)
select private.fixture_id('retry-offer',1),category_id from public.candidate_categories where candidate_id=private.fixture_id('profile',200);
select is((select count(*) from private.opening_candidate_pool(private.fixture_id('retry-offer',1)) where id=private.fixture_id('profile',200)),1::bigint,'Perfil apto coincide antes de tener casos');
create function pg_temp.retry_actor(kind text,n integer,suffix text) returns void language plpgsql as $$
begin
 perform set_config('request.jwt.claim.sub',private.fixture_id(kind,n)::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id(kind,n)::text,
  'session_id','ee750000-0000-4000-8000-'||suffix)::text,true);
end $$;
create function pg_temp.retry_apply(n integer) returns uuid language sql as $$
 select public.apply_to_opening(private.fixture_id('retry-offer',n),1)
$$;
create function pg_temp.retry_reserve(n integer) returns void language sql as $$
 select public.reserve_application_cv(private.fixture_id('retry-offer',n),1,private.fixture_id('retry-doc',n),
 private.fixture_id('profile',200)::text||'/'||private.fixture_id('retry-doc',n)::text||'.pdf',
 'reintento-ficticio.pdf',608,repeat('0',64))
$$;
create function pg_temp.retry_fault() returns trigger language plpgsql as $$
begin
 if current_setting('retry.fail',true)='yes' and new.action='participation_created' then raise exception 'RETRY_AUDIT_FAILURE'; end if;
 return new;
end $$;
create trigger retry_audit_fault before insert on public.audit_events for each row execute function pg_temp.retry_fault();
set local role authenticated;
select pg_temp.retry_actor('candidate',200,'000000000001');
select set_config('retry.first',pg_temp.retry_apply(1)::text,true);
select set_config('retry.other',pg_temp.retry_apply(2)::text,true);
select throws_ok($$select pg_temp.retry_apply(1)$$,'P0001','INVALID_TRANSITION','Caso vigente impide duplicado');
select lives_ok($$select public.transition_participation(current_setting('retry.first')::uuid,1,'withdraw')$$,'Titular retira primer intento');
reset role;
select set_config('retry.original',(select to_jsonb(p)::text from public.participations p where id=current_setting('retry.first')::uuid),true);
select is((select count(*) from private.opening_candidate_pool(private.fixture_id('retry-offer',1)) where id=private.fixture_id('profile',200)),0::bigint,'Matching municipal sigue excluyendo caso retirado');
set local role authenticated;
select pg_temp.retry_actor('admin',1,'000000000002');
select throws_ok($$select public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('retry-offer',1),
 (select version from public.job_openings where id=private.fixture_id('retry-offer',1)),'admin_nomination')$$,
 'P0001','INVALID_TRANSITION','Nominación no ignora un caso retirado');
select pg_temp.retry_actor('candidate',200,'000000000001');
select throws_ok($$select public.apply_to_opening(private.fixture_id('retry-offer',1),99)$$,'P0001','CONFLICT_STALE_DATA','Reintento mantiene control de versión');
reset role;
update public.job_openings set closing_date=current_date-1 where id=private.fixture_id('retry-offer',1);
set local role authenticated;
select throws_ok($$select pg_temp.retry_apply(1)$$,'P0001','INVALID_TRANSITION','Oferta vencida no admite reintento');
reset role;
update public.job_openings set closing_date=current_date+20,status='paused' where id=private.fixture_id('retry-offer',1);
set local role authenticated;
select throws_ok($$select pg_temp.retry_apply(1)$$,'P0001','INVALID_TRANSITION','Oferta no publicada no admite reintento');
reset role;
update public.job_openings set status='published' where id=private.fixture_id('retry-offer',1);
set local role authenticated;
select lives_ok($$select public.reserve_application_cv(private.fixture_id('retry-offer',1),1,private.fixture_id('retry-old-doc',1),
 private.fixture_id('profile',200)::text||'/'||private.fixture_id('retry-old-doc',1)::text||'.pdf','anterior-ficticio.pdf',608,repeat('0',64))$$,
 'Reserva de CV específico habilitada después del primer retiro');
reset role;
insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',
 private.fixture_id('profile',200)::text||'/'||private.fixture_id('retry-old-doc',1)::text||'.pdf',jsonb_build_object('mimetype','application/pdf','size',608));
set local role authenticated;
select set_config('retry.second',public.apply_to_opening_with_cv(private.fixture_id('retry-offer',1),1,private.fixture_id('retry-old-doc',1))::text,true);
select isnt(current_setting('retry.first'),current_setting('retry.second'),'Reintento tiene otro ID');
select is((select count(*) from public.my_candidate_participations_with_cv() where opening_id=private.fixture_id('retry-offer',1)),2::bigint,'Titular conserva ambos casos');
select throws_ok($$select pg_temp.retry_apply(1)$$,'P0001','INVALID_TRANSITION','Segundo envío no duplica reintento');
select pg_temp.retry_actor('admin',1,'000000000002');
select throws_ok($$select public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('retry-offer',1),
 (select version from public.job_openings where id=private.fixture_id('retry-offer',1)),'admin_nomination')$$,
 'P0001','INVALID_TRANSITION','Nominación mantiene bloqueo histórico');
select lives_ok($$select public.transition_participation(current_setting('retry.second')::uuid,1,'refer','Evaluación ficticia')$$,'Oficina deriva segundo intento');
reset role;
select set_config('retry.referral',(select id::text from public.referrals where participation_id=current_setting('retry.second')::uuid),true);
select set_config('retry.doc',(select cv_document_id::text from public.referrals where id=current_setting('retry.referral')::uuid),true);
set local role authenticated;
select pg_temp.retry_actor('candidate',200,'000000000001');
select lives_ok($$select public.transition_participation(current_setting('retry.second')::uuid,2,'withdraw')$$,'Retiro tras derivación');
select lives_ok($$select pg_temp.retry_reserve(1)$$,'Se puede reservar CV específico tras retiro');
reset role;
insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',
 private.fixture_id('profile',200)::text||'/'||private.fixture_id('retry-doc',1)::text||'.pdf',jsonb_build_object('mimetype','application/pdf','size',608));
select set_config('retry.auditcount',(select count(*)::text from public.audit_events),true);
select set_config('retry.noticecount',(select count(*)::text from public.account_notifications),true);
set local role authenticated;
select set_config('retry.fail','yes',true);
select throws_ok($$select public.apply_to_opening_with_cv(private.fixture_id('retry-offer',1),1,private.fixture_id('retry-doc',1))$$,
 'P0001','RETRY_AUDIT_FAILURE','Fallo de auditoría aborta reintento con CV');
reset role;
select is((select count(*)::text from public.audit_events),current_setting('retry.auditcount'),'Rollback no deja auditoría parcial');
select is((select count(*)::text from public.account_notifications),current_setting('retry.noticecount'),'Rollback no deja avisos');
select is((select count(*) from public.participations where opening_id=private.fixture_id('retry-offer',1)),2::bigint,'Rollback no deja nuevo caso');
select is((select status::text from public.cv_documents where id=private.fixture_id('retry-doc',1)),'rejected','Rollback no promueve CV');
set local role authenticated;
select set_config('retry.fail','no',true);
select set_config('retry.third',public.apply_to_opening_with_cv(private.fixture_id('retry-offer',1),1,private.fixture_id('retry-doc',1))::text,true);
select is((select cv_document_id from public.my_candidate_participations_with_cv() where id=current_setting('retry.third')::uuid),private.fixture_id('retry-doc',1),'Nuevo intento fija su CV específico');
select pg_temp.retry_actor('company',1,'000000000003');
select ok(not private.can_read_cv(private.fixture_id('retry-doc',1)),'Nuevo caso no crea acceso empresarial');
select ok(not private.can_read_cv(current_setting('retry.doc')::uuid),'Retiro sigue bloqueando acceso anterior');
select throws_ok($$select pg_temp.retry_apply(3)$$,'P0001','FORBIDDEN','Empresa no puede iniciar postulación');
reset role;
select is((select access_status::text from public.referrals where id=current_setting('retry.referral')::uuid),'revoked','Permiso anterior permanece revocado');
select is((select cv_document_id::text from public.referrals where id=current_setting('retry.referral')::uuid),current_setting('retry.doc'),'Referencia de CV derivado conservada');
select is((select to_jsonb(p)::text from public.participations p where id=current_setting('retry.first')::uuid),current_setting('retry.original'),'Fila retirada original intacta');
select is((select status::text from public.participations where id=current_setting('retry.other')::uuid),'received','Otra participación no cambia');
select is((select count(*) from public.audit_events where action='participation_created' and entity_id in
 (current_setting('retry.first')::uuid,current_setting('retry.second')::uuid,current_setting('retry.third')::uuid)),3::bigint,'Cada intento tiene evento propio');
select is((select count(*) from public.participations where opening_id=private.fixture_id('retry-offer',1) and status<>'withdrawn'),1::bigint,'Un solo caso no retirado');
select throws_ok($$insert into public.participations(candidate_id,opening_id,origin,created_by,status)
 values(private.fixture_id('profile',200),private.fixture_id('retry-offer',1),'self_application',private.fixture_id('candidate',200),'received')$$,
 '23505',null,'Índice impide duplicado aun fuera del comando');
-- All other final outcomes still block; no permission or business change to them.
insert into public.participations(candidate_id,opening_id,origin,created_by,status,final_outcome_at,final_outcome_by)
select private.fixture_id('profile',200),private.fixture_id('retry-offer',n),'self_application',private.fixture_id('candidate',200),
 s::public.participation_status,clock_timestamp(),private.fixture_id('admin',1)
from (values(3,'hired'),(4,'not_selected'),(5,'cancelled'),(6,'no_company_response')) v(n,s);
set local role authenticated;
select pg_temp.retry_actor('candidate',200,'000000000001');
select throws_ok($$select pg_temp.retry_apply(3)$$,'P0001','INVALID_TRANSITION','Contratado bloquea');
select throws_ok($$select pg_temp.retry_apply(4)$$,'P0001','INVALID_TRANSITION','No seleccionado bloquea');
select throws_ok($$select pg_temp.retry_apply(5)$$,'P0001','INVALID_TRANSITION','Cancelación municipal bloquea');
select throws_ok($$select pg_temp.retry_apply(6)$$,'P0001','INVALID_TRANSITION','Sin respuesta bloquea');
select pg_temp.retry_actor('candidate',203,'000000000004');
select throws_ok($$select public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('retry-offer',7),1,'self_application')$$,
 'P0001','NOT_FOUND','Actor ajeno no postula por otro');
reset role;
select ok(not has_function_privilege('anon','public.apply_to_opening(uuid,integer)','EXECUTE'),'Anónimo sin acceso');
set local role authenticated;
select pg_temp.retry_actor('candidate',200,'000000000001');
select set_config('retry.availability_case',pg_temp.retry_apply(7)::text,true);
select lives_ok($$select public.transition_participation(current_setting('retry.availability_case')::uuid,1,'withdraw')$$,'Prepara retiro para revisar disponibilidad');
reset role;
update public.candidate_profiles set availability='unavailable' where id=private.fixture_id('profile',200);
set local role authenticated;
select throws_ok($$select public.apply_to_opening(private.fixture_id('retry-offer',7),
 (select version from public.candidate_profiles where id=private.fixture_id('profile',200)))$$,
 'P0001','INVALID_TRANSITION','Perfil no disponible no admite reintento aun con versión actual');
reset role;
select * from finish();
rollback;
