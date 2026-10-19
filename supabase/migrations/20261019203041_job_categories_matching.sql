insert into public.job_categories(code,name,description,version) values
('ADMINISTRACION','Administración','Catálogo amplio A08',2),
('ATENCION_VENTAS','Atención al cliente y ventas','Catálogo amplio A08',2),
('COMERCIO','Comercio','Catálogo amplio A08',2),
('GASTRONOMIA_HOTELERIA','Gastronomía y hotelería','Catálogo amplio A08',2),
('LIMPIEZA','Limpieza','Catálogo amplio A08',2),
('CONSTRUCCION_OFICIOS','Construcción y oficios','Catálogo amplio A08',2),
('MANTENIMIENTO','Mantenimiento','Catálogo amplio A08',2),
('PRODUCCION_INDUSTRIA','Producción e industria','Catálogo amplio A08',2),
('LOGISTICA_DEPOSITO','Logística y depósito','Catálogo amplio A08',2),
('TRANSPORTE_REPARTO','Transporte y reparto','Catálogo amplio A08',2),
('SALUD_CUIDADOS','Salud y cuidados','Catálogo amplio A08',2),
('EDUCACION','Educación','Catálogo amplio A08',2),
('TECNOLOGIA','Tecnología','Catálogo amplio A08',2),
('SEGURIDAD','Seguridad','Catálogo amplio A08',2),
('AGRO','Agro','Catálogo amplio A08',2);

create function public.match_opening_candidates(p_opening uuid,p_page integer default 1,p_page_size integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; opening public.job_openings; available boolean;
  now_at timestamptz := clock_timestamp(); result jsonb;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_opening is null or p_page is null or p_page_size is null
    or p_page not between 1 and 10000 or p_page_size not between 1 and 50 then
    raise exception 'INVALID_INPUT';
  end if;
  select * into opening from public.job_openings where id=p_opening and archived_at is null;
  if opening.id is null then raise exception 'NOT_FOUND'; end if;
  available := coalesce(opening.status in ('published','paused')
    and opening.closing_date >= (now_at at time zone 'America/Buenos_Aires')::date
    and exists(select 1 from public.company_profiles company join public.accounts account on account.id=company.account_id
      where company.id=opening.company_id and company.status='active' and company.archived_at is null and account.status='active'),false);
  with matching as materialized (
    select candidate.id,candidate.display_name,candidate.locality,shared.categories,
      (select participation.id from public.participations participation
        where participation.candidate_id=candidate.id and participation.opening_id=p_opening
          and participation.archived_at is null order by participation.created_at desc,participation.id desc limit 1) as participation_id
    from public.candidate_profiles candidate
    cross join lateral (
      select jsonb_agg(jsonb_build_object('code',category.code,'name',category.name) order by category.name,category.id) as categories
      from public.job_categories category
      where category.active
        and exists(select 1 from public.opening_categories offered where offered.opening_id=p_opening and offered.category_id=category.id)
        and exists(select 1 from public.candidate_categories selected where selected.candidate_id=candidate.id and selected.category_id=category.id)
      having count(*)>0
    ) shared
    where available and candidate.status='active' and candidate.archived_at is null
      and candidate.availability='available' and candidate.refresh_due_at>now_at
      and (candidate.account_id is null or exists(select 1 from public.accounts account where account.id=candidate.account_id and account.status='active'))
      and private.current_consent(candidate.id)
      and exists(select 1 from public.cv_documents cv where cv.candidate_id=candidate.id and cv.status='valid' and cv.archived_at is null)
  )
  select jsonb_build_object('available',available,'total',(select count(*) from matching),
    'page',p_page,'pageSize',p_page_size,'items',coalesce((
      select jsonb_agg(jsonb_build_object('id',item.id,'displayName',item.display_name,'locality',item.locality,
        'matchedCategories',item.categories,'participationId',item.participation_id) order by item.display_name,item.id)
      from (select * from matching order by display_name,id limit p_page_size offset (p_page-1)*p_page_size) item
    ),'[]'::jsonb)) into result;
  return result;
end $$;
revoke all on function public.match_opening_candidates(uuid,integer,integer) from public,anon,authenticated,service_role;
grant execute on function public.match_opening_candidates(uuid,integer,integer) to authenticated;
notify pgrst, 'reload schema';
