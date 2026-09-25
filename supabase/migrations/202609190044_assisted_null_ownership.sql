-- US4 authorization regression: a NULL account_id never belongs to a candidate.
-- SQL <> returns NULL for unlinked assisted profiles, so use IS DISTINCT FROM
-- before CV reservation/commit and self-application. Admin assistance is retained.
-- Forward-only; recovery uses a corrective migration, never the unsafe predicate.
create or replace function public.reserve_candidate_cv(p_candidate uuid,p_expected_version integer,
  p_cv uuid,p_path text,p_name text,p_size bigint,p_sha256 text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles;
begin
  actor := private.require_workflow_actor();
  if actor.role not in ('candidate','admin') then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for share;
  if candidate.id is null or (actor.role='candidate' and candidate.account_id is distinct from actor.id) then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_path is distinct from p_candidate::text||'/'||p_cv::text||'.pdf' or length(coalesce(p_name,'')) not between 1 and 200
    or p_size not between 1 and 5242880 or p_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
  insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,
    status,validation_result,uploaded_by)
    values(p_cv,candidate.id,p_path,p_name,'application/pdf',p_size,p_sha256,'rejected','upload_pending',actor.id);
end $$;

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
  if not exists(select 1 from public.cv_documents where id=p_cv and candidate_id=candidate.id
    and storage_path=p_path and original_name_safe=p_name and byte_size=p_size and sha256=p_sha256
    and status='rejected' and validation_result='upload_pending' and uploaded_by=actor.id) then
    raise exception 'INVALID_INPUT';
  end if;
  select exists(select 1 from storage.objects where bucket_id='candidate-cvs' and name=p_path
    and (metadata->>'size')::bigint=p_size and metadata->>'mimetype'='application/pdf') into object_exists;
  if not object_exists then raise exception 'INVALID_INPUT'; end if;
  select * into old_cv from public.cv_documents where candidate_id=candidate.id and status='valid' and archived_at is null for update;
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

create or replace function public.create_participation(p_candidate uuid, p_candidate_version integer,
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
