begin;

-- EXTRA094: forward-only; preserve all prior consent and access history.
create or replace function public.transition_participation(p_participation uuid, p_expected_version integer,
  p_command text, p_reason text default null, p_candidate_request uuid default null,
  p_feedback uuid default null, p_contact uuid default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; part public.participations; cand public.candidate_profiles;
  opening public.job_openings; company public.company_profiles; company_account public.accounts;
  candidate_account public.accounts; referral public.referrals; consent public.candidate_consents;
  cv public.cv_documents; next_state public.participation_status; action text;
  old_rank integer; new_rank integer; decision_id uuid; evidence_ok boolean := false;
  contact public.contact_events; feedback public.company_feedback; now_at timestamptz := clock_timestamp();
  revoke_reason text; hiring_decision uuid; access_still_valid boolean;
begin
  actor := private.require_workflow_actor();
  if actor.role not in ('admin','candidate') then raise exception 'NOT_FOUND'; end if;
  select candidate.* into cand from public.candidate_profiles candidate
    join public.participations participation on participation.candidate_id=candidate.id
    where participation.id=p_participation for update of candidate;
  select * into part from public.participations where id = p_participation for update;
  if part.id is null or part.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  if actor.role = 'candidate' then
    if p_command <> 'withdraw' or not exists(select 1 from public.candidate_profiles where id = part.candidate_id and account_id = actor.id and archived_at is null) then raise exception 'NOT_FOUND'; end if;
  elsif actor.role <> 'admin' then raise exception 'NOT_FOUND'; end if;
  if part.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  select * into referral from public.referrals where participation_id = part.id for update;
  select * into opening from public.job_openings where id = part.opening_id for share;
  select * into company from public.company_profiles where id = opening.company_id for share;
  select * into company_account from public.accounts where id = company.account_id for share;
  if cand.account_id is not null then select * into candidate_account from public.accounts where id = cand.account_id for share; end if;
  select * into consent from public.candidate_consents where candidate_id = cand.id order by recorded_at desc,id desc limit 1;
  now_at := clock_timestamp();
  if p_command in ('review','preinterview','preselect','refer') then
    old_rank := case part.status when 'received' then 0 when 'under_review' then 1 when 'preinterview' then 2 when 'preselected' then 3 else -1 end;
    new_rank := case p_command when 'review' then 1 when 'preinterview' then 2 when 'preselect' then 3 else 4 end;
    if old_rank < 0 or old_rank >= new_rank then raise exception 'INVALID_TRANSITION'; end if;
    if new_rank - old_rank > 1 then
      decision_id := private.workflow_reason('participations',part.id,'stage_skip',p_reason,actor.id);
    end if;
    next_state := case p_command when 'review' then 'under_review'::public.participation_status
      when 'preinterview' then 'preinterview'::public.participation_status
      when 'preselect' then 'preselected'::public.participation_status else 'referred'::public.participation_status end;
    action := case when decision_id is not null then 'stage_skipped' else 'participation_advanced' end;
    if p_command = 'refer' then
      if cand.status <> 'active' or cand.archived_at is not null or cand.availability <> 'available'
        or cand.refresh_due_at is null or cand.refresh_due_at <= now_at
        or (cand.account_id is not null and candidate_account.status <> 'active')
        or company.status <> 'active' or company.archived_at is not null or company_account.status <> 'active'
        or opening.archived_at is not null or opening.status not in ('published','paused','closed')
      then raise exception 'INVALID_TRANSITION'; end if;
      if consent.id is null or consent.status <> 'accepted' then raise exception 'CONSENT_REQUIRED'; end if;
      select * into cv from public.cv_documents where candidate_id = cand.id and status = 'valid' and archived_at is null limit 1;
      if cv.id is null then raise exception 'VALID_CV_REQUIRED'; end if;
      if referral.id is not null then raise exception 'INVALID_TRANSITION'; end if;
      insert into public.referrals(participation_id,candidate_id,referred_by,referred_at,access_status,
        consent_event_id,cv_document_id,feedback_due_at,access_changed_at,
        access_changed_actor_type,access_changed_by_account_id,access_change_reason)
      values(part.id,cand.id,actor.id,now_at,'active',consent.id,cv.id,now_at + interval '720 hours',
        now_at,'account',actor.id,'referral_created') returning * into referral;
      perform private.workflow_event('referrals',referral.id,'referral_created',null,'active',actor.id,
        case when decision_id is not null then 'stage_omitted' end,decision_id);
    end if;
  elsif p_command in ('interview','await_feedback') then
    if (p_command = 'interview' and part.status not in ('referred','awaiting_feedback'))
      or (p_command = 'await_feedback' and part.status not in ('referred','company_interview')) then raise exception 'INVALID_TRANSITION'; end if;
    next_state := case when p_command = 'interview' then 'company_interview' else 'awaiting_feedback' end;
    action := 'participation_advanced';
  elsif p_command in ('hire','not_select','late_hire','late_not_selected','late_cancel') then
    if p_command like 'late_%' then
      if part.status <> 'no_company_response' then raise exception 'INVALID_TRANSITION'; end if;
      decision_id := private.workflow_reason('participations',part.id,'late_outcome',p_reason,actor.id);
    elsif part.status not in ('referred','company_interview','awaiting_feedback') then raise exception 'INVALID_TRANSITION'; end if;
    if p_feedback is not null then
      select * into feedback from public.company_feedback where id = p_feedback and referral_id = referral.id for update;
      if feedback.id is not null and ((p_command in ('hire','late_hire') and feedback.reported_outcome = 'hired')
        or (p_command in ('not_select','late_not_selected') and feedback.reported_outcome = 'not_selected')
        or (p_command = 'late_cancel' and feedback.reported_outcome = 'process_cancelled')) then evidence_ok := true; end if;
    end if;
    if p_contact is not null then
      select * into contact from public.contact_events where id = p_contact and participation_id = part.id
        and channel in ('phone','email','whatsapp','in_person') and occurred_at <= now_at
        and length(trim(summary_internal)) > 0 for share;
      if contact.id is not null then evidence_ok := true; end if;
    end if;
    if not evidence_ok and (p_command like 'late_%' or nullif(trim(coalesce(p_reason,'')),'') is null) then raise exception 'INVALID_INPUT'; end if;
    if decision_id is null and nullif(trim(coalesce(p_reason,'')),'') is not null then
      decision_id := private.workflow_reason('participations',part.id,'outcome',p_reason,actor.id);
    end if;
    next_state := case when p_command in ('hire','late_hire') then 'hired'::public.participation_status
      when p_command in ('not_select','late_not_selected') then 'not_selected'::public.participation_status
      else 'cancelled'::public.participation_status end;
    action := case when p_command like 'late_%' then 'outcome_corrected' else 'outcome_confirmed' end;
    if feedback.id is not null and evidence_ok then update public.company_feedback set review_status = 'accepted' where id = feedback.id; end if;
  elsif p_command = 'withdraw' then
    if part.status in ('hired','not_selected','withdrawn','cancelled','no_company_response') then raise exception 'INVALID_TRANSITION'; end if;
    if actor.role = 'admin' then
      select * into contact from public.contact_events where id = p_candidate_request
        and participation_id = part.id and direction = 'inbound' and occurred_at <= now_at
        and length(trim(summary_internal)) > 0 for share;
      if contact.id is null then raise exception 'INVALID_INPUT'; end if;
    end if;
    next_state := 'withdrawn'; action := 'outcome_confirmed'; revoke_reason := 'application_withdrawn';
  elsif p_command = 'cancel' then
    if part.status in ('hired','not_selected','withdrawn','cancelled','no_company_response') then raise exception 'INVALID_TRANSITION'; end if;
    if p_feedback is not null then
      select * into feedback from public.company_feedback where id = p_feedback and referral_id = referral.id for update;
      if feedback.id is null or feedback.reported_outcome <> 'process_cancelled' then raise exception 'INVALID_INPUT'; end if;
      update public.company_feedback set review_status = 'accepted' where id = feedback.id;
    end if;
    decision_id := private.workflow_reason('participations',part.id,'individual_cancel',p_reason,actor.id);
    next_state := 'cancelled'; action := 'outcome_confirmed'; revoke_reason := 'process_cancelled';
  else raise exception 'INVALID_INPUT'; end if;
  update public.participations set status = next_state,
    feedback_due_at = case when p_command = 'refer' then referral.feedback_due_at else feedback_due_at end,
    final_outcome_at = case when next_state in ('hired','not_selected','withdrawn','cancelled') then now_at else final_outcome_at end,
    final_outcome_by = case when next_state in ('hired','not_selected','withdrawn','cancelled') then actor.id else final_outcome_by end,
    withdrawal_reason = case when next_state = 'withdrawn' then nullif(trim(coalesce(p_reason,'')),'') else withdrawal_reason end
  where id = part.id;
  if next_state = 'hired' then
    -- Availability and outcome commit together; consent remains the person's decision.
    if cand.availability is distinct from 'unavailable' or cand.status = 'active' then
      hiring_decision := private.workflow_reason('participations',part.id,'hiring_availability',
        'Disponibilidad cambiada a no disponible por contratación confirmada.',actor.id);
      update public.candidate_profiles set availability='unavailable',
        status=case when status='active' then 'unavailable'::public.candidate_status else status end
        where id=cand.id;
      perform private.workflow_event('candidate_profiles',cand.id,'availability_changed',cand.status::text,
        case when cand.status='active' then 'unavailable' else cand.status::text end,
        actor.id,'hired',hiring_decision);
    end if;
    -- A terminal revocation is never restored, including late outcomes.
    access_still_valid := referral.id is not null and referral.access_status = 'active'
      and consent.status = 'accepted' and cand.archived_at is null
      and cand.status not in ('archived','consent_withdrawn')
      and (cand.account_id is null or candidate_account.status = 'active')
      and company.archived_at is null and company.status = 'active' and company_account.status = 'active'
      and opening.archived_at is null and opening.status not in ('suspended','cancelled');
    if access_still_valid then
      update public.referrals set post_hire_access_until=now_at + interval '720 hours' where id=referral.id;
    end if;
  elsif next_state in ('not_selected','withdrawn','cancelled') then
    perform private.revoke_workflow_referral(part.id,actor.id,
      coalesce(revoke_reason,case when next_state = 'not_selected' then 'not_selected' else 'process_cancelled' end),decision_id);
  end if;
  perform private.workflow_event('participations',part.id,action,part.status::text,next_state::text,
    actor.id,case when p_command like 'late_%' then 'late_response'
      when decision_id is not null then 'decision_recorded'
      when next_state = 'withdrawn' then 'candidate_request' end,decision_id);
  return part.version + 1;
end $$;

revoke all on function public.transition_participation(uuid,integer,text,text,uuid,uuid,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.transition_participation(uuid,integer,text,text,uuid,uuid,uuid) to authenticated;

notify pgrst, 'reload schema';
commit;
