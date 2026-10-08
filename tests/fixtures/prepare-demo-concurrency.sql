-- TEST-ONLY: isolated LOCAL acceptance dataset, immediately after its cold reset.
-- Never run on hosted/demo data. This is test setup, not a migration.
begin;
do $setup$
begin
  if current_setting('funes.fixture_context',true) is distinct from 'isolated-local-acceptance'
    or (select count(*) from auth.users)<>554
    or exists(select 1 from auth.users u where not exists(
      select 1 from generate_series(1,554) n where
        u.id=private.fixture_id(case when n<=4 then 'admin' when n<=504 then 'candidate' else 'company' end,
          case when n<=4 then n when n<=504 then n-4 else n-504 end)
        and u.email=(case when n<=4 then 'admin'||n when n<=504 then 'candidate'||(n-4) else 'company'||(n-504) end)||'@example.invalid'
    ))
    or (select count(*) from public.candidate_profiles)<>500
    or (select count(*) from public.company_profiles)<>50
    or (select count(*) from public.job_openings)<>100
    or (select count(*) from public.participations)<>1000
    or (select count(*) from storage.objects where bucket_id='candidate-cvs')<>500
    or not exists(select 1 from public.job_openings where id=private.fixture_id('opening',80) and status='published' and version=1)
    or not exists(select 1 from public.participations where id=private.fixture_id('participation',775) and status='referred' and version=1)
    or not exists(select 1 from public.participations where id=private.fixture_id('participation',765) and status='referred' and version=1)
    or not exists(select 1 from public.participations where id=private.fixture_id('participation',755) and status='referred' and version=1)
  then raise exception 'DEMO_CONCURRENCY_FIXTURE_GUARD'; end if;
  update public.job_openings set status='pending_review',published_at=null where id=private.fixture_id('opening',80);
  delete from public.referrals where id=private.fixture_id('referral',775) and participation_id=private.fixture_id('participation',775);
  update public.participations set status='under_review',feedback_due_at=null where id=private.fixture_id('participation',775);
end $setup$;
select jsonb_build_object('variant','funes-acceptance-v2-concurrency','opening',80,'preselection',775,'contact',765,'outcome',755,
  'openingVersion',(select version from public.job_openings where id=private.fixture_id('opening',80)),
  'preselectionVersion',(select version from public.participations where id=private.fixture_id('participation',775)),
  'at',clock_timestamp()) as preparation;
commit;
