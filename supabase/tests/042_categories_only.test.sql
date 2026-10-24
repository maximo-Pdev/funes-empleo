begin;
set local search_path=public,extensions;
select no_plan();
select ok(not exists(select 1 from public.candidate_categories where kind<>'occupation'),'Solo categorías operativas');
select ok((select relrowsecurity from pg_class where oid='private.legacy_candidate_interests'::regclass),'Historial tiene RLS');
select ok(not has_table_privilege(role,'private.legacy_candidate_interests','SELECT,INSERT,UPDATE,DELETE'),'Historial no accesible por '||role)
from unnest(array['anon','authenticated','service_role']) role;
select is((select count(*) from private.category_command_recovery),3::bigint,'Definiciones anteriores recuperables');
select throws_ok($$update private.category_command_recovery set definition=''$$,'P0001','APPEND_ONLY','Respaldo de contratos inmutable');
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee420000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee420000-0000-4000-8000-000000000002',private.fixture_id('candidate',1));
insert into public.job_categories(id,code,name,version,active)
select private.fixture_id('category-only',n),'CAT_TEST_'||n,'Categoría ficticia '||n,99,true from generate_series(1,40) n;
select set_config('co.ids',(select jsonb_agg(id order by code)::text from public.job_categories where version=99),true);
select set_config('co.data',jsonb_build_object('name','Perfil categorías ficticio','dni','99008001','phone','3410000000','email','',
 'locality','Funes','summary','Experiencia ficticia','availability','available','detail','','address','',
 'categories',current_setting('co.ids')::jsonb)::text,true);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee420000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.save_assisted_candidate(null,null,current_setting('co.data')::jsonb||jsonb_build_object('interests',current_setting('co.ids')::jsonb))$$,
 'P0001','INVALID_INPUT','No se guardan intereses nuevos mediante RPC legado');
select set_config('co.id',public.save_assisted_candidate(null,null,current_setting('co.data')::jsonb)->>'candidateId',true);
select is((select count(*) from public.candidate_categories where candidate_id=current_setting('co.id')::uuid),40::bigint,'Asistido guarda capacidad histórica combinada40');
select ok(not exists(select 1 from public.candidate_categories where candidate_id=current_setting('co.id')::uuid and kind<>'occupation'),'Guardado tiene un solo tipo');
select throws_ok(format('insert into public.candidate_categories(candidate_id,category_id,kind) values(%L,%L,%L)',
 current_setting('co.id'),private.fixture_id('category',1),'interest'),'42501',null,'Cliente no escribe asociaciones directamente');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee420000-0000-4000-8000-000000000002')::text,true);
select lives_ok($$select public.save_candidate_profile((select version from public.candidate_profiles where account_id=private.fixture_id('candidate',1)),
 'Persona ficticia','90000001','Funes','Experiencia ficticia','available','','',
 array(select jsonb_array_elements_text(current_setting('co.ids')::jsonb)::uuid))$$,'Autoservicio guarda40 categorías sin perder la unión');
select is((select count(*) from public.candidate_categories where candidate_id=(select id from public.candidate_profiles where account_id=private.fixture_id('candidate',1))),40::bigint,'Autoservicio mantiene las40 selecciones');
reset role;
select throws_ok(format('insert into public.candidate_categories(candidate_id,category_id,kind) values(%L,%L,%L)',
 current_setting('co.id'),private.fixture_id('category',1),'interest'),'23514',null,'DB rechaza nuevos tipos interest incluso con privilegios');
select * from finish();
rollback;
