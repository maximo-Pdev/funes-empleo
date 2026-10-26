begin;
select no_plan();
select set_config('test.match_opening',(select id::text from private.public_offer_rows order by id limit 1),true);
create temporary table match_candidates as
select candidate.id from public.candidate_profiles candidate where candidate.status='active' and candidate.archived_at is null
and private.current_consent(candidate.id)
and exists(select 1 from public.cv_documents cv where cv.candidate_id=candidate.id and cv.status='valid' and cv.archived_at is null)
and (candidate.account_id is null or exists(select 1 from public.accounts account where account.id=candidate.account_id and account.status='active'))
and not exists(select 1 from public.participations participation where participation.candidate_id=candidate.id
and participation.opening_id=current_setting('test.match_opening')::uuid and participation.archived_at is null)
order by candidate.id limit 12;
update public.candidate_profiles set availability='available',refresh_due_at=clock_timestamp()+interval '1 month'
where id in (select id from match_candidates);
insert into public.candidate_categories(candidate_id,category_id,kind)
select m.id,j.id,'occupation' from match_candidates m cross join public.job_categories j
where j.version=2 and j.code='ADMINISTRACION';
insert into public.candidate_categories(candidate_id,category_id,kind)
select m.id,j.id,'occupation' from match_candidates m cross join public.job_categories j
where j.version=2 and j.code='COMERCIO';
select set_config('test.match_opening',(select id::text from public.job_openings where status='published' and archived_at is null order by id limit 1),true);
select set_config('test.match_candidate',(select id::text from match_candidates order by id limit 1),true);
insert into public.opening_categories(opening_id,category_id)
select current_setting('test.match_opening')::uuid,id from public.job_categories
where version=2 and code in ('ADMINISTRACION','COMERCIO');
delete from public.opening_categories where opening_id=current_setting('test.match_opening')::uuid
and category_id not in (select id from public.job_categories where version=2);

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
('ee450000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
('ee450000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
('ee450000-0000-4000-8000-000000000003',private.fixture_id('candidate',1));
-- Only in this rolled-back fixture: set deterministic dates and equal names/dates.
-- Re-enable the version trigger immediately; production behavior is unchanged.
alter table public.candidate_profiles disable trigger version_row;
with ranked as (select id,row_number() over(order by id) as n from match_candidates)
update public.candidate_profiles candidate set updated_at=timestamptz '2026-01-01 00:00:00+00'+((ranked.n-1)/3)*interval '1 day',
  display_name=case when ranked.n<=3 then 'Empate ficticio' else 'Persona ficticia '||ranked.n end
from ranked where candidate.id=ranked.id;
alter table public.candidate_profiles enable trigger version_row;
create temporary table ordered_baseline as select id,version,updated_at from public.candidate_profiles;
select set_config('test.ordered_audit',(select count(*)::text from public.audit_events),true);
select set_config('test.ordered_participations',(select count(*)::text from public.participations),true);
select set_config('test.ordered_referrals',(select count(*)::text from public.referrals),true);
select set_config('test.legacy_definition',pg_get_functiondef('public.match_opening_candidates(uuid,integer,integer)'::regprocedure),true);
select set_config('test.pool_definition',pg_get_functiondef('private.opening_candidate_pool(uuid)'::regprocedure),true);
select set_config('test.expected_desc',(select jsonb_agg(id order by updated_at desc,display_name,id)::text
  from public.candidate_profiles where id in(select id from match_candidates)),true);
select set_config('test.expected_asc',(select jsonb_agg(id order by updated_at,display_name,id)::text
  from public.candidate_profiles where id in(select id from match_candidates)),true);
select has_function('public','match_opening_candidates_ordered',array['uuid','text','integer','integer'],'RPC aditivo sin sobrecarga');
select ok(not has_function_privilege('anon','public.match_opening_candidates_ordered(uuid,text,integer,integer)','EXECUTE'),'Anónimo sin ejecución');
select ok(not has_function_privilege('service_role','public.match_opening_candidates_ordered(uuid,text,integer,integer)','EXECUTE'),'Servicio sin ejecución implícita');
select ok(has_function_privilege('authenticated','public.match_opening_candidates_ordered(uuid,text,integer,integer)','EXECUTE'),'Autenticado debe superar guard de rol');
select ok((select prosecdef and provolatile='v' and proconfig=array['search_path=""'] from pg_proc
  where oid='public.match_opening_candidates_ordered(uuid,text,integer,integer)'::regprocedure),'Definer con path vacío y guard compatible con locks');
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee450000-0000-4000-8000-000000000001')::text,true);
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid),
  public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc'),'Default más recientes');
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->>'total','12','Mismo conjunto OR sin duplicados');
select is((select jsonb_agg(item->>'id' order by page,ordinality) from generate_series(1,3) page
  cross join lateral jsonb_array_elements(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',page,5)->'items') with ordinality as rows(item,ordinality)),
  current_setting('test.expected_desc')::jsonb,'Tres páginas reproducen orden global descendente y desempates');
select is((select jsonb_agg(item->>'id' order by page,ordinality) from generate_series(1,3) page
  cross join lateral jsonb_array_elements(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_asc',page,5)->'items') with ordinality as rows(item,ordinality)),
  current_setting('test.expected_asc')::jsonb,'Tres páginas reproducen orden global ascendente y desempates');
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_asc',3,5)->>'total','12','Total independiente de orden/página');
select is(jsonb_array_length(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',3,5)->'items'),2,'Última página parcial');
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_asc',10000,5)->'items','[]'::jsonb,'Fuera de rango vacío');
select is((select jsonb_agg(item order by item->>'id') from jsonb_array_elements(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->'items') item),
  (select jsonb_agg(item order by item->>'id') from jsonb_array_elements(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->'items') item),'DTO y elegibilidad idénticos al legado');
select ok(not ((public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->'items'->0)
  ?| array['updated_at','updatedAt','dni','contacts','cvDocumentId','email','notes','score']),'No expone fechas ni datos adicionales');
select throws_ok($$select public.match_opening_candidates_ordered(null)$$,'P0001','INVALID_INPUT','Oferta nula');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,null)$$,'P0001','INVALID_INPUT','Orden nulo');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'created_desc')$$,'P0001','INVALID_INPUT','Orden ajeno');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',0)$$,'P0001','INVALID_INPUT','Página cero');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',null)$$,'P0001','INVALID_INPUT','Página nula');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',10001)$$,'P0001','INVALID_INPUT','Página máxima');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',1,0)$$,'P0001','INVALID_INPUT','Tamaño cero');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',1,51)$$,'P0001','INVALID_INPUT','Tamaño máximo');
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid,'updated_desc',1,null)$$,'P0001','INVALID_INPUT','Tamaño nulo');
select throws_ok($$select public.match_opening_candidates_ordered('00000000-0000-4000-8000-ffffffffffff')$$,'P0001','NOT_FOUND','Oferta inexistente');
reset role;
select is((select count(*)::text from public.audit_events),current_setting('test.ordered_audit'),'Lecturas sin auditorías nuevas');
select is((select count(*)::text from public.participations),current_setting('test.ordered_participations'),'Lecturas sin nominaciones');
select is((select count(*)::text from public.referrals),current_setting('test.ordered_referrals'),'Lecturas sin derivaciones');
select is((select count(*) from ordered_baseline old join public.candidate_profiles current using(id)
  where (old.version,old.updated_at) is distinct from(current.version,current.updated_at)),0::bigint,'Lecturas conservan versiones y fechas');
-- Existing participation is still excluded; paused remains available, closed does not.
insert into public.participations(candidate_id,opening_id,origin,created_by,status)
values(current_setting('test.match_candidate')::uuid,current_setting('test.match_opening')::uuid,'admin_nomination',private.fixture_id('admin',1),'under_review');
set local role authenticated;
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->>'total','11','Nominado excluido antes de paginar');
reset role;
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
select id,'test-order',repeat('0',64),'withdrawn',private.fixture_id('admin',1),'assisted'
from match_candidates where id<>current_setting('test.match_candidate')::uuid order by id limit 1;
update public.job_openings set status='paused' where id=current_setting('test.match_opening')::uuid;
set local role authenticated;
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->>'total','10','Retiro de consentimiento mantiene exclusión');
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->>'available','true','Pausada disponible');
reset role;
update public.job_openings set status='closed',closed_at=clock_timestamp() where id=current_setting('test.match_opening')::uuid;
set local role authenticated;
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->>'available','false','Cerrada no disponible');
select is(public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)->'items','[]'::jsonb,'Cerrada sin candidatos');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee450000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)$$,'P0001','FORBIDDEN','Empresa denegada');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee450000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)$$,'P0001','FORBIDDEN','Candidato denegado');
reset role;
update public.accounts set status='suspended',suspended_reason='Prueba ficticia de orden',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1)
where id=private.fixture_id('admin',1);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee450000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)$$,'P0001','AUTH_REQUIRED','Administrador suspendido denegado');
reset role;
update public.accounts set status='active',suspended_reason=null,suspended_at=null,suspended_by=null where id=private.fixture_id('admin',1);
delete from auth.sessions where id='ee450000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select public.match_opening_candidates_ordered(current_setting('test.match_opening')::uuid)$$,'P0001','AUTH_REQUIRED','Sesión revocada denegada');
reset role;
select is(pg_get_functiondef('public.match_opening_candidates(uuid,integer,integer)'::regprocedure),current_setting('test.legacy_definition'),'Contrato legado intacto');
select is(pg_get_functiondef('private.opening_candidate_pool(uuid)'::regprocedure),current_setting('test.pool_definition'),'Pool compartido intacto');
select * from finish();
rollback;
