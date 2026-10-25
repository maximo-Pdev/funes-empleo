-- S2 private candidate photos. Additive, forward-only.
-- Recovery: corrective migration; never make the bucket public or restore old bytes.
-- Replaced/removed objects lose all read authorization atomically, then the server
-- physically deletes through Storage API. Durable rows remain until acknowledged.
alter table public.audit_events drop constraint audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check(action in
 ('account_created','account_verified','admin_provisioned','account_suspended','account_reactivated','account_archived','account_restored',
  'profile_created','profile_updated','profile_activated','profile_archived','profile_restored','profile_linked','availability_changed',
  'consent_accepted','consent_withdrawn','cv_uploaded','cv_replaced','cv_archived','duplicate_resolved',
  'opening_created','opening_updated','opening_submitted','opening_approved','opening_changes_requested','opening_rejected',
  'opening_paused','opening_resumed','opening_closed','opening_auto_closed','opening_suspended','opening_archived','opening_restored','opening_cancelled',
  'participation_created','participation_advanced','stage_skipped','preinterview_recorded','preselection_recorded','referral_created','referral_revoked',
  'interview_recorded','feedback_recorded','outcome_confirmed','outcome_corrected','no_company_response','post_hire_window_ended',
  'contact_recorded','note_recorded','import_confirmed','import_completed','import_failed','metrics_exported','freshness_due','photo_uploaded','photo_replaced','photo_removed','photo_physically_deleted'));

create table public.candidate_photos (
 id uuid primary key,
 candidate_id uuid not null references public.candidate_profiles(id) on delete restrict,
 storage_path text not null unique,
 byte_size bigint not null check(byte_size between 1 and 5242880),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),
 state text not null check(state in ('pending','current','cleanup','deleted')),
 uploaded_by uuid not null references public.accounts(id) on delete restrict,
 created_at timestamptz not null default clock_timestamp(),
 deleted_at timestamptz,
 check(storage_path=candidate_id::text||'/'||id::text||'.webp'),
 check((state='deleted')=(deleted_at is not null))
);
create unique index candidate_photo_current on public.candidate_photos(candidate_id) where state='current';
create index candidate_photo_cleanup_queue on public.candidate_photos(candidate_id,state);
alter table public.candidate_photos enable row level security;
revoke all on public.candidate_photos from public,anon,authenticated,service_role;
grant select on public.candidate_photos to authenticated;

create function private.can_read_candidate_photo(p_photo uuid) returns boolean
language sql volatile security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s where s.user_id=auth.uid()
   and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>clock_timestamp()))
 and private.current_account_id() is not null and exists(
  select 1 from public.candidate_photos photo join public.candidate_profiles cp on cp.id=photo.candidate_id
  where photo.id=p_photo and photo.state='current' and cp.archived_at is null
   and (private.is_admin() or private.owns_candidate(cp.id)
     or exists(select 1 from public.referrals r where r.candidate_id=cp.id and private.can_company_read_referral(r.id)))
 )
$$;
revoke all on function private.can_read_candidate_photo(uuid) from public,anon,service_role;
grant execute on function private.can_read_candidate_photo(uuid) to authenticated;
create policy current_photo_read on public.candidate_photos for select to authenticated
 using(private.can_read_candidate_photo(id));

create function private.can_read_candidate_photo_path(p_path text) returns boolean
language sql volatile security definer set search_path='' as $$
 select exists(select 1 from public.candidate_photos photo where photo.storage_path=p_path
  and private.can_read_candidate_photo(photo.id))
$$;
revoke all on function private.can_read_candidate_photo_path(text) from public,anon,service_role;
grant execute on function private.can_read_candidate_photo_path(text) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('candidate-photos','candidate-photos',false,5242880,array['image/webp']);
-- No list, sign, transform, insert, update or delete policy for ordinary clients.
create policy candidate_photo_authenticated_download on storage.objects for select to authenticated using(
 bucket_id='candidate-photos'
 and storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info'])
 and private.can_read_candidate_photo_path(name)
);

create function public.authorize_candidate_photo_mutation(p_candidate uuid,p_expected_version integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'candidate' then raise exception 'FORBIDDEN'; end if;
 select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for share;
 if candidate.id is null or (actor.role='candidate' and candidate.account_id is distinct from actor.id) then raise exception 'NOT_FOUND'; end if;
 if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 return (auth.jwt()->>'session_id')::uuid;
end $$;
revoke all on function public.authorize_candidate_photo_mutation(uuid,integer) from public,anon,service_role;
grant execute on function public.authorize_candidate_photo_mutation(uuid,integer) to authenticated;

-- Service-only guard. The actor is the verified server account, never multipart input.
-- This cannot use require_workflow_actor(): service-role JWT has no end-user identity.
create function private.photo_ingestion_actor(p_actor uuid,p_auth_user uuid,p_session uuid,p_candidate uuid) returns public.accounts
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles;
begin
 perform 1 from auth.sessions where id=p_session and user_id=p_auth_user
  and (not_after is null or not_after>clock_timestamp()) for share;
 if not found then raise exception 'AUTH_REQUIRED'; end if;
 select * into actor from public.accounts where id=p_actor and auth_user_id=p_auth_user and status='active' for share;
 if actor.id is null or actor.role<>'candidate' then raise exception 'FORBIDDEN'; end if;
 select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for update;
 if candidate.id is null or (actor.role='candidate' and candidate.account_id is distinct from actor.id) then raise exception 'NOT_FOUND'; end if;
 return actor;
end $$;
revoke all on function private.photo_ingestion_actor(uuid,uuid,uuid,uuid) from public,anon,authenticated,service_role;

create function public.ingest_candidate_photo(p_actor uuid,p_auth_user uuid,p_session uuid,p_candidate uuid,p_expected_version integer,
 p_command text,p_photo uuid,p_size bigint,p_sha256 text) returns integer
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; staged public.candidate_photos; old_photo public.candidate_photos;
begin
 actor:=private.photo_ingestion_actor(p_actor,p_auth_user,p_session,p_candidate);
 select * into candidate from public.candidate_profiles where id=p_candidate;
 if p_command='abort' then
  update public.candidate_photos set state='cleanup' where id=p_photo and candidate_id=p_candidate and uploaded_by=actor.id and state='pending';
  return candidate.version;
 end if;
 if p_expected_version is null or p_expected_version<1 or candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 if p_command='prepare' then
  if p_photo is null or p_size is null or p_size not between 1 and 5242880 or p_sha256 is null or p_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
  insert into public.candidate_photos(id,candidate_id,storage_path,byte_size,sha256,state,uploaded_by)
   values(p_photo,p_candidate,p_candidate::text||'/'||p_photo::text||'.webp',p_size,p_sha256,'pending',actor.id);
  return candidate.version;
 elsif p_command='commit' then
  select * into staged from public.candidate_photos where id=p_photo and candidate_id=p_candidate and state='pending'
   and uploaded_by=actor.id and byte_size=p_size and sha256=p_sha256 for update;
  if staged.id is null or not exists(select 1 from storage.objects where bucket_id='candidate-photos' and name=staged.storage_path
    and (metadata->>'size')::bigint=p_size and metadata->>'mimetype'='image/webp') then raise exception 'INVALID_INPUT'; end if;
 elsif p_command is distinct from 'remove' then raise exception 'INVALID_INPUT';
 end if;
 select * into old_photo from public.candidate_photos where candidate_id=p_candidate and state='current' for update;
 if old_photo.id is not null then
  update public.candidate_photos set state='cleanup' where id=old_photo.id;
  perform private.record_event('candidate_photos',old_photo.id,case when p_command='remove' then 'photo_removed' else 'photo_replaced' end,'current','cleanup',actor.id);
 end if;
 if p_command='commit' then
  update public.candidate_photos set state='current' where id=staged.id;
  perform private.record_event('candidate_photos',staged.id,'photo_uploaded','pending','current',actor.id);
 end if;
 -- Existing version_row trigger increments version. A cleanup-only remove retry is idempotent.
 if old_photo.id is not null or p_command='commit' then
  update public.candidate_profiles set updated_at=clock_timestamp() where id=p_candidate returning * into candidate;
 end if;
 return candidate.version;
end $$;
revoke all on function public.ingest_candidate_photo(uuid,uuid,uuid,uuid,integer,text,uuid,bigint,text) from public,anon,authenticated;
grant execute on function public.ingest_candidate_photo(uuid,uuid,uuid,uuid,integer,text,uuid,bigint,text) to service_role;

create function public.candidate_photo_cleanup(p_actor uuid,p_auth_user uuid,p_session uuid,p_candidate uuid)
 returns table(id uuid,storage_path text)
language plpgsql security definer set search_path='' as $$
begin
 perform private.photo_ingestion_actor(p_actor,p_auth_user,p_session,p_candidate);
 -- Crashed uploads remain durable. Do not reclaim active concurrent reservations.
 update public.candidate_photos photo set state='cleanup' where photo.candidate_id=p_candidate
  and photo.state='pending' and photo.created_at<clock_timestamp()-interval '1 hour';
 return query select photo.id,photo.storage_path from public.candidate_photos photo where photo.candidate_id=p_candidate and photo.state='cleanup';
end $$;
revoke all on function public.candidate_photo_cleanup(uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.candidate_photo_cleanup(uuid,uuid,uuid,uuid) to service_role;

create function public.complete_candidate_photo_cleanup(p_actor uuid,p_auth_user uuid,p_session uuid,p_candidate uuid,p_photo uuid) returns void
language plpgsql security definer set search_path='' as $$
declare photo public.candidate_photos;
begin
 perform private.photo_ingestion_actor(p_actor,p_auth_user,p_session,p_candidate);
 select * into photo from public.candidate_photos where id=p_photo and candidate_id=p_candidate and state='cleanup' for update;
 if photo.id is null then return; end if;
 if exists(select 1 from storage.objects where bucket_id='candidate-photos' and name=photo.storage_path) then raise exception 'CLEANUP_NOT_COMPLETE'; end if;
 update public.candidate_photos set state='deleted',deleted_at=clock_timestamp() where id=photo.id;
 perform private.record_event('candidate_photos',photo.id,'photo_physically_deleted','cleanup','deleted',p_actor);
end $$;
revoke all on function public.complete_candidate_photo_cleanup(uuid,uuid,uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.complete_candidate_photo_cleanup(uuid,uuid,uuid,uuid,uuid) to service_role;

create function public.candidate_photo_cleanup_pending(p_candidate uuid) returns boolean
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles;
begin
 actor:=private.require_workflow_actor();
 select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null;
 if actor.role not in ('candidate','admin') or candidate.id is null
  or (actor.role='candidate' and candidate.account_id is distinct from actor.id) then raise exception 'NOT_FOUND'; end if;
 return exists(select 1 from public.candidate_photos where candidate_id=p_candidate
  and (state='cleanup' or (state='pending' and created_at<clock_timestamp()-interval '1 hour')));
end $$;
revoke all on function public.candidate_photo_cleanup_pending(uuid) from public,anon,service_role;
grant execute on function public.candidate_photo_cleanup_pending(uuid) to authenticated;
