begin;
select no_plan();
-- Cross-cutting invariants supplement the command-specific rollback tests 001–060.
select ok(not exists(select 1 from public.audit_events where request_id is null or occurred_at is null or entity_id is null or action is null),'Every event has correlation, instant, entity and action');
select ok(not exists(select 1 from public.audit_events where (actor_type='account') is distinct from (actor_account_id is not null)),'Actor identity is coherent');
select ok(not exists(select 1 from public.audit_events where metadata_safe-array['decision_id','version','count']<>'{}'::jsonb or reason_text is not null),'Audit contains only allowlisted metadata, never free text');
select ok(not exists(select 1 from public.audit_events where actor_type='system' and action not in ('opening_auto_closed','no_company_response','referral_access_revoked','post_hire_window_ended')),'System events are limited to scheduled classes');
select ok(not has_table_privilege(r,'public.audit_events','INSERT,UPDATE,DELETE'),r||' cannot forge/rewrite audit') from unnest(array['anon','authenticated','service_role']) r;
select ok(not has_function_privilege(r,'private.run_daily_employment_maintenance(timestamp with time zone)','EXECUTE'),r||' cannot impersonate cron') from unnest(array['anon','authenticated','service_role']) r;
select throws_ok($$update public.audit_events set action=action where id=(select id from public.audit_events limit 1)$$,'P0001',null,'Even maintenance cannot silently rewrite history');
select throws_ok($$delete from public.audit_events where id=(select id from public.audit_events limit 1)$$,'P0001',null,'History cannot silently disappear');
select ok(exists(select 1 from pg_constraint where conrelid='public.audit_events'::regclass and pg_get_constraintdef(oid) like '%metadata_safe%'),'Safe metadata constrained in database');
select ok(exists(select 1 from pg_constraint where conrelid='public.audit_events'::regclass and pg_get_constraintdef(oid) like '%reason_text%'),'Free audit text forbidden in database');
select * from finish();
rollback;
