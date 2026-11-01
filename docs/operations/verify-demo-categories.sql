-- Metadata and aggregate counts only: no candidate/company identity or backup payload.
select jsonb_build_object(
 'categories',coalesce((select jsonb_agg(jsonb_build_object('code',j.code,'active',j.active,
   'candidate_links',(select count(*) from public.candidate_categories c where c.category_id=j.id),
   'opening_links',(select count(*) from public.opening_categories o where o.category_id=j.id)) order by j.code)
   from public.job_categories j where j.version=1 and j.code in ('DEMO-A','DEMO-B')),'[]'::jsonb),
 'backup_counts',(select jsonb_object_agg(source_table,n) from (
   select source_table,count(*) n from private.demo_category_retirement_backup group by source_table) totals),
 'backup_metadata_complete',not exists(select 1 from private.demo_category_retirement_backup
   where captured_at is null or captured_by is null or migration_version<>'20261101120000' or reason=''),
 'backup_rls',(select relrowsecurity from pg_class where oid='private.demo_category_retirement_backup'::regclass),
 'backup_no_app_grants',not exists(select 1 from unnest(array['anon','authenticated','service_role']) r
   where has_table_privilege(r,'private.demo_category_retirement_backup','SELECT,INSERT,UPDATE,DELETE,TRUNCATE')),
 'backup_append_only',exists(select 1 from pg_trigger where tgrelid='private.demo_category_retirement_backup'::regclass
   and tgname='append_only' and tgenabled='O'),
 'public_filters_clean',not exists(select 1 from jsonb_array_elements(public.public_offer_filter_options()->'categories') c
   where c->>'value' in ('DEMO-A','DEMO-B')),
 'active_real_categories',(select count(*) from public.job_categories where version=2 and active),
 'other_history_fingerprint',(select md5(coalesce(string_agg(version||':'||coalesce(name,''),',' order by version),''))
   from supabase_migrations.schema_migrations where version<>'20261101120000'),
 'migration_recorded',exists(select 1 from supabase_migrations.schema_migrations where version='20261101120000')
);
