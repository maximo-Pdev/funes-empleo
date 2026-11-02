-- EXTRA-121: candidate self-service records affirmative acceptance only.
-- No backfill: historical withdrawals, append-only history and all operational
-- eligibility/company-read gates remain unchanged. Account archival stays admin-only.
-- Recovery: restore the prior function body from 202609190019_candidate_self_service.sql
-- in a reviewed forward migration; never delete consent or audit rows.
create or replace function public.change_candidate_consent(p_expected_version integer, p_status text,
  p_policy_version text, p_policy_hash text) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; policy private.consent_policies;
  previous public.candidate_consents; next_status public.candidate_status;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null for update;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_status is distinct from 'accepted' then raise exception 'INVALID_INPUT'; end if;
  select * into policy from private.consent_policies where version=p_policy_version;
  if policy.version is null or policy.policy_hash is distinct from p_policy_hash then raise exception 'INVALID_INPUT'; end if;
  select * into previous from public.candidate_consents where candidate_id=candidate.id order by recorded_at desc,id desc limit 1;
  if previous.status='accepted' then raise exception 'INVALID_TRANSITION'; end if;
  insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
    values(candidate.id,policy.version,policy.policy_hash,'accepted',actor.id,'self_service');
  next_status := case when candidate.status='consent_withdrawn' then 'draft'::public.candidate_status else candidate.status end;
  update public.candidate_profiles set status=next_status where id=candidate.id;
  perform private.record_event('candidate_profiles',candidate.id,'consent_accepted',
    candidate.status::text,next_status::text,actor.id);
  return candidate.version+1;
end $$;

-- Keep the existing signature and explicitly retain its least-privilege grants.
revoke all on function public.change_candidate_consent(integer,text,text,text) from public,anon;
grant execute on function public.change_candidate_consent(integer,text,text,text) to authenticated;
