-- PDF final-project requirement: a non-hire report includes its reason.
-- Additive validation only: no history backfill or signature/grant changes.
-- Recovery is application rollback plus a reviewed function replacement; retain
-- every company_feedback and audit record. Never delete historical empty reasons.
create or replace function public.submit_company_feedback(p_referral uuid,
  p_reported_outcome text, p_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; r public.referrals; p public.participations;
  company public.company_profiles; feedback_id uuid;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'company' then raise exception 'FORBIDDEN'; end if;
  select * into r from public.referrals where id = p_referral and archived_at is null;
  if r.id is null then raise exception 'NOT_FOUND'; end if;
  select * into p from public.participations where id = r.participation_id and archived_at is null for update;
  select c.* into company from public.job_openings o join public.company_profiles c on c.id = o.company_id
    where o.id = p.opening_id and o.archived_at is null;
  if company.account_id <> actor.id or company.status <> 'active' or company.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  if p.status not in ('referred','company_interview','awaiting_feedback','no_company_response') then raise exception 'INVALID_TRANSITION'; end if;
  if p_reported_outcome not in ('hired','not_selected','candidate_withdrew','process_cancelled','other')
    or length(coalesce(p_message,'')) > 2000
    or (p_reported_outcome='not_selected' and coalesce(p_message,'') !~ '[^[:space:]]') then
    raise exception 'INVALID_INPUT';
  end if;
  insert into public.company_feedback(referral_id,reported_outcome,message,reported_by)
  values(r.id,p_reported_outcome,nullif(trim(p_message),''),actor.id) returning id into feedback_id;
  perform private.workflow_event('company_feedback',feedback_id,'feedback_recorded',null,'pending_admin',actor.id);
  return feedback_id;
end $$;
revoke all on function public.submit_company_feedback(uuid,text,text) from public,anon,authenticated,service_role;
grant execute on function public.submit_company_feedback(uuid,text,text) to authenticated;
