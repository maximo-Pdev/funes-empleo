create function private.opening_candidate_pool(p_opening uuid)
returns table(id uuid,display_name text,locality text,skills text,availability text,refresh_due_at timestamptz,
  candidate_version integer,matched_categories jsonb,cv_id uuid)
language sql stable set search_path='' as $$
  select candidate.id,candidate.display_name,candidate.locality,candidate.skills_experience_summary,
    candidate.availability,candidate.refresh_due_at,candidate.version,shared.categories,cv.id
  from public.job_openings opening
  join public.company_profiles company on company.id=opening.company_id
  join public.accounts company_account on company_account.id=company.account_id
  cross join public.candidate_profiles candidate
  join public.cv_documents cv on cv.candidate_id=candidate.id and cv.status='valid' and cv.archived_at is null
  cross join lateral (
    select jsonb_agg(jsonb_build_object('code',category.code,'name',category.name) order by category.name,category.id) as categories
    from public.job_categories category where category.active
      and exists(select 1 from public.opening_categories offered where offered.opening_id=opening.id and offered.category_id=category.id)
      and exists(select 1 from public.candidate_categories selected where selected.candidate_id=candidate.id and selected.category_id=category.id)
    having count(*)>0
  ) shared
  where opening.id=p_opening and opening.archived_at is null and opening.status in ('published','paused')
    and opening.closing_date >= (statement_timestamp() at time zone 'America/Buenos_Aires')::date
    and company.status='active' and company.archived_at is null and company_account.status='active'
    and candidate.status='active' and candidate.archived_at is null and candidate.availability='available'
    and candidate.refresh_due_at>statement_timestamp() and private.current_consent(candidate.id)
    and (candidate.account_id is null or exists(select 1 from public.accounts account where account.id=candidate.account_id and account.status='active'))
    and not exists(select 1 from public.participations participation where participation.candidate_id=candidate.id
      and participation.opening_id=opening.id and participation.archived_at is null)
$$;
revoke all on function private.opening_candidate_pool(uuid) from public,anon,authenticated,service_role;

create or replace function public.match_opening_candidates(p_opening uuid,p_page integer default 1,p_page_size integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; opening public.job_openings; available boolean; result jsonb;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_opening is null or p_page is null or p_page_size is null
    or p_page not between 1 and 10000 or p_page_size not between 1 and 50 then raise exception 'INVALID_INPUT'; end if;
  select * into opening from public.job_openings where id=p_opening and archived_at is null;
  if opening.id is null then raise exception 'NOT_FOUND'; end if;
  available := coalesce(opening.status in ('published','paused')
    and opening.closing_date >= (statement_timestamp() at time zone 'America/Buenos_Aires')::date
    and exists(select 1 from public.company_profiles company join public.accounts account on account.id=company.account_id
      where company.id=opening.company_id and company.status='active' and company.archived_at is null and account.status='active'),false);
  with matching as materialized (
    select id,display_name,locality,matched_categories from private.opening_candidate_pool(p_opening)
  )
  select jsonb_build_object('available',available,'total',(select count(*) from matching),'page',p_page,'pageSize',p_page_size,
    'items',coalesce((select jsonb_agg(jsonb_build_object('id',item.id,'displayName',item.display_name,'locality',item.locality,
      'matchedCategories',item.matched_categories,'participationId',null) order by item.display_name,item.id)
      from (select * from matching order by display_name,id limit p_page_size offset (p_page-1)*p_page_size) item),'[]'::jsonb)) into result;
  return result;
end $$;

create function public.preview_opening_candidate(p_opening uuid,p_candidate uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate record; opening public.job_openings;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_opening is null or p_candidate is null then raise exception 'INVALID_INPUT'; end if;
  select * into opening from public.job_openings where id=p_opening and archived_at is null;
  select * into candidate from private.opening_candidate_pool(p_opening) where id=p_candidate;
  if opening.id is null or candidate.id is null then raise exception 'NOT_FOUND'; end if;
  return jsonb_build_object('id',candidate.id,'displayName',candidate.display_name,'locality',candidate.locality,
    'skills',candidate.skills,'availability',candidate.availability,'refreshDueAt',candidate.refresh_due_at,
    'candidateVersion',candidate.candidate_version,'cvId',candidate.cv_id,'matchedCategories',candidate.matched_categories,
    'openingId',opening.id,'openingTitle',opening.title,'openingVersion',opening.version,
    'categories',coalesce((select jsonb_agg(jsonb_build_object('name',category.name,'code',category.code,'kind',selected.kind)
      order by category.name,category.id) from public.candidate_categories selected
      join public.job_categories category on category.id=selected.category_id
      where selected.candidate_id=p_candidate and category.active),'[]'::jsonb));
end $$;
revoke all on function public.preview_opening_candidate(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.preview_opening_candidate(uuid,uuid) to authenticated;
notify pgrst, 'reload schema';
