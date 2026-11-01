-- EXTRA119: Mateo approved removing A/B assignments with private historical backup.
-- Recovery: docs/operations/recover-demo-categories.sql (review conflicts first).
-- Deliberately does not rewrite isolated synthetic acceptance seeds.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';

-- Workflow guards hold FOR SHARE on accounts until their command commits.
-- Wait for those commands before retiring categories; block new mutations briefly.
lock table public.accounts in exclusive mode;
lock table public.job_categories, public.candidate_categories, public.opening_categories
  in share row exclusive mode;

do $$ begin
  if exists(select 1 from public.job_categories where version=1
    and code in ('DEMO-A','DEMO-B')
    and name is distinct from case code when 'DEMO-A' then 'Categoría ficticia A' else 'Categoría ficticia B' end) then
    raise exception 'DEMO_CATEGORY_NAME_CONFLICT';
  end if;
end $$;

create table if not exists private.demo_category_retirement_backup (
  source_table text not null check(source_table in ('job_categories','candidate_categories','opening_categories')),
  record_key text not null,
  row_snapshot jsonb not null check(jsonb_typeof(row_snapshot)='object'),
  migration_version text not null default '20261101120000' check(migration_version='20261101120000'),
  captured_at timestamptz not null default clock_timestamp(),
  captured_by name not null default session_user,
  reason text not null default 'EXTRA119: retiro de categorías ficticias A/B y sus asignaciones aprobado por Mateo.',
  primary key(source_table,record_key)
);
alter table private.demo_category_retirement_backup enable row level security;
revoke all on private.demo_category_retirement_backup from public,anon,authenticated,service_role;
create or replace trigger append_only before update or delete on private.demo_category_retirement_backup
  for each row execute function private.deny_history_change();
comment on table private.demo_category_retirement_backup is
  'EXTRA119. Original catalog and association rows only; no profile/contact payloads. Private immutable recovery evidence.';

insert into private.demo_category_retirement_backup(source_table,record_key,row_snapshot)
select 'job_categories',j.id::text,to_jsonb(j) from public.job_categories j
where j.version=1 and j.code in ('DEMO-A','DEMO-B') on conflict do nothing;

insert into private.demo_category_retirement_backup(source_table,record_key,row_snapshot)
select 'candidate_categories',c.candidate_id::text||':'||c.category_id::text,to_jsonb(c)
from public.candidate_categories c join public.job_categories j on j.id=c.category_id
where j.version=1 and j.code in ('DEMO-A','DEMO-B') on conflict do nothing;

insert into private.demo_category_retirement_backup(source_table,record_key,row_snapshot)
select 'opening_categories',o.opening_id::text||':'||o.category_id::text,to_jsonb(o)
from public.opening_categories o join public.job_categories j on j.id=o.category_id
where j.version=1 and j.code in ('DEMO-A','DEMO-B') on conflict do nothing;

-- A retry must never delete a changed/reintroduced association using an older backup.
do $$ begin
  if exists(select 1 from public.candidate_categories c join public.job_categories j on j.id=c.category_id
    where j.version=1 and j.code in ('DEMO-A','DEMO-B') and not exists(
      select 1 from private.demo_category_retirement_backup b where b.source_table='candidate_categories'
      and b.record_key=c.candidate_id::text||':'||c.category_id::text and b.row_snapshot=to_jsonb(c)))
    or exists(select 1 from public.opening_categories o join public.job_categories j on j.id=o.category_id
    where j.version=1 and j.code in ('DEMO-A','DEMO-B') and not exists(
      select 1 from private.demo_category_retirement_backup b where b.source_table='opening_categories'
      and b.record_key=o.opening_id::text||':'||o.category_id::text and b.row_snapshot=to_jsonb(o))) then
    raise exception 'DEMO_CATEGORY_BACKUP_CONFLICT';
  end if;
end $$;

delete from public.candidate_categories c using public.job_categories j
where j.id=c.category_id and j.version=1 and j.code in ('DEMO-A','DEMO-B');
delete from public.opening_categories o using public.job_categories j
where j.id=o.category_id and j.version=1 and j.code in ('DEMO-A','DEMO-B');
update public.job_categories set active=false,updated_at=clock_timestamp()
where version=1 and code in ('DEMO-A','DEMO-B') and active;
commit;
