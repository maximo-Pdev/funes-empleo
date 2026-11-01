-- EXTRA119 recovery only. Review the conflict checks and intended environment.
-- Restores the exact retired associations, not profile states or consent.
-- Never remove or rewrite the immutable backup. Run as a database administrator.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.accounts in exclusive mode;
lock table public.job_categories,public.candidate_categories,public.opening_categories in share row exclusive mode;
do $$ begin
  if not exists(select 1 from private.demo_category_retirement_backup where source_table='job_categories') then
    raise exception 'DEMO_CATEGORY_RECOVERY_EMPTY';
  end if;
  if exists(select 1 from private.demo_category_retirement_backup b
    left join public.job_categories j on j.id::text=b.record_key where b.source_table='job_categories'
    and (j.id is null or to_jsonb(j)-'active'-'updated_at' is distinct from b.row_snapshot-'active'-'updated_at'))
    or exists(select 1 from private.demo_category_retirement_backup b
      join public.candidate_categories c on b.record_key=c.candidate_id::text||':'||c.category_id::text
      where b.source_table='candidate_categories' and b.row_snapshot<>to_jsonb(c))
    or exists(select 1 from private.demo_category_retirement_backup b
      join public.opening_categories o on b.record_key=o.opening_id::text||':'||o.category_id::text
      where b.source_table='opening_categories' and b.row_snapshot<>to_jsonb(o)) then
    raise exception 'DEMO_CATEGORY_RECOVERY_CONFLICT';
  end if;
end $$;
update public.job_categories j set active=(b.row_snapshot->>'active')::boolean,
  updated_at=(b.row_snapshot->>'updated_at')::timestamptz
from private.demo_category_retirement_backup b where b.source_table='job_categories' and j.id::text=b.record_key;
insert into public.candidate_categories
select (jsonb_populate_record(null::public.candidate_categories,b.row_snapshot)).*
from private.demo_category_retirement_backup b where b.source_table='candidate_categories'
on conflict do nothing;
insert into public.opening_categories
select (jsonb_populate_record(null::public.opening_categories,b.row_snapshot)).*
from private.demo_category_retirement_backup b where b.source_table='opening_categories'
on conflict do nothing;
commit;
