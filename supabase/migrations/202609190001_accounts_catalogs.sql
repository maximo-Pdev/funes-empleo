-- T010. Forward-only; local recovery: rebuild isolated database from migrations + fictional seed.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create type public.account_role as enum ('candidate','company','admin');
create type public.account_status as enum ('pending_verification','active','suspended','archived');
create type public.candidate_status as enum ('draft','active','needs_update','unavailable','consent_withdrawn','archived');
create type public.company_status as enum ('incomplete','active','suspended','archived');
create type public.opening_status as enum ('draft','pending_review','changes_requested','published','paused','closed','rejected','cancelled','suspended');
create type public.participation_status as enum ('received','under_review','preinterview','preselected','referred','company_interview','awaiting_feedback','hired','not_selected','withdrawn','cancelled','no_company_response');
create type public.referral_access_status as enum ('active','revoked','expired_by_policy');
create type public.cv_status as enum ('valid','superseded','rejected','archived');
create type public.consent_status as enum ('accepted','withdrawn');
create type public.import_status as enum ('uploaded','preview_ready','blocked','confirming','completed','failed','archived');
create type public.import_row_status as enum ('valid','warning','invalid','potential_duplicate','unmapped_category','imported');
create table public.accounts (
 id uuid primary key default gen_random_uuid(),
 auth_user_id uuid not null unique references auth.users(id) on delete restrict,
 role public.account_role not null,
 status public.account_status not null default 'pending_verification',
 suspended_reason text check(length(suspended_reason) between 1 and 500),
 suspended_at timestamptz, suspended_by uuid references public.accounts(id) on delete restrict,
 archived_at timestamptz, archived_by uuid references public.accounts(id) on delete restrict,
 archive_reason text check(length(archive_reason) between 1 and 500),
 last_sign_in_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0),
 check ((status='suspended')=(suspended_at is not null and suspended_by is not null and suspended_reason is not null)),
 check ((suspended_at is null)=(suspended_by is null) and (suspended_at is null)=(suspended_reason is null)),
 check ((status='archived')=(archived_at is not null and archived_by is not null)),
 check ((archived_at is null)=(archived_by is null)),
 check(role <> 'admin' or status <> 'archived')
);
create table public.job_categories (
 id uuid primary key default gen_random_uuid(), code text not null check(length(code) between 1 and 50),
 name text not null check(length(name) between 1 and 150), description text check(length(description)<=1000),
 version integer not null check(version>0), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(version,code), unique(version,name)
);
