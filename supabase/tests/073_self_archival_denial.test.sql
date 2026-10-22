begin;
select no_plan();
insert into auth.sessions(id,user_id) values
 (private.fixture_id('no-self-session',1),private.fixture_id('candidate',1)),
 (private.fixture_id('no-self-session',2),private.fixture_id('company',1)),
 (private.fixture_id('no-self-session',3),private.fixture_id('admin',1));
create function pg_temp.archival_snapshot() returns text language sql as $$
 select md5(jsonb_build_object(
  'accounts',(select jsonb_agg(to_jsonb(record) order by id) from public.accounts record),
  'profiles',(select jsonb_agg(to_jsonb(record) order by id) from public.candidate_profiles record),
  'companies',(select jsonb_agg(to_jsonb(record) order by id) from public.company_profiles record),
  'openings',(select jsonb_agg(to_jsonb(record) order by id) from public.job_openings record),
  'participations',(select jsonb_agg(to_jsonb(record) order by id) from public.participations record),
  'referrals',(select jsonb_agg(to_jsonb(record) order by id) from public.referrals record),
  'consents',(select jsonb_agg(to_jsonb(record) order by id) from public.candidate_consents record),
  'cvs',(select jsonb_agg(to_jsonb(record) order by id) from public.cv_documents record),
  'audit',(select jsonb_agg(to_jsonb(record) order by id) from public.audit_events record),
  'sessions',(select jsonb_agg(to_jsonb(record) order by id) from auth.sessions record)
 )::text)
$$;
select set_config('no_self.before',pg_temp.archival_snapshot(),true);
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id',private.fixture_id('no-self-session',1))::text,true);
select set_config('no_self.target',private.fixture_id('candidate',1)::text,true);
set local role authenticated;
select throws_ok(format('select public.change_account_status(%L,(select version from public.accounts where id=%L),%L,%L,true)',
 current_setting('no_self.target'),current_setting('no_self.target'),command,'Motivo ficticio'),
 'P0001','FORBIDDEN','Candidato no puede ejecutar '||command) from unnest(array['archive','restore','suspend','reactivate']) command;
reset role;
select is(pg_temp.archival_snapshot(),current_setting('no_self.before'),'Denegación candidata no cambia datos, sesiones, permisos ni auditoría');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id',private.fixture_id('no-self-session',2))::text,true);
select set_config('no_self.target',private.fixture_id('company',1)::text,true);
set local role authenticated;
select throws_ok(format('select public.change_account_status(%L,(select version from public.accounts where id=%L),%L,%L,true)',
 current_setting('no_self.target'),current_setting('no_self.target'),command,'Motivo ficticio'),
 'P0001','FORBIDDEN','Empresa no puede ejecutar '||command) from unnest(array['archive','restore','suspend','reactivate']) command;
reset role;
select is(pg_temp.archival_snapshot(),current_setting('no_self.before'),'Denegación empresarial no cambia datos, sesiones, permisos ni auditoría');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id',private.fixture_id('no-self-session',3))::text,true);
select set_config('no_self.target',private.fixture_id('candidate',1)::text,true);
set local role authenticated;
select throws_ok(format('select public.change_account_status(%L,(select version from public.accounts where id=%L),%L,%L,true)',
 current_setting('no_self.target'),current_setting('no_self.target'),'archive','Motivo ficticio'),
 'P0001','INVALID_TRANSITION','No se agrega archivo administrativo candidato');
reset role;
select is(pg_temp.archival_snapshot(),current_setting('no_self.before'),'Rechazo administrativo candidato tampoco modifica registros');
select ok(not has_function_privilege('anon','public.change_account_status(uuid,integer,text,text,boolean)','execute'),'Anónimo no ejecuta comando de cuentas');
select ok(not has_function_privilege('authenticated','private.change_account_status(uuid,integer,text,text,boolean)','execute'),'El comando privado no permite saltar la guardia pública');
select * from finish();
rollback;
