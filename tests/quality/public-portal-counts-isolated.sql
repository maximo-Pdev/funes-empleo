-- Run only in a fresh isolated PostgreSQL container, never on an application database.
-- Minimal table contracts exercise the actual public view and new migration unchanged.
\set ON_ERROR_STOP on
DO $$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $$;
create schema private;
revoke all on schema private from public,anon,authenticated,service_role;
create table public.accounts(id uuid primary key,status text);
create table public.candidate_profiles(id uuid primary key,account_id uuid unique,origin text,status text,archived_at timestamptz);
create table public.company_profiles(id uuid primary key,account_id uuid,legal_name text,status text,archived_at timestamptz);
create table public.job_categories(id uuid primary key,code text,name text,active boolean);
create table public.opening_categories(opening_id uuid,category_id uuid);
create table public.job_openings(id uuid primary key,company_id uuid,slug text,title text,tasks text,requirements text,
 vacancies integer,location text,modality text,schedule text,contract_type text,closing_date date,salary text,benefits text,
 published_at timestamptz,status text,archived_at timestamptz);
alter table public.candidate_profiles enable row level security;
alter table public.company_profiles enable row level security;
alter table public.job_openings enable row level security;
\i /work/public-offer-search.sql
\i /work/public-counts.sql
set role anon;
DO $$ begin
 if public.public_portal_counts() <> '{"candidates":0,"companies":0,"offers":0}'::jsonb then raise exception 'EMPTY_COUNTS'; end if;
 begin perform * from public.candidate_profiles; raise exception 'PRIVATE_READ_LEAK'; exception when insufficient_privilege then null; end;
 begin perform * from private.public_offer_rows; raise exception 'PRIVATE_VIEW_LEAK'; exception when insufficient_privilege then null; end;
end $$;
reset role;
insert into public.accounts values('00000000-0000-4000-8000-000000000001','active');
insert into public.company_profiles values
 ('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','Test active','active',null),
 ('00000000-0000-4000-8000-000000000012',null,null,'incomplete',null),
 ('00000000-0000-4000-8000-000000000013',null,'Test suspended','suspended',null),
 ('00000000-0000-4000-8000-000000000014',null,'Test archived','archived',null),
 ('00000000-0000-4000-8000-000000000015',null,'Test dated archive','active',now());
insert into public.candidate_profiles values
 ('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001','self_service','active',null),
 ('00000000-0000-4000-8000-000000000022',null,'assisted','draft',null),
 ('00000000-0000-4000-8000-000000000023',null,'imported','unavailable',null),
 ('00000000-0000-4000-8000-000000000024',null,'assisted','archived',null),
 ('00000000-0000-4000-8000-000000000025',null,'assisted','active',now());
insert into public.job_openings(id,company_id,status,closing_date,published_at,vacancies)
select md5('counts-offer-'||g)::uuid,'00000000-0000-4000-8000-000000000011','published',
 (clock_timestamp() at time zone 'America/Buenos_Aires')::date,now(),10 from generate_series(1,13) g;
insert into public.job_openings(id,company_id,status,closing_date,published_at)
select md5('excluded-offer-'||g)::uuid,'00000000-0000-4000-8000-000000000011',
 case g when 1 then 'draft' when 2 then 'paused' else 'published' end,
 (clock_timestamp() at time zone 'America/Buenos_Aires')::date-case when g=3 then 1 else 0 end,now()
from generate_series(1,4) g;
update public.job_openings set archived_at=now() where id=md5('excluded-offer-4')::uuid;
set timezone='Pacific/Kiritimati';
set role anon;
DO $$ begin
 if public.public_portal_counts() <> '{"candidates":3,"companies":3,"offers":13}'::jsonb then raise exception 'COUNT_RULES'; end if;
 if public.public_portal_counts()->>'offers' <> public.published_offers(1,1)->>'total' then raise exception 'PAGINATION_MISMATCH'; end if;
end $$;
reset role;
update public.candidate_profiles set account_id=gen_random_uuid() where id='00000000-0000-4000-8000-000000000022';
set role authenticated;
DO $$ begin
 if public.public_portal_counts()->>'candidates' <> '3' then raise exception 'ASSISTED_LINK_DUPLICATE'; end if;
end $$;
reset role;
update public.accounts set status='suspended';
set role anon;
DO $$ begin
 if public.public_portal_counts()->>'offers' <> '0' then raise exception 'SUSPENDED_ACCOUNT_VISIBLE'; end if;
end $$;
reset role;
update public.accounts set status='active';
update public.company_profiles set status='suspended' where id='00000000-0000-4000-8000-000000000011';
set role anon;
DO $$ begin
 if public.public_portal_counts() <> '{"candidates":3,"companies":3,"offers":0}'::jsonb then raise exception 'SUSPENDED_COMPANY_RULES'; end if;
end $$;
reset role;
set role service_role;
DO $$ begin
 begin perform public.public_portal_counts(); raise exception 'SERVICE_EXECUTE_LEAK'; exception when insufficient_privilege then null; end;
end $$;
reset role;
DO $$ begin
 if not (select prosecdef and proconfig @> array['search_path=""'] from pg_proc where oid='public.public_portal_counts()'::regprocedure) then
   raise exception 'UNSAFE_FUNCTION_CONFIGURATION'; end if;
end $$;
select 'PASS: actual migrations, empty/real totals, assisted link, archived/incomplete/suspended states, >12 offers, vacancies, timezone, private reads and execution grants' as result;
