begin;
-- EXTRA096: additive scopes, no backfill or deletion; keep old clients compatible.
alter table public.cv_documents add column opening_id uuid references public.job_openings(id) on delete restrict;
drop index public.cv_current;
create unique index cv_current on public.cv_documents(candidate_id)
  where status='valid' and archived_at is null and opening_id is null;
create index cv_application_scope on public.cv_documents(opening_id,candidate_id) where opening_id is not null;
alter table public.participations add column application_cv_document_id uuid;
alter table public.participations add constraint participation_cv_owner_fk
  foreign key(application_cv_document_id,candidate_id) references public.cv_documents(id,candidate_id) on delete restrict;
create index participation_selected_cv on public.participations(application_cv_document_id) where application_cv_document_id is not null;

create function private.guard_cv_scope() returns trigger language plpgsql set search_path='' as $$
begin
 if new.opening_id is distinct from old.opening_id then raise exception 'IMMUTABLE_CV_SCOPE'; end if;
 return new;
end $$;
create trigger cv_scope_immutable before update of opening_id on public.cv_documents
  for each row execute function private.guard_cv_scope();
create function private.guard_participation_cv() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='UPDATE' and new.application_cv_document_id is distinct from old.application_cv_document_id then
  raise exception 'IMMUTABLE_PARTICIPATION_CV';
 end if;
 if new.application_cv_document_id is not null and not exists(select 1 from public.cv_documents d
   where d.id=new.application_cv_document_id and d.candidate_id=new.candidate_id
     and (d.opening_id is null or d.opening_id=new.opening_id)) then raise exception 'INVALID_INPUT'; end if;
 return new;
end $$;
create trigger participation_cv_scope before insert or update of application_cv_document_id,candidate_id,opening_id on public.participations
  for each row execute function private.guard_participation_cv();
revoke all on function private.guard_cv_scope(),private.guard_participation_cv() from public,anon,authenticated,service_role;


create or replace function private.create_participation_with_cv(p_candidate uuid, p_candidate_version integer,
  p_opening uuid, p_opening_version integer, p_origin text,p_cv uuid default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; opening public.job_openings;
  company public.company_profiles; company_account public.accounts;
  candidate_account public.accounts; consent public.candidate_consents;
  chosen_cv public.cv_documents; general_cv public.cv_documents; new_id uuid; next_status public.participation_status; deadline timestamptz;
begin
  actor := private.require_workflow_actor();
  select * into candidate from public.candidate_profiles where id = p_candidate for update;
  select * into opening from public.job_openings where id = p_opening for share;
  if candidate.id is null or opening.id is null or candidate.archived_at is not null
    or opening.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_candidate_version or opening.version is distinct from p_opening_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if (p_origin = 'self_application' and (actor.role <> 'candidate' or candidate.account_id is distinct from actor.id))
    or (p_origin = 'admin_nomination' and actor.role <> 'admin')
    or p_origin is null or p_origin not in ('self_application','admin_nomination') then raise exception 'NOT_FOUND'; end if;
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

    select * into general_cv from public.cv_documents where candidate_id=candidate.id
      and opening_id is null and status='valid' and archived_at is null for share;
    if general_cv.id is null then raise exception 'VALID_CV_REQUIRED'; end if;
    chosen_cv:=general_cv;
    if p_cv is not null then
      select * into chosen_cv from public.cv_documents where id=p_cv and candidate_id=candidate.id
        and opening_id=opening.id and uploaded_by=actor.id and status='rejected'
        and validation_result='upload_pending' and archived_at is null for update;
      if chosen_cv.id is null or not exists(select 1 from storage.objects where bucket_id='candidate-cvs'
        and name=chosen_cv.storage_path and metadata->>'mimetype'='application/pdf'
        and (metadata->>'size')::bigint=chosen_cv.byte_size) then raise exception 'INVALID_INPUT'; end if;
      update public.cv_documents set status='valid',validation_result='basic_structure_readable' where id=chosen_cv.id;
      perform private.record_event('cv_documents',chosen_cv.id,'cv_uploaded',null,'valid',actor.id);
    end if;
    next_status := 'received';
  else
    if p_cv is not null then raise exception 'INVALID_INPUT'; end if;
    if opening.status not in ('published','paused') or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
    next_status := 'under_review';
  end if;
  if exists(select 1 from public.participations where candidate_id = candidate.id and opening_id = opening.id and archived_at is null) then raise exception 'INVALID_TRANSITION'; end if;
  insert into public.participations(candidate_id,opening_id,origin,created_by,status,application_cv_document_id)
  values(candidate.id,opening.id,p_origin,actor.id,next_status,chosen_cv.id) returning id into new_id;
  perform private.workflow_event('participations',new_id,'participation_created',null,next_status::text,actor.id);
  return new_id;
end $$;


create or replace function public.create_participation(p_candidate uuid,p_candidate_version integer,
 p_opening uuid,p_opening_version integer,p_origin text) returns uuid
language sql security definer set search_path='' as $$
 select private.create_participation_with_cv(p_candidate,p_candidate_version,p_opening,p_opening_version,p_origin,null)
$$;

create function public.reserve_application_cv(p_opening uuid,p_candidate_version integer,p_cv uuid,
 p_path text,p_name text,p_size bigint,p_sha256 text) returns void
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; opening public.job_openings;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'candidate' then raise exception 'FORBIDDEN'; end if;
 select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null for share;
 if candidate.id is null then raise exception 'NOT_FOUND'; end if;
 if candidate.version is distinct from p_candidate_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 select * into opening from public.job_openings where id=p_opening and archived_at is null for share;
 if opening.id is null then raise exception 'NOT_FOUND'; end if;
 if candidate.status<>'active' or candidate.availability<>'available' or candidate.refresh_due_at is null
   or candidate.refresh_due_at<=clock_timestamp() or not private.current_consent(candidate.id)
   or opening.status<>'published' or opening.closing_date<(clock_timestamp() at time zone 'America/Buenos_Aires')::date
   or not exists(select 1 from public.company_profiles c join public.accounts a on a.id=c.account_id
     where c.id=opening.company_id and c.status='active' and c.archived_at is null and a.status='active')
   or exists(select 1 from public.participations p where p.candidate_id=candidate.id and p.opening_id=opening.id and p.archived_at is null)
   then raise exception 'INVALID_TRANSITION'; end if;
 if not exists(select 1 from public.cv_documents where candidate_id=candidate.id and opening_id is null
   and status='valid' and archived_at is null) then raise exception 'VALID_CV_REQUIRED'; end if;
  if p_path is distinct from candidate.id::text||'/'||p_cv::text||'.pdf' or length(coalesce(p_name,'')) not between 1 and 200
    or p_size not between 1 and 5242880 or p_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
  insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,
    status,validation_result,uploaded_by,opening_id)
    values(p_cv,candidate.id,p_path,p_name,'application/pdf',p_size,p_sha256,'rejected','upload_pending',actor.id,opening.id);
end $$;

create function public.apply_to_opening_with_cv(p_opening uuid,p_candidate_version integer,p_cv uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; opening public.job_openings;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'candidate' then raise exception 'FORBIDDEN'; end if;
 select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null;
 if candidate.id is null then raise exception 'NOT_FOUND'; end if;
 select * into opening from public.job_openings where id=p_opening and archived_at is null;
 if opening.id is null then raise exception 'NOT_FOUND'; end if;
 return private.create_participation_with_cv(candidate.id,p_candidate_version,opening.id,opening.version,'self_application',p_cv);
end $$;

create or replace function public.apply_to_opening(p_opening uuid,p_candidate_version integer) returns uuid
language sql security definer set search_path='' as $$
 select public.apply_to_opening_with_cv(p_opening,p_candidate_version,null)
$$;

create function public.my_candidate_participations_with_cv()
returns table(id uuid,opening_id uuid,opening_title text,display_status text,created_at timestamptz,
 version integer,cv_document_id uuid,cv_name text)
language sql volatile security definer set search_path='' as $$
 select visible.id,visible.opening_id,visible.opening_title,visible.display_status,visible.created_at,
   visible.version,d.id,d.original_name_safe
 from public.my_candidate_participations() visible join public.participations p on p.id=visible.id
 left join public.cv_documents d on d.id=p.application_cv_document_id and d.archived_at is null
   and d.status in ('valid','superseded')
 order by visible.created_at desc,visible.id desc
$$;


create or replace function public.commit_candidate_cv(p_candidate uuid,p_expected_version integer,
  p_cv uuid,p_path text,p_name text,p_size bigint,p_sha256 text) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; old_cv public.cv_documents; object_exists boolean;
begin
  actor := private.require_workflow_actor();
  if actor.role not in ('candidate','admin') then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for update;
  if candidate.id is null or (actor.role='candidate' and candidate.account_id is distinct from actor.id) then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_path is distinct from p_candidate::text||'/'||p_cv::text||'.pdf' or length(coalesce(p_name,'')) not between 1 and 200
    or p_size not between 1 and 5242880 or p_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
  if not exists(select 1 from public.cv_documents where id=p_cv and candidate_id=candidate.id and opening_id is null
    and storage_path=p_path and original_name_safe=p_name and byte_size=p_size and sha256=p_sha256
    and status='rejected' and validation_result='upload_pending' and uploaded_by=actor.id) then
    raise exception 'INVALID_INPUT';
  end if;
  select exists(select 1 from storage.objects where bucket_id='candidate-cvs' and name=p_path
    and (metadata->>'size')::bigint=p_size and metadata->>'mimetype'='application/pdf') into object_exists;
  if not object_exists then raise exception 'INVALID_INPUT'; end if;
  select * into old_cv from public.cv_documents where candidate_id=candidate.id and opening_id is null and status='valid' and archived_at is null for update;
  if old_cv.id is not null then
    update public.cv_documents set status='superseded',superseded_at=clock_timestamp() where id=old_cv.id;
    perform private.record_event('cv_documents',old_cv.id,'cv_replaced','valid','superseded',actor.id);
  end if;
  update public.cv_documents set status='valid',validation_result='basic_structure_readable'
    where id=p_cv;
  update public.candidate_profiles set updated_at=clock_timestamp() where id=candidate.id;
  perform private.record_event('cv_documents',p_cv,'cv_uploaded',null,'valid',actor.id);
  return candidate.version+1;
end $$;

create or replace function public.activate_candidate(p_expected_version integer) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null for update;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if candidate.status not in ('draft','needs_update','unavailable','consent_withdrawn')
    or candidate.availability <> 'available' or nullif(trim(coalesce(candidate.locality,'')),'') is null
    or nullif(trim(coalesce(candidate.skills_experience_summary,'')),'') is null
    or not exists(select 1 from public.candidate_categories where candidate_id=candidate.id)
    or not private.current_consent(candidate.id)
    or not exists(select 1 from public.cv_documents where candidate_id=candidate.id and opening_id is null and status='valid' and archived_at is null)
  then raise exception 'INVALID_TRANSITION'; end if;
  update public.candidate_profiles set status='active', activated_at=coalesce(activated_at,clock_timestamp()),
    last_confirmed_at=clock_timestamp(),refresh_due_at=clock_timestamp()+interval '6 months' where id=candidate.id;
  perform private.record_event('candidate_profiles',candidate.id,'profile_activated',candidate.status::text,'active',actor.id);
  return candidate.version+1;
end $$;

create or replace function public.assisted_candidate_command(p_candidate uuid,p_expected_version integer,p_command text,
 p_policy_version text default null,p_policy_hash text default null)
returns integer language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; item public.participations; ref public.referrals;
 next_status public.candidate_status; consent_status public.consent_status;
begin
 actor:=private.require_workflow_actor(); if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for update;
 if candidate.id is null then raise exception 'NOT_FOUND'; end if;
 if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 if candidate.account_id is not null and not exists(select 1 from public.accounts where id=candidate.account_id and status='active') then raise exception 'INVALID_TRANSITION'; end if;
 if p_command is null then raise exception 'INVALID_INPUT'; end if;
 next_status:=candidate.status;
 if p_command='activate' then
   if candidate.status not in ('draft','needs_update','unavailable','consent_withdrawn') or candidate.availability is distinct from 'available'
     or nullif(trim(candidate.locality),'') is null or nullif(trim(candidate.skills_experience_summary),'') is null
     or not exists(select 1 from public.candidate_categories where candidate_id=candidate.id)
     or not exists(select 1 from public.candidate_contacts where candidate_id=candidate.id and archived_at is null)
     then raise exception 'INVALID_TRANSITION'; end if;
   if not private.current_consent(candidate.id) then raise exception 'CONSENT_REQUIRED'; end if;
   if candidate.origin='self_service' and not exists(select 1 from public.cv_documents where candidate_id=candidate.id and opening_id is null and status='valid' and archived_at is null) then raise exception 'VALID_CV_REQUIRED'; end if;
   next_status:='active';
   update public.candidate_profiles set status=next_status,activated_at=coalesce(activated_at,clock_timestamp()),
     last_confirmed_at=clock_timestamp(),refresh_due_at=clock_timestamp()+interval '6 months' where id=candidate.id;
 else
   if p_command not in ('accept_consent','withdraw_consent') or not exists(select 1 from private.consent_policies
     where version=p_policy_version and policy_hash=p_policy_hash) then raise exception 'INVALID_INPUT'; end if;
   consent_status:=case when p_command='accept_consent' then 'accepted'::public.consent_status else 'withdrawn'::public.consent_status end;
   if (select status from public.candidate_consents where candidate_id=candidate.id order by recorded_at desc,id desc limit 1)=consent_status then raise exception 'INVALID_TRANSITION'; end if;
   insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
     values(candidate.id,p_policy_version,p_policy_hash,consent_status,actor.id,'assisted');
   next_status:=case when consent_status='withdrawn' then 'consent_withdrawn'::public.candidate_status
     when candidate.status='consent_withdrawn' then 'draft'::public.candidate_status else candidate.status end;
   update public.candidate_profiles set status=next_status where id=candidate.id;
   if consent_status='withdrawn' then
     for item in select * from public.participations where candidate_id=candidate.id and archived_at is null
       and status not in ('hired','not_selected','withdrawn','cancelled','no_company_response') for update loop
       update public.participations set status='withdrawn',final_outcome_at=clock_timestamp(),final_outcome_by=actor.id,
         withdrawal_reason='consent_withdrawn' where id=item.id;
       perform private.workflow_event('participations',item.id,'outcome_confirmed',item.status::text,'withdrawn',actor.id,'consent_withdrawn');
     end loop;
     for ref in select * from public.referrals where candidate_id=candidate.id and access_status='active' for update loop
       perform private.revoke_workflow_referral(ref.participation_id,actor.id,'consent_withdrawn');
     end loop;
   end if;
 end if;
 perform private.record_event('candidate_profiles',candidate.id,case p_command when 'activate' then 'profile_activated'
   when 'accept_consent' then 'consent_accepted' else 'consent_withdrawn' end,candidate.status::text,next_status::text,actor.id);
 return candidate.version+1;
end $$;

create or replace function private.opening_candidate_pool(p_opening uuid)
returns table(id uuid,display_name text,locality text,skills text,availability text,refresh_due_at timestamptz,
  candidate_version integer,matched_categories jsonb,cv_id uuid)
language sql stable set search_path='' as $$
  select candidate.id,candidate.display_name,candidate.locality,candidate.skills_experience_summary,
    candidate.availability,candidate.refresh_due_at,candidate.version,shared.categories,cv.id
  from public.job_openings opening
  join public.company_profiles company on company.id=opening.company_id
  join public.accounts company_account on company_account.id=company.account_id
  cross join public.candidate_profiles candidate
  join public.cv_documents cv on cv.candidate_id=candidate.id and cv.opening_id is null and cv.status='valid' and cv.archived_at is null
  cross join lateral (
    select jsonb_agg(jsonb_build_object('code',category.code,'name',category.name) order by category.name,category.id) as categories
    from public.job_categories category where category.active
      and exists(select 1 from public.opening_categories offered where offered.opening_id=opening.id and offered.category_id=category.id)
      and exists(select 1 from public.candidate_categories selected where selected.candidate_id=candidate.id and selected.category_id=category.id)
    having count(*)>0
  ) shared
  where opening.id=p_opening and opening.archived_at is null and opening.status in ('published','paused')
    and opening.closing_date >= (statement_timestamp() at time zone 'America/Buenos_Aires')::date
    and company.status='active' and company.archived_at is null and company_account.status='active'
    and candidate.status='active' and candidate.archived_at is null and candidate.availability='available'
    and candidate.refresh_due_at>statement_timestamp() and private.current_consent(candidate.id)
    and (candidate.account_id is null or exists(select 1 from public.accounts account where account.id=candidate.account_id and account.status='active'))
    and not exists(select 1 from public.participations participation where participation.candidate_id=candidate.id
      and participation.opening_id=opening.id and participation.archived_at is null)
$$;

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

      if part.application_cv_document_id is not null then
        select * into cv from public.cv_documents where id=part.application_cv_document_id
          and candidate_id=cand.id and (opening_id is null or opening_id=opening.id)
          and status in ('valid','superseded') and archived_at is null for share;
      else
        select * into cv from public.cv_documents where candidate_id=cand.id and opening_id is null
          and status='valid' and archived_at is null for share;
      end if;
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


revoke all on function private.create_participation_with_cv(uuid,integer,uuid,integer,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.reserve_application_cv(uuid,integer,uuid,text,text,bigint,text),
 public.apply_to_opening_with_cv(uuid,integer,uuid),public.my_candidate_participations_with_cv() from public,anon,authenticated,service_role;
grant execute on function public.reserve_application_cv(uuid,integer,uuid,text,text,bigint,text),
 public.apply_to_opening_with_cv(uuid,integer,uuid),public.my_candidate_participations_with_cv() to authenticated;
notify pgrst,'reload schema';
commit;
