-- Diagnostic only. PostgREST list/count query with identical projections, filters and page.
begin;
do $$ declare sid uuid; begin
 select id into sid from auth.sessions where user_id=private.fixture_id('admin',1) and (not_after is null or not_after>now()) order by created_at desc limit 1;
 if sid is null then raise exception 'ACTIVE_FIXTURE_ADMIN_SESSION_REQUIRED'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'role','authenticated','session_id',sid)::text,true);
end $$;
set local role authenticated;
explain (analyze,buffers,format json)
WITH pgrst_source AS (SELECT id,legal_name,status,version,account_id,archived_at FROM public.company_profiles WHERE status='active' ORDER BY created_at DESC,id ASC LIMIT 10 OFFSET 10),
pgrst_source_count AS (SELECT 1 FROM public.company_profiles WHERE status='active')
SELECT (SELECT count(*) FROM pgrst_source_count) AS total_result_set,count(_postgrest_t) AS page_total,coalesce(json_agg(_postgrest_t),'[]'::json) AS body,
nullif(current_setting('response.headers',true),'') AS response_headers,nullif(current_setting('response.status',true),'') AS response_status,NULL AS response_inserted
FROM (SELECT * FROM pgrst_source) _postgrest_t;
rollback;
