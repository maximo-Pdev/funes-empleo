-- T1 [S1,S3-S5]. Forward-only; preserve UUIDs, publication workflow and history.
-- Supabase applies this file transactionally. On failure the entire change rolls
-- back. After release, recover with a forward fix: never regenerate assigned
-- slugs or drop this column, because shared links are permanent identifiers.
alter table public.job_openings add column slug text;
alter table public.job_openings add constraint job_openings_slug_format
  check (slug is null or slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[a-f0-9]{12}$');
create unique index job_openings_slug_unique on public.job_openings(slug);

-- No new extension or external infrastructure is required.
create function private.opening_slug_suffix() returns text
language sql volatile set search_path='' as $$
  select left(replace(pg_catalog.gen_random_uuid()::text,'-',''),12)
$$;

create function private.assign_opening_slug() returns trigger
language plpgsql volatile security definer set search_path='' as $$
declare stem text; candidate text; attempt integer;
begin
  if tg_op='UPDATE' then
    if old.slug is not null then
      if new.slug is distinct from old.slug then raise exception 'IMMUTABLE_OPENING_SLUG'; end if;
      return new;
    end if;
  end if;
  -- Only this trigger owns initial allocation, including privileged direct DML.
  if new.slug is not null then raise exception 'OPENING_SLUG_MANAGED'; end if;
  if new.status='published' or new.published_at is not null or exists (
    select 1 from public.opening_moderation_events e
    where e.opening_id=new.id and e.decision in ('approved','resumed')
  ) then
    -- NFKD plus combining-mark removal handles Spanish accents, including
    -- decomposed Unicode, without introducing an unaccent extension prerequisite.
    stem:=pg_catalog.lower(pg_catalog.regexp_replace(normalize(coalesce(new.title,''),NFKD),
      U&'[\0300-\036f]','','g'));
    stem:=pg_catalog.btrim(pg_catalog.regexp_replace(stem,'[^a-z0-9]+','-','g'),'-');
    stem:=coalesce(nullif(pg_catalog.rtrim(pg_catalog.left(stem,80),'-'),''),'oferta');
    -- A single transaction-scoped namespace lock covers the collision probe AND
    -- the eventual row write. Concurrent first publications cannot both select
    -- the same free slug under READ COMMITTED (the workflow default). A unique
    -- index remains the final invariant under every isolation level; callers at
    -- SERIALIZABLE/REPEATABLE READ must retry the whole transaction after a
    -- uniqueness or serialization conflict from a stale transaction snapshot.
    perform pg_catalog.pg_advisory_xact_lock(20261018,1);
    for attempt in 1..128 loop
      candidate:=stem||'-'||private.opening_slug_suffix();
      if not exists(select 1 from public.job_openings o where o.slug=candidate) then
        new.slug:=candidate;
        return new;
      end if;
    end loop;
    raise exception 'OPENING_SLUG_ALLOCATION_EXHAUSTED';
  end if;
  return new;
end $$;
revoke all on function private.opening_slug_suffix(),private.assign_opening_slug()
  from public,anon,authenticated,service_role;
create trigger opening_public_slug before insert or update on public.job_openings
for each row execute function private.assign_opening_slug();

-- The ALTERs already hold an exclusive table lock for the migration transaction.
-- Populate only known publication history, including paused/closed/restored rows.
-- Do not fabricate version bumps, modified timestamps, moderation or metric events
-- for a technical backfill. Existing history is neither rewritten nor deleted.
alter table public.job_openings disable trigger version_row;
alter table public.job_openings disable trigger capture_metrics;
update public.job_openings o set slug=null
where o.slug is null and (o.status='published' or o.published_at is not null or exists (
  select 1 from public.opening_moderation_events e
  where e.opening_id=o.id and e.decision in ('approved','resumed')
));
alter table public.job_openings enable trigger capture_metrics;
alter table public.job_openings enable trigger version_row;
alter table public.job_openings add constraint job_openings_published_slug
  check (status<>'published' or slug is not null);

-- Preserve the original signature, defaults, pagination, ordering, fields and
-- predicates. The only additive JSON field is slug.
create or replace function public.published_offers(p_page integer default 1,p_page_size integer default 10,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare safe_page integer := greatest(1,least(coalesce(p_page,1),10000));
  safe_size integer := greatest(1,least(coalesce(p_page_size,10),30)); result jsonb;
begin
  select jsonb_build_object('total',count(*),'page',safe_page,'pageSize',safe_size,
    'items',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select o.id,o.slug,o.title,o.tasks,o.requirements,o.vacancies,o.location,o.modality,o.schedule,
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
language plpgsql stable security definer set search_path='' as $$
declare opening_id uuid;
begin
  select o.id into opening_id from public.job_openings o where o.slug=p_slug;
  -- Passing NULL to the original RPC would accidentally list unrelated offers.
  if opening_id is null then
    return jsonb_build_object('total',0,'page',1,'pageSize',1,'items','[]'::jsonb);
  end if;
  -- Reuse the exact public projection and visibility rules; no duplicate policy.
  return public.published_offers(1,1,opening_id);
end $$;
revoke all on function public.published_offers(integer,integer,uuid),public.published_offer_by_slug(text)
  from public,anon,authenticated,service_role;
grant execute on function public.published_offers(integer,integer,uuid),public.published_offer_by_slug(text)
  to anon,authenticated;