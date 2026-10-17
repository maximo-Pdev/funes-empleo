begin;

create function private.generate_opening_public_slug(p_title text) returns text
language sql volatile set search_path = '' as $$
  select coalesce(nullif(trim(both '-' from left(regexp_replace(
    translate(lower(coalesce(p_title,'')), 'áàäâéèëêíìïîóòöôúùüûñ', 'aaaaeeeeiiiioooouuuun'),
    '[^a-z0-9]+','-','g'),64)),''),'oferta') || '-' || encode(extensions.gen_random_bytes(8),'hex')
$$;
revoke all on function private.generate_opening_public_slug(text) from public,anon,authenticated,service_role;

alter table public.job_openings add column public_slug text;
alter table public.job_openings disable trigger version_row;
update public.job_openings set public_slug=private.generate_opening_public_slug(title);
alter table public.job_openings enable trigger version_row;
alter table public.job_openings alter column public_slug set not null;
alter table public.job_openings add constraint job_openings_public_slug_key unique(public_slug);
alter table public.job_openings add constraint job_openings_public_slug_format check (
  length(public_slug) <= 81 and public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[a-f0-9]{16}$'
);

create function private.assign_opening_public_slug() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op='INSERT' then
    new.public_slug := private.generate_opening_public_slug(new.title);
  elsif new.public_slug is distinct from old.public_slug then
    raise exception 'PUBLIC_SLUG_IMMUTABLE' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function private.assign_opening_public_slug() from public,anon,authenticated,service_role;
create trigger assign_public_slug before insert or update on public.job_openings
for each row execute function private.assign_opening_public_slug();

create or replace function public.published_offers(p_page integer default 1,p_page_size integer default 10,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare safe_page integer := greatest(1,least(coalesce(p_page,1),10000));
  safe_size integer := greatest(1,least(coalesce(p_page_size,10),30)); result jsonb;
begin
  select jsonb_build_object('total',count(*),'page',safe_page,'pageSize',safe_size,
    'items',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select o.id,o.public_slug as slug,o.title,o.tasks,o.requirements,o.vacancies,o.location,o.modality,o.schedule,
        o.contract_type,o.closing_date,o.salary,o.benefits,c.legal_name as company_name,
        coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'name',j.name) order by j.name)
          from public.opening_categories oc join public.job_categories j on j.id=oc.category_id
          where oc.opening_id=o.id), '[]'::jsonb) as categories
      from public.job_openings o join public.company_profiles c on c.id=o.company_id
      join public.accounts a on a.id=c.account_id
      where o.status='published' and o.archived_at is null and c.status='active' and c.archived_at is null
        and a.status='active' and o.closing_date >= (clock_timestamp() at time zone 'America/Buenos_Aires')::date
        and (p_id is null or o.id=p_id)
      order by o.published_at desc,o.id desc limit safe_size offset (safe_page-1)*safe_size
    ) x),'[]'::jsonb)) into result
  from public.job_openings o join public.company_profiles c on c.id=o.company_id
  join public.accounts a on a.id=c.account_id
  where o.status='published' and o.archived_at is null and c.status='active' and c.archived_at is null
    and a.status='active' and o.closing_date >= (clock_timestamp() at time zone 'America/Buenos_Aires')::date
    and (p_id is null or o.id=p_id);
  return result;
end $$;

create function public.published_offer_by_slug(p_slug text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare opening_id uuid;
begin
  if p_slug is not null and length(p_slug)<=81 and p_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[a-f0-9]{16}$' then
    select id into opening_id from public.job_openings where public_slug=p_slug;
  end if;
  if opening_id is null then
    return jsonb_build_object('total',0,'page',1,'pageSize',1,'items','[]'::jsonb);
  end if;
  return public.published_offers(1,1,opening_id);
end $$;
revoke all on function public.published_offer_by_slug(text) from public,anon,authenticated,service_role;
grant execute on function public.published_offer_by_slug(text) to anon,authenticated;

notify pgrst, 'reload schema';
commit;
