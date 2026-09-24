-- T049: request-attributed, idempotent freshness maintenance. This is not a
-- scheduled system action; only the candidate or an active administrator runs it.
create function public.refresh_candidate_freshness(p_candidate uuid default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; item public.candidate_profiles; changed integer := 0;
begin
  actor := private.require_workflow_actor();
  if actor.role not in ('candidate','admin') then raise exception 'FORBIDDEN'; end if;
  if actor.role='candidate' and (p_candidate is null or not exists(
    select 1 from public.candidate_profiles where id=p_candidate and account_id=actor.id and archived_at is null
  )) then raise exception 'NOT_FOUND'; end if;
  for item in select * from public.candidate_profiles
    where (p_candidate is null or id=p_candidate) and archived_at is null
      and status='active' and refresh_due_at <= clock_timestamp()
    for update
  loop
    update public.candidate_profiles set status='needs_update' where id=item.id;
    perform private.record_event('candidate_profiles',item.id,'freshness_due','active','needs_update',actor.id);
    changed := changed+1;
  end loop;
  return changed;
end $$;
revoke all on function public.refresh_candidate_freshness(uuid) from public,anon,authenticated,service_role;
grant execute on function public.refresh_candidate_freshness(uuid) to authenticated;
