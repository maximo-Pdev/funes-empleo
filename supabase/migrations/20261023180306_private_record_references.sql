begin;
create table private.record_references (
  kind text not null check (kind in ('account','candidate','company','opening','participation','referral','cv','import','category')),
  entity_id uuid not null, reference text not null unique,
  created_at timestamptz not null default clock_timestamp(),
  primary key(kind,entity_id),
  check(reference ~ '^(cta|can|emp|ofe|cas|der|cv|imp|rub)-[0-9a-f]{24}$')
);
alter table private.record_references enable row level security;
revoke all on private.record_references from public,anon,authenticated,service_role;
create trigger immutable_reference before update or delete on private.record_references
for each row execute function private.deny_history_change();

create function private.record_reference_entropy() returns bytea
language sql volatile set search_path='' as $$select extensions.gen_random_bytes(12)$$;
create function private.ensure_record_reference(p_kind text,p_id uuid) returns void
language plpgsql security definer set search_path='' as $$
declare prefix text; attempt integer;
begin
  prefix:=case p_kind when 'account' then 'cta' when 'candidate' then 'can' when 'company' then 'emp' when 'opening' then 'ofe' when 'participation' then 'cas' when 'referral' then 'der' when 'cv' then 'cv' when 'import' then 'imp' when 'category' then 'rub' end;
  if prefix is null or p_id is null then raise exception 'VALIDATION_ERROR'; end if;
  if exists(select 1 from private.record_references where kind=p_kind and entity_id=p_id) then return; end if;
  for attempt in 1..5 loop
    begin
      insert into private.record_references(kind,entity_id,reference)
      values(p_kind,p_id,prefix||'-'||encode(private.record_reference_entropy(),'hex'))
      on conflict(kind,entity_id) do nothing;
      return;
    exception when unique_violation then null;
    end;
  end loop;
  raise exception 'INTERNAL_ERROR';
end $$;
create function private.create_record_reference() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  perform private.ensure_record_reference(tg_argv[0],new.id);
  return new;
end $$;
create trigger record_reference after insert on public.accounts
for each row execute function private.create_record_reference('account');
create trigger record_reference after insert on public.candidate_profiles
for each row execute function private.create_record_reference('candidate');
create trigger record_reference after insert on public.company_profiles
for each row execute function private.create_record_reference('company');
create trigger record_reference after insert on public.job_openings
for each row execute function private.create_record_reference('opening');
create trigger record_reference after insert on public.participations
for each row execute function private.create_record_reference('participation');
create trigger record_reference after insert on public.referrals
for each row execute function private.create_record_reference('referral');
create trigger record_reference after insert on public.cv_documents
for each row execute function private.create_record_reference('cv');
create trigger record_reference after insert on public.import_batches
for each row execute function private.create_record_reference('import');
create trigger record_reference after insert on public.job_categories
for each row execute function private.create_record_reference('category');

do $backfill$
declare item record;
begin
  for item in select 'account'::text as kind,id from public.accounts union all select 'candidate'::text as kind,id from public.candidate_profiles union all select 'company'::text as kind,id from public.company_profiles union all select 'opening'::text as kind,id from public.job_openings union all select 'participation'::text as kind,id from public.participations union all select 'referral'::text as kind,id from public.referrals union all select 'cv'::text as kind,id from public.cv_documents union all select 'import'::text as kind,id from public.import_batches union all select 'category'::text as kind,id from public.job_categories loop
    perform private.ensure_record_reference(item.kind,item.id);
  end loop;
end $backfill$;

create function private.can_reference_record(p_kind text,p_id uuid,p_actor public.accounts) returns boolean
language sql stable security definer set search_path='' as $$
 select case p_kind
 when 'account' then exists(select 1 from public.accounts item where item.id=p_id and ((p_actor).role='admin' or item.id=(p_actor).id))
 when 'candidate' then exists(select 1 from public.candidate_profiles item where item.id=p_id and ((p_actor).role='admin' or item.account_id=(p_actor).id))
 when 'company' then exists(select 1 from public.company_profiles item where item.id=p_id and ((p_actor).role='admin' or item.account_id=(p_actor).id))
 when 'opening' then exists(select 1 from public.job_openings item join public.company_profiles company on company.id=item.company_id where item.id=p_id and ((p_actor).role='admin' or company.account_id=(p_actor).id))
 when 'participation' then exists(select 1 from public.participations item join public.candidate_profiles candidate on candidate.id=item.candidate_id where item.id=p_id and ((p_actor).role='admin' or candidate.account_id=(p_actor).id))
 when 'referral' then exists(select 1 from public.referrals item join public.participations participation on participation.id=item.participation_id join public.job_openings opening on opening.id=participation.opening_id join public.company_profiles company on company.id=opening.company_id where item.id=p_id and ((p_actor).role='admin' or ((p_actor).role='company' and company.account_id=(p_actor).id and company.status='active' and company.archived_at is null and item.archived_at is null)))
 when 'cv' then exists(select 1 from public.cv_documents item where item.id=p_id and private.can_read_cv(item.id))
 when 'import' then (p_actor).role='admin' and exists(select 1 from public.import_batches item where item.id=p_id)
 when 'category' then exists(select 1 from public.job_categories item where item.id=p_id and ((p_actor).role='admin' or item.active))
 else false end
$$;
create function public.get_record_references(p_kind text,p_ids uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb;
begin
  actor:=private.require_workflow_actor();
  if p_kind not in ('account','candidate','company','opening','participation','referral','cv','import','category') or p_kind is null or p_ids is null or cardinality(p_ids)>1000 then raise exception 'VALIDATION_ERROR'; end if;
  select coalesce(jsonb_object_agg(entity_id::text,reference),'{}'::jsonb) into result
  from private.record_references item where item.kind=p_kind and item.entity_id=any(p_ids)
    and private.can_reference_record(item.kind,item.entity_id,actor);
  return result;
end $$;
create function public.resolve_record_reference(p_kind text,p_reference text) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result uuid;
begin
  actor:=private.require_workflow_actor();
  if p_reference is null or length(p_reference)>40 then return null; end if;
  select entity_id into result from private.record_references item
    where item.kind=p_kind and item.reference=p_reference
    and private.can_reference_record(item.kind,item.entity_id,actor);
  return result;
end $$;
revoke all on function private.record_reference_entropy(),private.ensure_record_reference(text,uuid),private.create_record_reference(),
 private.can_reference_record(text,uuid,public.accounts) from public,anon,authenticated,service_role;
revoke all on function public.get_record_references(text,uuid[]),public.resolve_record_reference(text,text)
 from public,anon,authenticated,service_role;
grant execute on function public.get_record_references(text,uuid[]),public.resolve_record_reference(text,text) to authenticated;
notify pgrst,'reload schema';
commit;
