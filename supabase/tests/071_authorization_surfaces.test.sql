begin;
select no_plan();
select ok(c.relrowsecurity,format('%I.%I requires RLS',n.nspname,c.relname))
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';
select ok(not has_table_privilege('anon',format('public.%I',c.relname),'INSERT,UPDATE,DELETE'),c.relname||': anonymous cannot mutate')
from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r';
-- Missing or renamed commands must fail, not silently remove assertions.
select ok(count(p.oid)>0 and coalesce(bool_and(not has_function_privilege('anon',p.oid,'EXECUTE')),false),expected.name||': exists and denies anonymous command execution')
from unnest(array['change_account_status','transition_participation','transition_opening','admin_metrics','export_admin_metrics','confirm_candidate_import']) expected(name)
left join pg_proc p on p.pronamespace='public'::regnamespace and p.proname=expected.name
group by expected.name;
select ok(count(p.oid)>0 and coalesce(bool_and(not p.prosecdef),false),expected.name||': exists and respects invoker')
from unnest(array['admin_metrics','export_admin_metrics','metrics_history_start']) expected(name)
left join pg_proc p on p.pronamespace='public'::regnamespace and p.proname=expected.name
group by expected.name;
select is((select public from storage.buckets where id='candidate-cvs'),false,'CV bucket is private');
select ok(not has_function_privilege('authenticated','private.run_daily_employment_maintenance(timestamp with time zone)','EXECUTE'),'No interactive system actor');
select ok(not has_function_privilege('authenticated','public.reserve_administrator_invitation(text,uuid)','EXECUTE'),'Privileged provisioning unavailable to browser role');
select ok(exists(select 1 from pg_indexes where schemaname='public' and indexname=i),i||': planned query index exists')
from unnest(array['candidate_search','candidate_category','opening_search','opening_category','participation_opening','referral_deadline','consent_latest']) i;
select * from finish();
rollback;
