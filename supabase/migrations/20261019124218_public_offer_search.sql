create view private.public_offer_rows with (security_barrier=true,security_invoker=true) as
select o.id,o.slug,o.title,o.tasks,o.requirements,o.vacancies,o.location,o.modality,o.schedule,
  o.contract_type,o.closing_date,o.salary,o.benefits,c.legal_name as company_name,o.published_at,
  coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'name',j.name) order by j.name)
    from public.opening_categories oc join public.job_categories j on j.id=oc.category_id
    where oc.opening_id=o.id),'[]'::jsonb) as categories
from public.job_openings o join public.company_profiles c on c.id=o.company_id
join public.accounts a on a.id=c.account_id
where o.status='published' and o.archived_at is null and c.status='active' and c.archived_at is null
  and a.status='active' and o.closing_date >= (clock_timestamp() at time zone 'America/Buenos_Aires')::date;
revoke all on private.public_offer_rows from public,anon,authenticated,service_role;

create function public.search_published_offers(p_page integer default 1,p_page_size integer default 10,
  p_q text default '',p_rubro text default '',p_localidad text default '',p_modalidad text default '',p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare safe_page integer:=greatest(1,least(coalesce(p_page,1),10000));
  safe_size integer:=greatest(1,least(coalesce(p_page_size,10),30)); result jsonb;
begin
  p_q:=btrim(coalesce(p_q,'')); p_rubro:=btrim(coalesce(p_rubro,''));
  p_localidad:=btrim(coalesce(p_localidad,'')); p_modalidad:=btrim(coalesce(p_modalidad,''));
  if length(p_q)>120 or length(p_rubro)>50 or length(p_localidad)>200 or length(p_modalidad)>100 then
    raise exception 'VALIDATION_ERROR';
  end if;
  with matching as materialized (
    select o.* from private.public_offer_rows o
    where (p_id is null or o.id=p_id)
      and (p_q='' or strpos(lower(o.title),lower(p_q))>0
        or strpos(lower(o.tasks),lower(p_q))>0 or strpos(lower(o.requirements),lower(p_q))>0)
      and (p_localidad='' or lower(btrim(o.location))=lower(p_localidad))
      and (p_modalidad='' or lower(btrim(o.modality))=lower(p_modalidad))
      and (p_rubro='' or exists(select 1 from public.opening_categories oc
        join public.job_categories j on j.id=oc.category_id
        where oc.opening_id=o.id and j.active and j.code=p_rubro))
  )
  select jsonb_build_object('total',(select count(*) from matching),'page',safe_page,'pageSize',safe_size,
    'items',coalesce((select jsonb_agg(to_jsonb(items)-'published_at') from (
      select * from matching order by published_at desc,id desc
      limit safe_size offset (safe_page-1)*safe_size
    ) items),'[]'::jsonb)) into result;
  return result;
end $$;
revoke all on function public.search_published_offers(integer,integer,text,text,text,text,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.search_published_offers(integer,integer,text,text,text,text,uuid) to anon,authenticated;

create or replace function public.published_offers(p_page integer default 1,p_page_size integer default 10,p_id uuid default null)
returns jsonb language sql stable security definer set search_path='' as $$
  select public.search_published_offers(p_page=>p_page,p_page_size=>p_page_size,p_id=>p_id)
$$;

create function public.public_offer_filter_options() returns jsonb
language sql stable security definer set search_path='' as $$
  with visible as materialized (select id,location,modality from private.public_offer_rows)
  select jsonb_build_object(
    'categories',coalesce((select jsonb_agg(to_jsonb(options) order by label,value) from (
      select j.code as value,min(j.name) as label from visible o
      join public.opening_categories oc on oc.opening_id=o.id
      join public.job_categories j on j.id=oc.category_id where j.active group by j.code
    ) options),'[]'::jsonb),
    'localities',coalesce((select jsonb_agg(to_jsonb(options) order by label,value) from (
      select lower(btrim(location)) as value,min(btrim(location)) as label from visible
      where btrim(location)<>'' group by lower(btrim(location))
    ) options),'[]'::jsonb),
    'modalities',coalesce((select jsonb_agg(to_jsonb(options) order by label,value) from (
      select lower(btrim(modality)) as value,min(btrim(modality)) as label from visible
      where btrim(modality)<>'' group by lower(btrim(modality))
    ) options),'[]'::jsonb))
$$;
revoke all on function public.public_offer_filter_options() from public,anon,authenticated,service_role;
grant execute on function public.public_offer_filter_options() to anon,authenticated;
notify pgrst, 'reload schema';
