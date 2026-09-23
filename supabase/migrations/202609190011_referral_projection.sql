-- US1/T031-T033. Company Data API sees only SECURITY DEFINER projections,
-- never raw candidate, participation, referral or CV tables.
create function private.can_company_read_referral(p_referral uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.current_account_id() is not null and exists (
    select 1 from public.referrals r
    join public.participations p on p.id = r.participation_id
    join public.candidate_profiles cp on cp.id = p.candidate_id
    left join public.accounts ca on ca.id = cp.account_id
    join public.job_openings o on o.id = p.opening_id
    join public.company_profiles company on company.id = o.company_id
    join public.accounts owner on owner.id = company.account_id
    join public.cv_documents cv on cv.id = r.cv_document_id
    where r.id = p_referral and r.access_status = 'active' and r.archived_at is null
      and (r.post_hire_access_until is null or clock_timestamp() < r.post_hire_access_until)
      and p.status in ('referred','company_interview','awaiting_feedback','hired')
      and (p.status <> 'hired' or r.post_hire_access_until is not null)
      and p.archived_at is null and cp.archived_at is null
      and cp.status not in ('archived','consent_withdrawn')
      and (cp.account_id is null or ca.status = 'active')
      and o.archived_at is null and o.status not in ('suspended','cancelled')
      and company.archived_at is null and company.status = 'active'
      and owner.status = 'active' and company.account_id = private.current_account_id()
      and cv.status in ('valid','superseded') and cv.archived_at is null
      and private.current_consent(cp.id)
  )
$$;

create or replace function private.can_read_cv(p_cv uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.current_account_id() is not null and exists (
    select 1 from public.cv_documents d where d.id = p_cv and d.archived_at is null
      and (
        private.is_admin()
        or (private.owns_candidate(d.candidate_id) and d.status in ('valid','superseded'))
        or (d.status in ('valid','superseded') and exists (
          select 1 from public.referrals r where r.cv_document_id = d.id
            and private.can_company_read_referral(r.id)
        ))
      )
  )
$$;

create function public.authorized_cv_path(p_cv uuid) returns text
language plpgsql stable security definer set search_path = '' as $$
declare path text;
begin
  if not private.can_read_cv(p_cv) then raise exception 'NOT_FOUND'; end if;
  select storage_path into path from public.cv_documents where id = p_cv;
  if path is null then raise exception 'NOT_FOUND'; end if;
  return path;
end $$;

create function public.company_referral_references(p_opening uuid)
returns table(referral_id uuid, opening_id uuid, opening_title text, referred_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare owner_id uuid;
begin
  owner_id := private.current_account_id();
  if owner_id is null or not exists (
    select 1 from public.job_openings o join public.company_profiles c on c.id = o.company_id
    join public.accounts a on a.id = c.account_id
    where o.id = p_opening and c.account_id = owner_id and a.role = 'company' and a.status = 'active'
      and c.status = 'active' and c.archived_at is null and o.archived_at is null
  ) then raise exception 'NOT_FOUND'; end if;
  return query select r.id, o.id, o.title, r.referred_at
    from public.referrals r join public.participations p on p.id = r.participation_id
    join public.job_openings o on o.id = p.opening_id
    where o.id = p_opening and r.archived_at is null and p.archived_at is null
    order by r.referred_at desc, r.id;
end $$;

create function public.company_referral(p_referral uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid; r public.referrals; p public.participations;
  o public.job_openings; cp public.candidate_profiles; company public.company_profiles;
  result jsonb;
begin
  actor := private.current_account_id();
  select * into r from public.referrals where id = p_referral;
  if actor is null or r.id is null then raise exception 'NOT_FOUND'; end if;
  select * into p from public.participations where id = r.participation_id;
  select * into o from public.job_openings where id = p.opening_id;
  select * into company from public.company_profiles where id = o.company_id;
  if company.account_id <> actor or company.status <> 'active' or company.archived_at is not null
    or o.archived_at is not null or p.archived_at is not null or r.archived_at is not null
  then raise exception 'NOT_FOUND'; end if;
  result := jsonb_build_object('referralId', r.id, 'openingId', o.id,
    'openingTitle', o.title, 'referredAt', r.referred_at);
  if not private.can_company_read_referral(r.id) then return result; end if;
  select * into cp from public.candidate_profiles where id = p.candidate_id;
  return result || jsonb_build_object(
    'participationVersion', p.version,
    'candidate', jsonb_build_object(
      'displayName', cp.display_name,
      'locality', cp.locality,
      'skillsExperienceSummary', cp.skills_experience_summary,
      'availability', cp.availability,
      'categories', coalesce((select jsonb_agg(jsonb_build_object('name',jc.name,'kind',cc.kind) order by jc.name)
        from public.candidate_categories cc join public.job_categories jc on jc.id = cc.category_id
        where cc.candidate_id = cp.id), '[]'::jsonb),
      'contacts', coalesce((select jsonb_agg(jsonb_build_object('kind',ct.kind,'value',ct.value) order by ct.kind,ct.id)
        from public.candidate_contacts ct where ct.candidate_id = cp.id and ct.archived_at is null), '[]'::jsonb),
      'cvDocumentId', r.cv_document_id),
    'interviews', coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'scheduledAt',i.scheduled_at,
        'heldAt',i.held_at,'status',i.status,'companyMessage',i.company_message) order by i.created_at,i.id)
      from public.company_interviews i where i.referral_id = r.id and i.archived_at is null), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'reportedOutcome',f.reported_outcome,
        'message',f.message,'reportedAt',f.reported_at,'reviewStatus',f.review_status) order by f.reported_at,f.id)
      from public.company_feedback f where f.referral_id = r.id), '[]'::jsonb)
  );
end $$;

-- Reporting feedback is append-only and deliberately independent of the
-- data-access permission. The row lock serializes it with a concurrent final
-- outcome; it never overwrites the participation or exposes its version.
-- A company with a revoked referral sees only non-personal reference fields.
create function public.submit_company_feedback(p_referral uuid,
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
    or length(coalesce(p_message,'')) > 2000 then raise exception 'INVALID_INPUT'; end if;
  insert into public.company_feedback(referral_id,reported_outcome,message,reported_by)
  values(r.id,p_reported_outcome,nullif(trim(p_message),''),actor.id) returning id into feedback_id;
  perform private.workflow_event('company_feedback',feedback_id,'feedback_recorded',null,'pending_admin',actor.id);
  return feedback_id;
end $$;

create function public.submit_company_interview(p_referral uuid, p_expected_version integer,
  p_status text, p_scheduled_at timestamptz, p_held_at timestamptz,
  p_company_message text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; r public.referrals; p public.participations;
  company public.company_profiles; interview_id uuid; next_state public.participation_status;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'company' then raise exception 'FORBIDDEN'; end if;
  select * into r from public.referrals where id = p_referral and archived_at is null;
  if r.id is null then raise exception 'NOT_FOUND'; end if;
  select * into p from public.participations where id = r.participation_id and archived_at is null for update;
  select c.* into company from public.job_openings o join public.company_profiles c on c.id = o.company_id
    where o.id = p.opening_id and o.archived_at is null;
  if company.account_id <> actor.id or not private.can_company_read_referral(r.id) then raise exception 'NOT_FOUND'; end if;
  if p.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p.status not in ('referred','company_interview','awaiting_feedback') then raise exception 'INVALID_TRANSITION'; end if;
  if p_status not in ('scheduled','completed','cancelled','no_show')
    or (p_scheduled_at is null and p_held_at is null)
    or length(coalesce(p_company_message,'')) > 2000 then raise exception 'INVALID_INPUT'; end if;
  insert into public.company_interviews(referral_id,scheduled_at,held_at,status,company_message,recorded_by)
  values(r.id,p_scheduled_at,p_held_at,p_status,nullif(trim(p_company_message),''),actor.id)
  returning id into interview_id;
  next_state := case when p.status = 'referred' or p.status = 'awaiting_feedback'
    then 'company_interview'::public.participation_status else p.status end;
  update public.participations set status = next_state where id = p.id;
  perform private.workflow_event('company_interviews',interview_id,'interview_recorded',null,p_status,actor.id);
  if next_state <> p.status then
    perform private.workflow_event('participations',p.id,'participation_advanced',p.status::text,next_state::text,actor.id);
  end if;
  return interview_id;
end $$;

revoke all on function private.can_company_read_referral(uuid) from public,anon,service_role;
grant execute on function private.can_company_read_referral(uuid) to authenticated;
revoke all on function public.authorized_cv_path(uuid),public.company_referral_references(uuid),
  public.company_referral(uuid),public.submit_company_feedback(uuid,text,text),
  public.submit_company_interview(uuid,integer,text,timestamptz,timestamptz,text)
  from public,anon,authenticated,service_role;
grant execute on function public.authorized_cv_path(uuid),public.company_referral_references(uuid),
  public.company_referral(uuid),public.submit_company_feedback(uuid,text,text),
  public.submit_company_interview(uuid,integer,text,timestamptz,timestamptz,text)
  to authenticated;
