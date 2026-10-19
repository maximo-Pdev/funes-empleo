-- T1 [S1,S3-S5]: fictitious local fixtures only; all changes roll back.
begin;
-- Keep the session in UTC to detect accidental use of current_date instead of
-- the Argentina business date used by the public visibility contract.
set local timezone='UTC';
select no_plan();
select has_column('public','job_openings','slug','Public slug is persisted beside the unchanged UUID');
select has_function('public','published_offer_by_slug',array['text'],'Public slug lookup exists');
select has_function('public','published_offers',array['integer','integer','uuid'],'UUID RPC signature remains available');

-- Seed an untitled draft, then drive publication through the existing actor gate.
insert into public.job_openings(id,company_id)
values ('ee210000-0000-4000-8000-000000000001',private.fixture_id('business',1));
select is((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000001'),null::text,
  'Untitled drafts do not allocate a slug');
update public.job_openings set title='  TÉCNICO / Atención: Ñandú & Logística  ',tasks='Fictitious tasks',
  requirements='Fictitious requirements',vacancies=1,location='Funes',modality='Presencial',schedule='Diurno',
  contract_type='Ficticio',closing_date=(clock_timestamp() at time zone 'America/Buenos_Aires')::date+365,status='pending_review'
where id='ee210000-0000-4000-8000-000000000001';
select is((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000001'),null::text,
  'A validated title before approval still has no public slug');
insert into public.opening_categories(opening_id,category_id)
values ('ee210000-0000-4000-8000-000000000001',private.fixture_id('category',1));
insert into auth.sessions(id,user_id)
values ('ee210000-0000-4000-8000-000000000010',private.fixture_id('admin',1));
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,
  'session_id','ee210000-0000-4000-8000-000000000010')::text,true);
select set_config('test.slug_version',(select version::text from public.job_openings
  where id='ee210000-0000-4000-8000-000000000001'),true);
set local role authenticated;
select lives_ok($$select public.transition_opening('ee210000-0000-4000-8000-000000000001',
  current_setting('test.slug_version')::integer,'approve')$$,'Authorized publication allocates the slug');
reset role;
select matches((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000001'),
  '^tecnico-atencion-nandu-logistica-[a-f0-9]{12}$','Spanish accents, punctuation and whitespace normalize');
select is((select version from public.job_openings where id='ee210000-0000-4000-8000-000000000001'),
  current_setting('test.slug_version')::integer+1,'Publication still increments the version exactly once');
select is((select count(*) from public.opening_moderation_events
  where opening_id='ee210000-0000-4000-8000-000000000001' and decision='approved'
    and actor_account_id=private.fixture_id('admin',1)),1::bigint,'Publication retains its moderation actor');
select is((select count(*) from public.audit_events where entity_id='ee210000-0000-4000-8000-000000000001'
  and action='opening_approved' and actor_account_id=private.fixture_id('admin',1)),1::bigint,
  'Publication retains its audit event');
select set_config('test.public_slug',(select slug from public.job_openings
  where id='ee210000-0000-4000-8000-000000000001'),true);

set local role anon;
select is(public.published_offer_by_slug(current_setting('test.public_slug')),
  public.published_offers(1,1,'ee210000-0000-4000-8000-000000000001'),'Slug and UUID return identical public JSON');
select is(public.published_offer_by_slug(current_setting('test.public_slug'))->'items'->0->>'slug',
  current_setting('test.public_slug'),'Both RPCs include the persistent slug');
select ok(not ((public.published_offer_by_slug(current_setting('test.public_slug'))->'items'->0)
  ?| array['email','phone','cuit_normalized','version','actor_account_id']),'Slug projection excludes private data');
select is(public.published_offer_by_slug('missing'),'{"total":0,"page":1,"pageSize":1,"items":[]}'::jsonb,
  'Missing slugs return the agreed empty page');
select is(public.published_offer_by_slug(null),public.published_offer_by_slug('missing'),'NULL never becomes an unfiltered listing');
select is(public.published_offer_by_slug(''),public.published_offer_by_slug('missing'),'Empty slugs do not match');
select is(public.published_offer_by_slug('ee210000-0000-4000-8000-000000000001'),
  public.published_offer_by_slug('missing'),'UUID is not treated as a public slug');
reset role;

update public.job_openings set title='Un título completamente nuevo' where id='ee210000-0000-4000-8000-000000000001';
select is((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000001'),
  current_setting('test.public_slug'),'Title edits retain the original public link');
select throws_ok($$update public.job_openings set slug='tampered-0123456789ab'
  where id='ee210000-0000-4000-8000-000000000001'$$,'P0001','IMMUTABLE_OPENING_SLUG','Assigned slugs cannot be overwritten');
select throws_ok($$update public.job_openings set slug=null
  where id='ee210000-0000-4000-8000-000000000001'$$,'P0001','IMMUTABLE_OPENING_SLUG','Assigned slugs cannot be cleared');

-- Every unavailable state must agree with the legacy UUID visibility predicate.
do $$ declare s public.opening_status; begin
  foreach s in array array['draft','pending_review','changes_requested','rejected','paused','closed','suspended','cancelled']::public.opening_status[] loop
    update public.job_openings set status=s where id='ee210000-0000-4000-8000-000000000001';
    perform set_config('test.state_'||s::text,(public.published_offer_by_slug(current_setting('test.public_slug'))->>'total'),true);
  end loop;
end $$;
select is(current_setting('test.state_'||s),'0','Slug hides state '||s)
from unnest(array['draft','pending_review','changes_requested','rejected','paused','closed','suspended','cancelled']) s;
update public.job_openings set status='published' where id='ee210000-0000-4000-8000-000000000001';
select is((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000001'),
  current_setting('test.public_slug'),'Republishing retains the original slug');
update public.job_openings set closing_date=(clock_timestamp() at time zone 'America/Buenos_Aires')::date
where id='ee210000-0000-4000-8000-000000000001';
select is((public.published_offer_by_slug(current_setting('test.public_slug'))->>'total')::integer,1,
  'Offers closing today in Argentina remain visible even in a UTC session');
update public.job_openings set closing_date=(clock_timestamp() at time zone 'America/Buenos_Aires')::date-1,published_at=current_timestamp-interval '2 days'
where id='ee210000-0000-4000-8000-000000000001';
select is((public.published_offer_by_slug(current_setting('test.public_slug'))->>'total')::integer,0,'Expired offers are hidden');
update public.job_openings set closing_date=(clock_timestamp() at time zone 'America/Buenos_Aires')::date+365,archived_at=now(),archived_by=private.fixture_id('admin',1)
where id='ee210000-0000-4000-8000-000000000001';
select is((public.published_offer_by_slug(current_setting('test.public_slug'))->>'total')::integer,0,'Archived offers are hidden');
update public.job_openings set archived_at=null,archived_by=null where id='ee210000-0000-4000-8000-000000000001';
update public.company_profiles set status='suspended' where id=private.fixture_id('business',1);
select is((public.published_offer_by_slug(current_setting('test.public_slug'))->>'total')::integer,0,'Suspended companies are hidden');
update public.company_profiles set status='active',archived_at=now(),archived_by=private.fixture_id('admin',1)
where id=private.fixture_id('business',1);
select is((public.published_offer_by_slug(current_setting('test.public_slug'))->>'total')::integer,0,'Archived companies are hidden');
update public.company_profiles set archived_at=null,archived_by=null where id=private.fixture_id('business',1);
update public.accounts set status='suspended',suspended_at=now(),suspended_by=private.fixture_id('admin',1),
  suspended_reason='Fictitious slug visibility test' where id=private.fixture_id('company',1);
select is((public.published_offer_by_slug(current_setting('test.public_slug'))->>'total')::integer,0,'Inactive company accounts are hidden');
update public.accounts set status='active',suspended_at=null,suspended_by=null,suspended_reason=null
where id=private.fixture_id('company',1);

-- Same-title allocation, and a deterministic collision without mocking public behavior.
insert into public.job_openings(id,company_id,title,status,published_at)
values ('ee210000-0000-4000-8000-000000000002',private.fixture_id('business',1),'TÉCNICO / Atención: Ñandú & Logística','paused',now()),
 ('ee210000-0000-4000-8000-000000000003',private.fixture_id('business',1),'!!!','paused',now());
select isnt((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000002'),
  current_setting('test.public_slug'),'Repeated titles receive distinct random suffixes');
select matches((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000003'),
  '^oferta-[a-f0-9]{12}$','Titles with no ASCII words have a readable fallback');
insert into public.job_openings(id,company_id,title,status,published_at)
values ('ee210000-0000-4000-8000-000000000005',private.fixture_id('business',1),
  U&'Te\0301cnico de logi\0301stica','paused',now());
select matches((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000005'),
  '^tecnico-de-logistica-[a-f0-9]{12}$','Decomposed Unicode accents normalize without an extension');
select throws_ok($$insert into public.job_openings(company_id,title,slug)
  values (private.fixture_id('business',1),'Fictitious draft','provided-0123456789ab')$$,
  'P0001','OPENING_SLUG_MANAGED','Callers cannot assign a public slug to an unpublished draft');
select is(public.published_offers(0,100,'ee210000-0000-4000-8000-000000000001')->>'page','1',
  'UUID RPC still clamps the page');
select is(public.published_offers(0,100,'ee210000-0000-4000-8000-000000000001')->>'pageSize','30',
  'UUID RPC still clamps the page size');
select is((public.published_offers(1,1,'ee210000-0000-4000-8000-000000000001')->>'total')::integer,1,
  'UUID filtering still resolves the same opening after title and state changes');
create temporary sequence slug_suffix_attempt;
create or replace function private.opening_slug_suffix() returns text language sql volatile set search_path='' as $$
  select case when nextval('pg_temp.slug_suffix_attempt')=1
    then right(current_setting('test.public_slug'),12) else 'ffffffffffff' end
$$;
insert into public.job_openings(id,company_id,title,status,published_at)
values ('ee210000-0000-4000-8000-000000000004',private.fixture_id('business',1),
  'TÉCNICO / Atención: Ñandú & Logística','paused',now());
select is((select slug from public.job_openings where id='ee210000-0000-4000-8000-000000000004'),
  'tecnico-atencion-nandu-logistica-ffffffffffff','Allocation retries a forced collision');
select is((select last_value from pg_temp.slug_suffix_attempt),2::bigint,'Collision needs exactly one retry');
create or replace function private.opening_slug_suffix() returns text language sql volatile set search_path='' as $$
  select right(current_setting('test.public_slug'),12)
$$;
select throws_ok($$insert into public.job_openings(id,company_id,title,status,published_at)
  values ('ee210000-0000-4000-8000-000000000006',private.fixture_id('business',1),
    'TÉCNICO / Atención: Ñandú & Logística','paused',now())$$,
  'P0001','OPENING_SLUG_ALLOCATION_EXHAUSTED','Persistent collisions fail safely rather than hang');
select is((select count(*) from public.job_openings where id='ee210000-0000-4000-8000-000000000006'),
  0::bigint,'Exhausted allocation leaves no partial opening');
-- Concurrency strategy contract: every allocation shares an xact-scoped lock,
-- and a real unique index is the final invariant. Live multi-session stress is separate.
select matches(pg_get_functiondef('private.assign_opening_slug()'::regprocedure),
  'pg_advisory_xact_lock','Concurrent publications serialize allocation until commit');
select ok(exists(select 1 from pg_index i join pg_attribute a on a.attrelid=i.indrelid
  and a.attnum=any(i.indkey) where i.indrelid='public.job_openings'::regclass
  and i.indisunique and i.indisvalid and i.indnkeyatts=1 and a.attname='slug'),
  'A database unique index enforces slug uniqueness');
select is((select count(*) from public.job_openings where published_at is not null and slug is null),0::bigint,
  'Historically published fixtures have slugs');
select ok(not has_function_privilege('anon','private.assign_opening_slug()','EXECUTE'), 'Anonymous cannot invoke allocation internals');
select ok(not has_function_privilege('authenticated','private.opening_slug_suffix()','EXECUTE'),'Authenticated cannot invoke random internals');
select ok(has_function_privilege('anon','public.published_offer_by_slug(text)','EXECUTE'),'Anonymous may read the public projection');
select ok(has_function_privilege('authenticated','public.published_offer_by_slug(text)','EXECUTE'),'Authenticated may read the public projection');
select ok(not has_function_privilege('service_role','public.published_offer_by_slug(text)','EXECUTE'),'No unnecessary service-role RPC grant');
select ok(not has_table_privilege('anon','public.job_openings','SELECT'),'Slug RPC does not expose the underlying table');
select * from finish();
rollback;