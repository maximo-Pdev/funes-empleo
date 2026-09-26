-- US6 / EXTRA-001. Forward-only, no PII copies, no aggregate cache.
-- Existing installations have reliable snapshots only from this migration onward.
create table private.metrics_coverage (
  singleton boolean primary key default true check(singleton), reliable_from timestamptz not null
);
insert into private.metrics_coverage values(true, case when exists(select 1 from public.candidate_profiles)
  or exists(select 1 from public.company_profiles) or exists(select 1 from public.job_openings)
  then statement_timestamp() else '-infinity'::timestamptz end);

create table private.metrics_history (
  seq bigint generated always as identity primary key,
  kind text not null check(kind in ('candidate','company','opening','candidate_category','opening_category')),
  entity_id uuid not null, related_id uuid not null default '00000000-0000-0000-0000-000000000000',
  effective_at timestamptz not null, recorded_at timestamptz not null default clock_timestamp(),
  status text, availability text, confirmed_at timestamptz, archived boolean not null default false,
  deleted boolean not null default false
);
create index metrics_history_lookup on private.metrics_history(kind,entity_id,related_id,effective_at desc,seq desc);
create table private.metrics_outcomes (
  seq bigint generated always as identity primary key,
  participation_id uuid not null references public.participations(id),
  status public.participation_status not null check(status in ('hired','not_selected','withdrawn','cancelled','no_company_response')),
  occurred_at timestamptz not null, confirmed_by uuid references public.accounts(id)
);
create index metrics_outcomes_period on private.metrics_outcomes(occurred_at,status);
create table private.metrics_exports (
  id uuid primary key default gen_random_uuid(), actor_id uuid not null references public.accounts(id),
  occurred_at timestamptz not null default clock_timestamp(), period_from date not null, period_to date not null,
  category_id uuid references public.job_categories(id), request_id uuid not null default gen_random_uuid()
);
do $$ declare t text; begin
  foreach t in array array['metrics_coverage','metrics_history','metrics_outcomes','metrics_exports'] loop
    execute format('alter table private.%I enable row level security',t);
    execute format('revoke all on private.%I from public,anon,authenticated,service_role',t);
    execute format('grant select on private.%I to authenticated',t);
    execute format('create policy admin_read on private.%I for select to authenticated using(private.is_admin())',t);
    execute format('create trigger append_only before update or delete on private.%I for each row execute function private.deny_history_change()',t);
  end loop;
end $$;

create function private.capture_metric_history() returns trigger language plpgsql security definer set search_path='' as $$
declare r jsonb; k text; eid uuid; rid uuid:='00000000-0000-0000-0000-000000000000'; at_time timestamptz;
begin
  r:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
  k:=case tg_table_name when 'candidate_profiles' then 'candidate' when 'company_profiles' then 'company'
    when 'job_openings' then 'opening' when 'candidate_categories' then 'candidate_category' else 'opening_category' end;
  eid:=coalesce(r->>'id',r->>'candidate_id',r->>'opening_id')::uuid;
  if k in ('candidate_category','opening_category') then rid:=(r->>'category_id')::uuid; end if;
  at_time:=case when tg_op='INSERT' then (r->>'created_at')::timestamptz else clock_timestamp() end;
  insert into private.metrics_history(kind,entity_id,related_id,effective_at,status,availability,confirmed_at,archived,deleted)
  values(k,eid,rid,at_time,r->>'status',r->>'availability',(r->>'last_confirmed_at')::timestamptz,
    r->>'archived_at' is not null,tg_op='DELETE');
  return null;
end $$;
do $$ declare t text; begin
  foreach t in array array['candidate_profiles','company_profiles','job_openings','candidate_categories','opening_categories'] loop
    execute format('create trigger capture_metrics after insert or update or delete on public.%I for each row execute function private.capture_metric_history()',t);
  end loop;
end $$;

-- Baseline is deliberately dated now, never backdated from current mutable values.
insert into private.metrics_history(kind,entity_id,effective_at,status,availability,confirmed_at,archived)
select 'candidate',id,statement_timestamp(),status::text,availability,last_confirmed_at,archived_at is not null from public.candidate_profiles;
insert into private.metrics_history(kind,entity_id,effective_at,status,archived)
select 'company',id,statement_timestamp(),status::text,archived_at is not null from public.company_profiles
union all select 'opening',id,statement_timestamp(),status::text,archived_at is not null from public.job_openings;
insert into private.metrics_history(kind,entity_id,related_id,effective_at)
select 'candidate_category',candidate_id,category_id,statement_timestamp() from public.candidate_categories
union all select 'opening_category',opening_id,category_id,statement_timestamp() from public.opening_categories;

create function private.capture_metric_outcome() returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.status in ('hired','not_selected','withdrawn','cancelled','no_company_response') and new.final_outcome_at is not null then
    if tg_op='INSERT' or old.status is distinct from new.status then
      insert into private.metrics_outcomes(participation_id,status,occurred_at,confirmed_by)
      values(new.id,new.status,new.final_outcome_at,new.final_outcome_by);
    end if;
  end if;
  return null;
end $$;
create trigger capture_metrics_outcome after insert or update on public.participations
for each row execute function private.capture_metric_outcome();
insert into private.metrics_outcomes(participation_id,status,occurred_at,confirmed_by)
select id,status,final_outcome_at,final_outcome_by from public.participations
where final_outcome_at is not null and status in ('hired','not_selected','withdrawn','cancelled','no_company_response');

create function private.metrics_admin() returns uuid language plpgsql security definer set search_path='' as $$
declare a public.accounts; begin
  a:=private.require_workflow_actor();
  if a.role<>'admin' then raise exception 'FORBIDDEN'; end if;
  return a.id;
end $$;
create function private.metric_categories(p_kind text,p_entity uuid,p_at timestamptz) returns uuid[]
language sql stable security invoker set search_path='' as $$
  select coalesce(array_agg(related_id order by related_id) filter(where not deleted),'{}'::uuid[])
  from (select distinct on(related_id) related_id,deleted from private.metrics_history
    where kind=p_kind and entity_id=p_entity and effective_at<p_at
    order by related_id,effective_at desc,seq desc) s
$$;

create function public.admin_metrics(p_from date,p_to date,p_category uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare since timestamptz; until_time timestamptz; as_of timestamptz; reliable timestamptz; rows jsonb;
begin
  perform private.metrics_admin();
  if p_from is null or p_to is null or p_from>p_to or not isfinite(p_from) or not isfinite(p_to)
    or p_to>(statement_timestamp() at time zone 'America/Buenos_Aires')::date
    or (p_category is not null and not exists(select 1 from public.job_categories where id=p_category)) then
    raise exception 'INVALID_INPUT';
  end if;
  since:=p_from::timestamp at time zone 'America/Buenos_Aires';
  until_time:=(p_to+1)::timestamp at time zone 'America/Buenos_Aires';
  as_of:=least(until_time,statement_timestamp());
  select reliable_from into reliable from private.metrics_coverage;
  -- No misleading zeroes for pre-migration periods with unknown history.
  if since<reliable then raise exception 'METRICS_HISTORY_UNAVAILABLE'; end if;
  with snapshots as (
    select distinct on(kind,entity_id) kind,entity_id,status,availability,confirmed_at,archived,deleted
    from private.metrics_history where kind in ('candidate','company','opening') and effective_at<as_of
    order by kind,entity_id,effective_at desc,seq desc
  ), candidates as (
    select s.entity_id,private.metric_categories('candidate_category',s.entity_id,as_of) cats
    from snapshots s where s.kind='candidate' and s.status='active' and not s.archived and not s.deleted
      and s.availability='available' and s.confirmed_at<=as_of and s.confirmed_at>as_of-interval '6 months'
      and coalesce((select c.status='accepted' from public.candidate_consents c where c.candidate_id=s.entity_id
        and c.recorded_at<as_of order by c.recorded_at desc,c.id desc limit 1),false)
  ), openings as (
    select s.*,private.metric_categories('opening_category',s.entity_id,as_of) cats
    from snapshots s where s.kind='opening' and not s.archived and not s.deleted
  ), activity as (
    select 'applications'::text indicator,p.created_at at_time,p.opening_id from public.participations p
    union all select 'preinterviews',i.created_at,p.opening_id from public.preinterviews i join public.participations p on p.id=i.participation_id
    union all select 'referrals',r.referred_at,p.opening_id from public.referrals r join public.participations p on p.id=r.participation_id
    union all select m.status::text,m.occurred_at,p.opening_id from private.metrics_outcomes m join public.participations p on p.id=m.participation_id
  ), filtered_activity as (
    select a.*,private.metric_categories('opening_category',a.opening_id,a.at_time+interval '1 microsecond') cats
    from activity a where at_time>=since and at_time<until_time and at_time<=statement_timestamp()
  ), hires as (
    select p.opening_id,m.participation_id,min(m.occurred_at) hired_at from private.metrics_outcomes m
    join public.participations p on p.id=m.participation_id join public.accounts a on a.id=m.confirmed_by and a.role='admin'
    where m.status='hired' and m.occurred_at<=statement_timestamp() group by p.opening_id,m.participation_id
  ), duration as (
    select o.id,o.title,o.published_at,o.vacancies,
      (select array_agg(h.hired_at order by h.hired_at,h.participation_id) from hires h where h.opening_id=o.id) times
    from public.job_openings o where o.published_at>=since and o.published_at<until_time and o.published_at<=statement_timestamp()
      and (p_category is null or p_category=any(private.metric_categories('opening_category',o.id,statement_timestamp())))
  ), result as (
    select 'active_candidates'::text indicator,count(*)::numeric value,'count'::text unit,'calculated'::text state,
      p_category category_id,null::uuid opening_id,null::text opening_title
    from candidates where p_category is null or p_category=any(cats)
    union all select 'companies',count(*)::numeric,'count','calculated',null,null,null from snapshots where kind='company' and not deleted
    union all select 'companies_'||e::text,(select count(*) from snapshots where kind='company' and status=e::text and not deleted),'count','calculated',null,null,null
      from unnest(enum_range(null::public.company_status)) e
    union all select 'openings_'||e::text,(select count(*) from openings where status=e::text and (p_category is null or p_category=any(cats))),'count','calculated',p_category,null,null
      from unnest(enum_range(null::public.opening_status)) e
    union all select e,(select count(*) from filtered_activity where indicator=e and (p_category is null or p_category=any(cats))),'count','calculated',p_category,null,null
      from unnest(array['applications','preinterviews','referrals','hired','not_selected','withdrawn','cancelled','no_company_response']) e
    union all select 'first_hire_days',extract(epoch from (times[1]-published_at))/86400,'days',case when times[1] is null then 'pending' else 'calculated' end,p_category,id,title from duration
    union all select 'coverage_days',extract(epoch from (times[vacancies]-published_at))/86400,'days',case when times[vacancies] is null then 'pending' else 'calculated' end,p_category,id,title from duration
    union all select 'category_active_candidates',(select count(*) from candidates where c.id=any(cats)),'count','calculated',c.id,null,null
      from public.job_categories c where p_category is null or c.id=p_category
    union all select 'category_applications',(select count(*) from filtered_activity where indicator='applications' and c.id=any(cats)),'count','calculated',c.id,null,null
      from public.job_categories c where p_category is null or c.id=p_category
    union all select 'category_hired',(select count(*) from filtered_activity where indicator='hired' and c.id=any(cats)),'count','calculated',c.id,null,null
      from public.job_categories c where p_category is null or c.id=p_category
  ) select coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('category_name',c.name) order by r.indicator,r.category_id,r.opening_id),'[]')
  into rows from result r left join public.job_categories c on c.id=r.category_id;
  return jsonb_build_object('as_of',as_of,'history_from',case when isfinite(reliable) then reliable else null end,'rows',rows);
end $$;

create function public.export_admin_metrics(p_from date,p_to date,p_category uuid default null) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare result jsonb; begin
  result:=public.admin_metrics(p_from,p_to,p_category);
  perform public.record_metrics_export(p_from,p_to,p_category);
  return result;
end $$;
-- Narrow definer writes only validated filters, never CSV content or arbitrary metadata.
create function public.record_metrics_export(p_from date,p_to date,p_category uuid default null) returns void
language plpgsql security definer set search_path='' as $$
declare actor uuid; export_id uuid; rid uuid; begin
  actor:=private.metrics_admin();
  if p_from is null or p_to is null or p_from>p_to or not isfinite(p_from) or not isfinite(p_to)
    or p_to>(statement_timestamp() at time zone 'America/Buenos_Aires')::date then raise exception 'INVALID_INPUT'; end if;
  insert into private.metrics_exports(actor_id,period_from,period_to,category_id) values(actor,p_from,p_to,p_category)
    returning id,request_id into export_id,rid;
  insert into public.audit_events(entity_type,entity_id,action,actor_type,actor_account_id,request_id,metadata_safe)
    values('metrics_exports',export_id,'metrics_exported','account',actor,rid,jsonb_build_object('decision_id',export_id));
end $$;

revoke all on function private.capture_metric_history(),private.capture_metric_outcome(),private.metrics_admin(),private.metric_categories(text,uuid,timestamptz) from public,anon,authenticated,service_role;
grant execute on function private.metrics_admin(),private.metric_categories(text,uuid,timestamptz) to authenticated;
revoke all on function public.admin_metrics(date,date,uuid),public.export_admin_metrics(date,date,uuid),public.record_metrics_export(date,date,uuid) from public,anon,authenticated,service_role;
grant execute on function public.admin_metrics(date,date,uuid),public.export_admin_metrics(date,date,uuid),public.record_metrics_export(date,date,uuid) to authenticated;
