-- DEMO-ONLY maintenance. Install explicitly in the isolated project, never as a product migration.
-- No web/API role can call this function. The administrative transport must also bind project ref.
create or replace function private.reset_fictitious_demo(
  environment text, project_ref text, confirmation text, seed_sql text
) returns jsonb language plpgsql security invoker set search_path='' as $reset$
declare receipt uuid:=gen_random_uuid(); counts jsonb;
begin
  if environment is distinct from 'demo'
    or project_ref is distinct from 'kyjycjojzhwggjuqjnki'
    or confirmation is distinct from 'RESET-FICTITIOUS-DEMO-kyjycjojzhwggjuqjnki'
    or encode(extensions.digest(seed_sql,'sha256'),'hex') is distinct from
      'ae11e0374459bd64f5f6a7803223d3f74a56fc80966c066be69e13a47eadb7d7'
  then raise exception 'DEMO_RESET_GUARD'; end if;
  if not pg_try_advisory_xact_lock(720089) then raise exception 'DEMO_RESET_BUSY'; end if;
  perform set_config('lock_timeout','10s',true);
  lock table auth.users in access exclusive mode;
  lock table storage.objects in share mode;
  -- Additional identities must be reviewed separately: never silently erase a real mailbox.
  if (select count(*) from auth.users)<>554 or exists(
    select 1 from auth.users u where not exists (
      select 1 from generate_series(1,554) n where
      u.id=private.fixture_id(case when n<=4 then 'admin' when n<=504 then 'candidate' else 'company' end,
        case when n<=4 then n when n<=504 then n-4 else n-504 end)
      and u.email=(case when n<=4 then 'admin'||n when n<=504 then 'candidate'||(n-4) else 'company'||(n-504) end)||'@example.invalid'
    )
  ) then raise exception 'DEMO_RESET_UNKNOWN_IDENTITIES'; end if;
  if (select count(*) from storage.objects)<>500 or exists(
    select 1 from storage.objects o where o.bucket_id<>'candidate-cvs' or not exists(
      select 1 from generate_series(1,500) n where
      o.name=private.fixture_id('profile',n)::text||'/'||private.fixture_id('cv',n)::text||'.pdf'
    ) or (o.metadata->>'size')::bigint is distinct from 1426 or o.metadata->>'mimetype' is distinct from 'application/pdf'
  ) then raise exception 'DEMO_RESET_UNKNOWN_STORAGE'; end if;
  -- These roots cascade through all business/history FKs; unlinked temporal history is explicit.
  -- Consent policy and schema/migration history are preserved. Files are immutable fixture objects.
  truncate public.accounts, public.job_categories, private.metrics_history restart identity cascade;
  delete from auth.users;
  execute seed_sql;
  counts:=jsonb_build_object('accounts',(select count(*) from public.accounts),
    'candidates',(select count(*) from public.candidate_profiles),
    'companies',(select count(*) from public.company_profiles),
    'offers',(select count(*) from public.job_openings),
    'participations',(select count(*) from public.participations),
    'cv',(select count(*) from public.cv_documents where status='valid'
      and sha256='1e6751c855dda6e8c69bfc5b4ba6d5efebffef6ea6cb7c3c10d697ed0d9ba397'));
  if counts<>'{"accounts":554,"candidates":500,"companies":50,"offers":100,"participations":1000,"cv":500}'::jsonb
  then raise exception 'DEMO_RESET_BAD_COUNTS'; end if;
  return jsonb_build_object('resetId',receipt,'at',clock_timestamp(),'projectRef',project_ref,
    'fixture','funes-demo-v1','seedSha256',encode(extensions.digest(seed_sql,'sha256'),'hex'),
    'counts',counts,'storageBytesVerified',false);
end $reset$;
revoke all on function private.reset_fictitious_demo(text,text,text,text) from public,anon,authenticated,service_role;
