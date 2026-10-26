-- Additive read contract. Legacy matching, the shared pool and business rows stay intact.
create function public.match_opening_candidates_ordered(p_opening uuid,
  p_order text default 'updated_desc',p_page integer default 1,p_page_size integer default 20)
returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare actor public.accounts; opening public.job_openings; available boolean; result jsonb;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_opening is null or p_order is null or p_order not in ('updated_desc','updated_asc')
    or p_page is null or p_page_size is null or p_page not between 1 and 10000
    or p_page_size not between 1 and 50 then raise exception 'INVALID_INPUT'; end if;
  select * into opening from public.job_openings where id=p_opening and archived_at is null;
  if opening.id is null then raise exception 'NOT_FOUND'; end if;
  available := coalesce(opening.status in ('published','paused')
    and opening.closing_date >= (statement_timestamp() at time zone 'America/Buenos_Aires')::date
    and exists(select 1 from public.company_profiles company join public.accounts account on account.id=company.account_id
      where company.id=opening.company_id and company.status='active' and company.archived_at is null and account.status='active'),false);
  with matching as materialized (
    select pool.id,pool.display_name,pool.locality,pool.matched_categories,candidate.updated_at
    from private.opening_candidate_pool(p_opening) pool
    join public.candidate_profiles candidate on candidate.id=pool.id
  )
  select jsonb_build_object('available',available,'total',(select count(*) from matching),'page',p_page,'pageSize',p_page_size,
    'items',coalesce((select jsonb_agg(jsonb_build_object('id',item.id,'displayName',item.display_name,'locality',item.locality,
      'matchedCategories',item.matched_categories,'participationId',null) order by
        case when p_order='updated_desc' then item.updated_at end desc,
        case when p_order='updated_asc' then item.updated_at end asc,item.display_name,item.id)
      from (select * from matching order by
        case when p_order='updated_desc' then updated_at end desc,
        case when p_order='updated_asc' then updated_at end asc,display_name,id
        limit p_page_size offset (p_page-1)*p_page_size) item),'[]'::jsonb)) into result;
  return result;
end $$;
revoke all on function public.match_opening_candidates_ordered(uuid,text,integer,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.match_opening_candidates_ordered(uuid,text,integer,integer) to authenticated;
notify pgrst, 'reload schema';
