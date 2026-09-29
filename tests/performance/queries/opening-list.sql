-- Diagnostic only. Run separately in the isolated demo after timings.
begin;
do $$ declare sid uuid; begin
 select id into sid from auth.sessions where user_id=private.fixture_id('admin',1) and (not_after is null or not_after>now()) order by created_at desc limit 1;
 if sid is null then raise exception 'ACTIVE_FIXTURE_ADMIN_SESSION_REQUIRED'; end if;
 perform set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'role','authenticated','session_id',sid)::text,true);
end $$;
set local role authenticated;
explain (analyze,buffers,format json) WITH pgrst_source AS ( SELECT "public"."job_openings"."id", "public"."job_openings"."title", "public"."job_openings"."status", "public"."job_openings"."closing_date", "public"."job_openings"."version", "public"."job_openings"."created_at", row_to_json("job_openings_company_profiles_1".*)::jsonb AS "company_profiles" FROM "public"."job_openings" LEFT JOIN LATERAL ( SELECT "company_profiles_1"."legal_name" FROM "public"."company_profiles" AS "company_profiles_1" WHERE "company_profiles_1"."id" = "public"."job_openings"."company_id"   LIMIT NULL OFFSET 0 ) AS "job_openings_company_profiles_1" ON true WHERE  "public"."job_openings"."archived_at" IS NULL AND  "public"."job_openings"."status" = 'published'  ORDER BY "public"."job_openings"."created_at" DESC , "public"."job_openings"."id" ASC  LIMIT 10 OFFSET 10 ) , pgrst_source_count AS (SELECT 1  FROM "public"."job_openings" WHERE  "public"."job_openings"."archived_at" IS NULL AND  "public"."job_openings"."status" = 'published') SELECT (SELECT pg_catalog.count(*) FROM pgrst_source_count) AS total_result_set, pg_catalog.count(_postgrest_t) AS page_total, coalesce(json_agg(_postgrest_t), '[]'::json) AS body, nullif(current_setting('response.headers', true), '') AS response_headers, nullif(current_setting('response.status', true), '') AS response_status, NULL AS response_inserted FROM ( SELECT * FROM pgrst_source ) _postgrest_t;
rollback;
