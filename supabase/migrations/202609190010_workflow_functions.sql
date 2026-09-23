-- US1/T027. Forward-only. Recovery in a fictional local/demo database: apply a
-- corrective migration or rebuild from versioned migrations and fictional seed.
-- Human reasons remain private; public audit metadata contains only an opaque ID.
create table private.workflow_decisions (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  command text not null,
  reason text not null check (length(trim(reason)) between 1 and 1000),
  actor_account_id uuid not null references public.accounts(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);
revoke all on private.workflow_decisions from public, anon, authenticated, service_role;
create trigger workflow_decision_append_only before update or delete on private.workflow_decisions
  for each row execute function private.deny_history_change();

create function private.require_workflow_actor() returns public.accounts
language plpgsql security definer set search_path = '' as $$
declare a public.accounts;
begin
  perform 1 from auth.sessions s where s.user_id = auth.uid()
    and s.id::text = auth.jwt()->>'session_id'
    and (s.not_after is null or s.not_after > clock_timestamp()) for share;
  if not found then raise exception 'AUTH_REQUIRED'; end if;
  select * into a from public.accounts where auth_user_id = auth.uid() for share;
  if a.id is null or a.status <> 'active' then raise exception 'AUTH_REQUIRED'; end if;
  return a;
end $$;

create function private.workflow_reason(p_type text, p_id uuid, p_command text, p_reason text, p_actor uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare decision_id uuid;
begin
  if p_reason is null or length(trim(p_reason)) not between 1 and 1000 then raise exception 'INVALID_INPUT'; end if;
  insert into private.workflow_decisions(entity_type, entity_id, command, reason, actor_account_id)
  values (p_type, p_id, p_command, trim(p_reason), p_actor) returning id into decision_id;
  return decision_id;
end $$;

create function private.workflow_event(p_type text, p_id uuid, p_action text, p_before text, p_after text,
  p_actor uuid, p_reason_code text default null, p_decision uuid default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_events(entity_type, entity_id, action, previous_state, new_state,
    actor_type, actor_account_id, reason_code, metadata_safe)
  values (p_type, p_id, p_action, p_before, p_after,
    case when p_actor is null then 'system' else 'account' end, p_actor, p_reason_code,
    case when p_decision is null then '{}'::jsonb else jsonb_build_object('decision_id', p_decision) end);
end $$;

create function private.revoke_workflow_referral(p_participation uuid, p_actor uuid, p_reason text,
  p_decision uuid default null) returns boolean language plpgsql security definer set search_path = '' as $$
declare referral_id uuid;
begin
  update public.referrals set access_status = 'revoked', access_changed_at = clock_timestamp(),
    access_changed_actor_type = case when p_actor is null then 'system' else 'account' end,
    access_changed_by_account_id = p_actor, access_change_reason = p_reason
  where participation_id = p_participation and access_status = 'active'
  returning id into referral_id;
  if referral_id is null then return false; end if;
  perform private.workflow_event('referrals', referral_id,
    case when p_actor is null then 'no_company_response' else 'referral_revoked' end,
    'active', 'revoked',
    p_actor, p_reason, p_decision);
  return true;
end $$;

create function public.transition_opening(p_opening uuid, p_expected_version integer, p_command text,
  p_reason text default null, p_company_message text default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; opening public.job_openings; company public.company_profiles;
  company_account public.accounts; next_state public.opening_status; decision text; action text;
  decision_id uuid; previous public.opening_status; item public.participations;
  complete boolean; deadline timestamptz; must_reason boolean;
begin
  actor := private.require_workflow_actor();
  select * into opening from public.job_openings where id = p_opening for update;
  if opening.id is null or opening.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  select * into company from public.company_profiles where id = opening.company_id for share;
  select * into company_account from public.accounts where id = company.account_id for share;
  if actor.role <> 'admin' and (actor.role <> 'company' or actor.id <> company.account_id) then raise exception 'NOT_FOUND'; end if;
  if opening.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_command = 'submit' then
    if actor.role <> 'company' then raise exception 'FORBIDDEN'; end if;
  elsif actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_command not in ('submit','approve','request_changes','reject','pause','resume','close','suspend','restore_to_draft','cancel') then raise exception 'INVALID_INPUT'; end if;
  must_reason := p_command in ('reject','pause','close','suspend','restore_to_draft','cancel');
  if must_reason and (p_reason is null or length(trim(p_reason)) not between 1 and 1000) then raise exception 'INVALID_INPUT'; end if;
  if p_command in ('request_changes','reject') and (p_company_message is null or length(trim(p_company_message)) not between 1 and 2000) then raise exception 'INVALID_INPUT'; end if;
  if p_command not in ('request_changes','reject') and nullif(trim(coalesce(p_company_message,'')),'') is not null then raise exception 'INVALID_INPUT'; end if;
  complete := opening.title is not null and opening.tasks is not null and opening.requirements is not null
    and opening.vacancies is not null and opening.location is not null and opening.modality is not null
    and opening.schedule is not null and opening.contract_type is not null and opening.closing_date is not null
    and exists (select 1 from public.opening_categories oc join public.job_categories jc on jc.id = oc.category_id
      where oc.opening_id = opening.id and jc.active);
  deadline := ((opening.closing_date + 1)::timestamp at time zone 'America/Buenos_Aires');
  previous := opening.status;
  case p_command
    when 'submit' then
      if opening.status not in ('draft','changes_requested') then raise exception 'INVALID_TRANSITION'; end if;
      if company.status <> 'active' or company_account.status <> 'active' or not complete or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'pending_review'; decision := 'submitted'; action := 'opening_submitted';
    when 'approve' then
      if opening.status <> 'pending_review' or company.status <> 'active' or company_account.status <> 'active' or not complete or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'published'; decision := 'approved'; action := 'opening_approved';
    when 'request_changes' then
      if opening.status <> 'pending_review' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'changes_requested'; decision := 'changes_requested'; action := 'opening_changes_requested';
    when 'reject' then
      if opening.status <> 'pending_review' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'rejected'; decision := 'rejected'; action := 'opening_rejected';
    when 'pause' then
      if opening.status <> 'published' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'paused'; decision := 'paused'; action := 'opening_paused';
    when 'resume' then
      if opening.status <> 'paused' or company.status <> 'active' or company_account.status <> 'active' or not complete or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'published'; decision := 'resumed'; action := 'opening_resumed';
    when 'close' then
      if opening.status not in ('published','paused') then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'closed'; decision := 'closed'; action := 'opening_closed';
    when 'suspend' then
      if opening.status in ('closed','rejected','cancelled','suspended') then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'suspended'; decision := 'suspended'; action := 'opening_suspended';
    when 'restore_to_draft' then
      if opening.status <> 'suspended' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'draft'; decision := 'restored_to_draft'; action := 'opening_restored';
    when 'cancel' then
      if opening.status in ('closed','rejected','cancelled') then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'cancelled'; decision := 'cancelled'; action := 'opening_cancelled';
  end case;
  if nullif(trim(coalesce(p_reason,'')),'') is not null then
    decision_id := private.workflow_reason('job_openings', opening.id, p_command, p_reason, actor.id);
  end if;
  update public.job_openings set status = next_state,
    moderation_message_public = case when p_command in ('request_changes','reject') then trim(p_company_message) end,
    published_at = case when p_command = 'approve' then clock_timestamp() else published_at end,
    closed_at = case when p_command in ('close','cancel') then clock_timestamp() else closed_at end
  where id = opening.id;
  insert into public.opening_moderation_events(opening_id,decision,previous_status,new_status,
    company_message,internal_reason,actor_type,actor_account_id)
  values (opening.id,decision,previous,next_state,
    case when p_command in ('request_changes','reject') then trim(p_company_message) end,
    nullif(trim(coalesce(p_reason,'')),''),'account',actor.id);
  perform private.workflow_event('job_openings',opening.id,action,previous::text,next_state::text,
    actor.id,case when decision_id is not null then 'decision_recorded' end,decision_id);
  if p_command = 'cancel' then
    for item in select * from public.participations where opening_id = opening.id
      and archived_at is null and status not in ('hired','not_selected','withdrawn','cancelled','no_company_response') for update
    loop
      update public.participations set status = 'cancelled', final_outcome_at = clock_timestamp(),
        final_outcome_by = actor.id where id = item.id;
      perform private.revoke_workflow_referral(item.id,actor.id,'process_cancelled',decision_id);
      perform private.workflow_event('participations',item.id,'outcome_confirmed',item.status::text,'cancelled',actor.id,'opening_cancelled',decision_id);
    end loop;
  end if;
  return opening.version + 1;
end $$;

create function public.transition_participation(p_participation uuid, p_expected_version integer,
  p_command text, p_reason text default null, p_candidate_request uuid default null,
  p_feedback uuid default null, p_contact uuid default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; part public.participations; cand public.candidate_profiles;
  opening public.job_openings; company public.company_profiles; company_account public.accounts;
  candidate_account public.accounts; referral public.referrals; consent public.candidate_consents;
  cv public.cv_documents; next_state public.participation_status; action text;
  old_rank integer; new_rank integer; decision_id uuid; evidence_ok boolean := false;
  contact public.contact_events; feedback public.company_feedback; now_at timestamptz := clock_timestamp();
  revoke_reason text; access_still_valid boolean;
begin
  actor := private.require_workflow_actor();
  select * into part from public.participations where id = p_participation for update;
  if part.id is null or part.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  if actor.role = 'candidate' then
    if p_command <> 'withdraw' or not exists(select 1 from public.candidate_profiles where id = part.candidate_id and account_id = actor.id and archived_at is null) then raise exception 'NOT_FOUND'; end if;
  elsif actor.role <> 'admin' then raise exception 'NOT_FOUND'; end if;
  if part.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  select * into referral from public.referrals where participation_id = part.id for update;
  select * into cand from public.candidate_profiles where id = part.candidate_id for share;
  select * into opening from public.job_openings where id = part.opening_id for share;
  select * into company from public.company_profiles where id = opening.company_id for share;
  select * into company_account from public.accounts where id = company.account_id for share;
  if cand.account_id is not null then select * into candidate_account from public.accounts where id = cand.account_id for share; end if;
  select * into consent from public.candidate_consents where candidate_id = cand.id order by recorded_at desc,id desc limit 1;
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
  if next_state = 'hired' and referral.id is not null then
    access_still_valid := referral.access_status = 'active' and consent.status = 'accepted'
      and cand.archived_at is null and cand.status not in ('archived','consent_withdrawn')
      and (cand.account_id is null or candidate_account.status = 'active')
      and company.archived_at is null and company.status = 'active' and company_account.status = 'active'
      and opening.archived_at is null and opening.status not in ('suspended','cancelled');
    if access_still_valid then update public.referrals set post_hire_access_until = now_at + interval '720 hours' where id = referral.id; end if;
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

revoke all on function private.require_workflow_actor(),
  private.workflow_reason(text,uuid,text,text,uuid),
  private.workflow_event(text,uuid,text,text,text,uuid,text,uuid),
  private.revoke_workflow_referral(uuid,uuid,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.transition_opening(uuid,integer,text,text,text),
  public.transition_participation(uuid,integer,text,text,uuid,uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.transition_opening(uuid,integer,text,text,text),
  public.transition_participation(uuid,integer,text,text,uuid,uuid,uuid) to authenticated;

-- Entry and evaluation commands consumed by the separately owned US1 services.
-- All derive actor from the live session and use the same optimistic version rule.
create function public.create_participation(p_candidate uuid, p_candidate_version integer,
  p_opening uuid, p_opening_version integer, p_origin text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; opening public.job_openings;
  company public.company_profiles; company_account public.accounts;
  candidate_account public.accounts; consent public.candidate_consents;
  new_id uuid; next_status public.participation_status; deadline timestamptz;
begin
  actor := private.require_workflow_actor();
  select * into candidate from public.candidate_profiles where id = p_candidate for share;
  select * into opening from public.job_openings where id = p_opening for share;
  if candidate.id is null or opening.id is null or candidate.archived_at is not null
    or opening.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_candidate_version or opening.version is distinct from p_opening_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if (p_origin = 'self_application' and (actor.role <> 'candidate' or candidate.account_id <> actor.id))
    or (p_origin = 'admin_nomination' and actor.role <> 'admin')
    or p_origin not in ('self_application','admin_nomination') then raise exception 'NOT_FOUND'; end if;
  select * into company from public.company_profiles where id = opening.company_id for share;
  select * into company_account from public.accounts where id = company.account_id for share;
  if candidate.account_id is not null then
    select * into candidate_account from public.accounts where id = candidate.account_id for share;
  end if;
  select * into consent from public.candidate_consents where candidate_id = candidate.id order by recorded_at desc,id desc limit 1;
  if candidate.status <> 'active' or candidate.availability <> 'available' or candidate.refresh_due_at <= clock_timestamp()
    or candidate.refresh_due_at is null or consent.status is distinct from 'accepted'
    or (candidate.account_id is not null and candidate_account.status <> 'active')
    or company.status <> 'active' or company_account.status <> 'active' then raise exception 'INVALID_TRANSITION'; end if;
  deadline := ((opening.closing_date + 1)::timestamp at time zone 'America/Buenos_Aires');
  if p_origin = 'self_application' then
    if opening.status <> 'published' or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
    if not exists(select 1 from public.cv_documents where candidate_id = candidate.id and status = 'valid' and archived_at is null) then raise exception 'VALID_CV_REQUIRED'; end if;
    next_status := 'received';
  else
    if opening.status not in ('published','paused') or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
    next_status := 'under_review';
  end if;
  if exists(select 1 from public.participations where candidate_id = candidate.id and opening_id = opening.id and archived_at is null) then raise exception 'INVALID_TRANSITION'; end if;
  insert into public.participations(candidate_id,opening_id,origin,created_by,status)
  values(candidate.id,opening.id,p_origin,actor.id,next_status) returning id into new_id;
  perform private.workflow_event('participations',new_id,'participation_created',null,next_status::text,actor.id);
  return new_id;
end $$;

create function public.record_preinterview(p_participation uuid, p_expected_version integer,
  p_channel text, p_scheduled_at timestamptz, p_held_at timestamptz,
  p_summary text, p_recommendation text, p_skip_reason text default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; part public.participations; next_state public.participation_status;
  note_id uuid; decision_id uuid;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  select * into part from public.participations where id = p_participation and archived_at is null for update;
  if part.id is null then raise exception 'NOT_FOUND'; end if;
  if part.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if part.status in ('hired','not_selected','withdrawn','cancelled','no_company_response') then raise exception 'INVALID_TRANSITION'; end if;
  if p_channel not in ('phone','email','whatsapp','in_person','video')
    or p_recommendation not in ('pending','preselect','do_not_preselect')
    or p_summary is null or length(trim(p_summary)) not between 1 and 5000
    or (p_scheduled_at is null and p_held_at is null) then raise exception 'INVALID_INPUT'; end if;
  if part.status = 'received' then
    decision_id := private.workflow_reason('participations',part.id,'stage_skip',p_skip_reason,actor.id);
  end if;
  next_state := case when part.status in ('received','under_review') then 'preinterview'::public.participation_status else part.status end;
  insert into public.preinterviews(participation_id,scheduled_at,held_at,channel,summary_internal,recommendation,recorded_by)
  values(part.id,p_scheduled_at,p_held_at,p_channel,trim(p_summary),p_recommendation,actor.id) returning id into note_id;
  update public.participations set status = next_state where id = part.id;
  perform private.workflow_event('preinterviews',note_id,'preinterview_recorded',null,p_recommendation,actor.id);
  if next_state <> part.status then
    perform private.workflow_event('participations',part.id,
      case when decision_id is null then 'participation_advanced' else 'stage_skipped' end,
      part.status::text,next_state::text,actor.id,
      case when decision_id is null then null else 'stage_omitted' end,decision_id);
  end if;
  return part.version + 1;
end $$;

create function public.record_contact(p_participation uuid, p_expected_version integer,
  p_channel text, p_direction text, p_occurred_at timestamptz,
  p_summary text, p_next_action_at timestamptz default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; part public.participations; contact_id uuid;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  select * into part from public.participations where id = p_participation and archived_at is null for update;
  if part.id is null then raise exception 'NOT_FOUND'; end if;
  if part.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_channel not in ('phone','email','whatsapp','in_person') or p_direction not in ('inbound','outbound')
    or p_occurred_at is null or p_occurred_at > clock_timestamp()
    or p_summary is null or length(trim(p_summary)) not between 1 and 5000 then raise exception 'INVALID_INPUT'; end if;
  insert into public.contact_events(candidate_id,opening_id,participation_id,channel,direction,
    occurred_at,summary_internal,next_action_at,recorded_by)
  values(part.candidate_id,part.opening_id,part.id,p_channel,p_direction,p_occurred_at,
    trim(p_summary),p_next_action_at,actor.id) returning id into contact_id;
  update public.participations set updated_at = clock_timestamp() where id = part.id;
  perform private.workflow_event('contact_events',contact_id,'contact_recorded',null,null,actor.id);
  return part.version + 1;
end $$;

create function public.record_internal_note(p_candidate uuid, p_expected_version integer,
  p_participation uuid, p_kind text, p_body text, p_supersedes uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; note_id uuid;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where id = p_candidate and archived_at is null for update;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_kind not in ('applicant','training_guidance') or p_body is null or length(trim(p_body)) not between 1 and 5000 then raise exception 'INVALID_INPUT'; end if;
  if p_participation is not null and not exists(select 1 from public.participations where id = p_participation and candidate_id = candidate.id) then raise exception 'NOT_FOUND'; end if;
  if p_supersedes is not null and not exists(select 1 from public.internal_notes where id = p_supersedes and candidate_id = candidate.id) then raise exception 'NOT_FOUND'; end if;
  insert into public.internal_notes(candidate_id,participation_id,note_kind,body,created_by,supersedes_note_id)
  values(candidate.id,p_participation,p_kind,trim(p_body),actor.id,p_supersedes) returning id into note_id;
  update public.candidate_profiles set updated_at = clock_timestamp() where id = candidate.id;
  perform private.workflow_event('internal_notes',note_id,'note_recorded',null,null,actor.id);
  return note_id;
end $$;

revoke all on function public.create_participation(uuid,integer,uuid,integer,text),
  public.record_preinterview(uuid,integer,text,timestamptz,timestamptz,text,text,text),
  public.record_contact(uuid,integer,text,text,timestamptz,text,timestamptz),
  public.record_internal_note(uuid,integer,uuid,text,text,uuid) from public,anon,authenticated,service_role;
grant execute on function public.create_participation(uuid,integer,uuid,integer,text),
  public.record_preinterview(uuid,integer,text,timestamptz,timestamptz,text,text,text),
  public.record_contact(uuid,integer,text,text,timestamptz,text,timestamptz),
  public.record_internal_note(uuid,integer,uuid,text,text,uuid) to authenticated;

-- US1 timeline for the municipal UI. Free-text reasons never enter audit_events
-- or company projections; only a live administrator can join the opaque ID.
create function public.admin_workflow_timeline(p_entity_type text, p_entity_id uuid)
returns table(event_id uuid, action text, previous_state text, new_state text,
  actor_type text, actor_account_id uuid, occurred_at timestamptz,
  reason_code text, reason text)
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_entity_type not in ('job_openings','participations','referrals','preinterviews',
    'contact_events','internal_notes','company_feedback','company_interviews') then
    raise exception 'INVALID_INPUT';
  end if;
  return query select e.id,e.action,e.previous_state,e.new_state,e.actor_type,
    e.actor_account_id,e.occurred_at,e.reason_code,d.reason
  from public.audit_events e left join private.workflow_decisions d
    on d.id = (e.metadata_safe->>'decision_id')::uuid
  where e.entity_type = p_entity_type and e.entity_id = p_entity_id
  order by e.occurred_at,e.id;
end $$;
revoke all on function public.admin_workflow_timeline(text,uuid)
  from public,anon,authenticated,service_role;
grant execute on function public.admin_workflow_timeline(text,uuid) to authenticated;
