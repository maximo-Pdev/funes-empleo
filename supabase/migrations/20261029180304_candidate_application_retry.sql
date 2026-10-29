begin;
-- EXTRA102: retain withdrawals, allow only voluntary new cases after them.
-- Recovery: restore old RPC guards to stop retries; retain this compatible index
-- and every historical row. Never rebuild the former index over repeated pairs.
drop index public.participation_once;
create unique index participation_once on public.participations(candidate_id,opening_id)
 where archived_at is null and status <> 'withdrawn';

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
  if exists(select 1 from public.participations where candidate_id = candidate.id and opening_id = opening.id and archived_at is null
    and (p_origin <> 'self_application' or status <> 'withdrawn')) then raise exception 'INVALID_TRANSITION'; end if;
  insert into public.participations(candidate_id,opening_id,origin,created_by,status,application_cv_document_id)
  values(candidate.id,opening.id,p_origin,actor.id,next_status,chosen_cv.id) returning id into new_id;
  perform private.workflow_event('participations',new_id,'participation_created',null,next_status::text,actor.id);
  return new_id;
end $$;


create or replace function public.reserve_application_cv(p_opening uuid,p_candidate_version integer,p_cv uuid,
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
   or exists(select 1 from public.participations p where p.candidate_id=candidate.id and p.opening_id=opening.id and p.archived_at is null and p.status<>'withdrawn')
   then raise exception 'INVALID_TRANSITION'; end if;
 if not exists(select 1 from public.cv_documents where candidate_id=candidate.id and opening_id is null
   and status='valid' and archived_at is null) then raise exception 'VALID_CV_REQUIRED'; end if;
  if p_path is distinct from candidate.id::text||'/'||p_cv::text||'.pdf' or length(coalesce(p_name,'')) not between 1 and 200
    or p_size not between 1 and 5242880 or p_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
  insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,
    status,validation_result,uploaded_by,opening_id)
    values(p_cv,candidate.id,p_path,p_name,'application/pdf',p_size,p_sha256,'rejected','upload_pending',actor.id,opening.id);
end $$;

notify pgrst, 'reload schema';
commit;
