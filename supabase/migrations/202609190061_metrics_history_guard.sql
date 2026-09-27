-- Forward-only hardening of US6. A history cell must not copy uncontrolled text.
create or replace function private.capture_metric_history() returns trigger language plpgsql security definer set search_path='' as $$
declare r jsonb; k text; eid uuid; rid uuid:='00000000-0000-0000-0000-000000000000'; at_time timestamptz;
begin
  r:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  k:=case tg_table_name when 'candidate_profiles' then 'candidate' when 'company_profiles' then 'company'
    when 'job_openings' then 'opening' when 'candidate_categories' then 'candidate_category' else 'opening_category' end;
  eid:=coalesce(r->>'id',r->>'candidate_id',r->>'opening_id')::uuid;
  if k in ('candidate_category','opening_category') then rid:=(r->>'category_id')::uuid; end if;
  at_time:=case when tg_op='INSERT' then (r->>'created_at')::timestamptz else clock_timestamp() end;
  insert into private.metrics_history(kind,entity_id,related_id,effective_at,status,availability,confirmed_at,archived,deleted)
  values(k,eid,rid,at_time,r->>'status',case when k='candidate' then case when r->>'availability'='available' then 'available' else 'unavailable' end end,
    (r->>'last_confirmed_at')::timestamptz,r->>'archived_at' is not null,tg_op='DELETE');
  return null;
end $$;
do $$ declare t text; begin
  foreach t in array array['metrics_coverage','metrics_history','metrics_outcomes','metrics_exports'] loop
    execute format('alter policy admin_read on private.%I using ((select private.is_admin()))',t);
  end loop;
end $$;
create function public.metrics_history_start() returns timestamptz language plpgsql security invoker set search_path='' as $$
declare result timestamptz; begin
  perform private.metrics_admin();
  select reliable_from into result from private.metrics_coverage;
  return case when isfinite(result) then result else null end;
end $$;
revoke all on function public.metrics_history_start() from public,anon,authenticated,service_role;
grant execute on function public.metrics_history_start() to authenticated;
