-- US2 candidate commands. Forward-only; recover a fictitious environment from
-- migrations and seed, or apply a reviewed corrective migration.
create table private.candidate_claim_requests (
  account_id uuid primary key references public.accounts(id) on delete restrict,
  candidate_id uuid not null references public.candidate_profiles(id) on delete restrict,
  created_at timestamptz not null default clock_timestamp()
);
revoke all on private.candidate_claim_requests from public, anon, authenticated, service_role;

create table private.consent_policies (
  version text primary key, policy_text text not null, policy_hash text not null,
  check (policy_hash ~ '^[a-f0-9]{64}$')
);
revoke all on private.consent_policies from public, anon, authenticated, service_role;
insert into private.consent_policies(version, policy_text, policy_hash)
select 'demo-not-approved',
  'Consentimiento ficticio para pruebas con datos ficticios. No habilita el tratamiento de datos reales.',
  encode(extensions.digest('Consentimiento ficticio para pruebas con datos ficticios. No habilita el tratamiento de datos reales.', 'sha256'), 'hex');

create function public.candidate_consent_policy() returns table(version text, policy_text text, policy_hash text)
language sql stable security definer set search_path = '' as $$
  select p.version, p.policy_text, p.policy_hash from private.consent_policies p
  where p.version = 'demo-not-approved'
$$;

create function public.bootstrap_candidate(p_name text, p_dni text) returns text
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; normalized text; email_value text; existing public.candidate_profiles;
  new_id uuid;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  if p_name is null or length(trim(p_name)) not between 2 and 200 then raise exception 'INVALID_INPUT'; end if;
  normalized := regexp_replace(coalesce(p_dni, ''), '[^0-9]', '', 'g');
  if normalized !~ '^[0-9]{7,8}$' then raise exception 'INVALID_INPUT'; end if;
  select lower(email) into email_value from auth.users where id = actor.auth_user_id and email_confirmed_at is not null;
  if email_value is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into existing from public.candidate_profiles where account_id = actor.id for update;
  if existing.id is not null then return 'ready'; end if;
  select p.* into existing from public.candidate_profiles p
    left join public.candidate_private_data d on d.candidate_id = p.id
    left join public.candidate_contacts c on c.candidate_id = p.id and c.kind = 'email' and c.archived_at is null
    where d.dni_normalized = normalized or c.normalized_value = email_value
    order by p.created_at limit 1 for update of p;
  if existing.id is not null then
    if existing.origin = 'assisted' and existing.account_id is null then
      insert into private.candidate_claim_requests(account_id, candidate_id)
      values (actor.id, existing.id) on conflict (account_id) do nothing;
      return 'pending_in_person_claim';
    end if;
    raise exception 'DUPLICATE_PROFILE';
  end if;
  insert into public.candidate_profiles(account_id, origin, display_name, status)
    values (actor.id, 'self_service', trim(p_name), 'draft') returning id into new_id;
  insert into public.candidate_private_data(candidate_id, dni_normalized, dni_display)
    values (new_id, normalized, normalized);
  insert into public.candidate_contacts(candidate_id, kind, value, normalized_value, is_primary, verified_at)
    values (new_id, 'email', email_value, email_value, true, clock_timestamp());
  perform private.record_event('candidate_profiles', new_id, 'profile_created', null, 'draft', actor.id);
  return 'ready';
end $$;

create function public.save_candidate_profile(p_expected_version integer, p_name text, p_dni text,
  p_locality text, p_summary text, p_availability text, p_detail text, p_address text,
  p_categories uuid[]) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; normalized text; next_status public.candidate_status;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where account_id = actor.id and archived_at is null for update;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  normalized := regexp_replace(coalesce(p_dni, ''), '[^0-9]', '', 'g');
  if p_name is null or length(trim(p_name)) not between 2 and 200 or normalized !~ '^[0-9]{7,8}$'
    or length(coalesce(p_locality, '')) > 150 or length(coalesce(p_summary, '')) > 5000
    or length(coalesce(p_detail, '')) > 500 or length(coalesce(p_address, '')) > 500
    or p_availability not in ('available', 'unavailable') or coalesce(array_length(p_categories, 1), 0) > 20
    or coalesce(array_length(p_categories, 1), 0) <> coalesce((select count(distinct x) from unnest(p_categories) x), 0)
    or exists(select 1 from unnest(p_categories) x left join public.job_categories c on c.id=x and c.active where c.id is null)
  then raise exception 'INVALID_INPUT'; end if;
  if exists(select 1 from public.candidate_private_data where dni_normalized = normalized and candidate_id <> candidate.id) then
    raise exception 'DUPLICATE_PROFILE';
  end if;
  update public.candidate_private_data set dni_normalized=normalized, dni_display=normalized,
    address=nullif(trim(p_address), '') where candidate_id=candidate.id;
  delete from public.candidate_categories where candidate_id=candidate.id;
  insert into public.candidate_categories(candidate_id,category_id,kind)
    select candidate.id,x,'occupation' from unnest(p_categories) x;
  next_status := case when p_availability='unavailable' and candidate.status='active' then 'unavailable'::public.candidate_status
    when p_availability='available' and candidate.status='unavailable' then 'needs_update'::public.candidate_status
    else candidate.status end;
  update public.candidate_profiles set display_name=trim(p_name), locality=nullif(trim(p_locality), ''),
    skills_experience_summary=nullif(trim(p_summary), ''), availability=p_availability,
    availability_detail=nullif(trim(p_detail), ''), status=next_status,
    last_confirmed_at=clock_timestamp(), refresh_due_at=clock_timestamp()+interval '6 months'
    where id=candidate.id;
  perform private.record_event('candidate_profiles', candidate.id,
    case when next_status <> candidate.status then 'availability_changed' else 'profile_updated' end,
    candidate.status::text, next_status::text, actor.id);
  return candidate.version+1;
end $$;

create function public.set_candidate_phone(p_expected_version integer, p_phone text) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; old_contact public.candidate_contacts;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null for update;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if length(trim(coalesce(p_phone,''))) > 50 or (nullif(trim(coalesce(p_phone,'')),'') is not null
    and trim(p_phone) !~ '^[+0-9() -]{6,50}$') then raise exception 'INVALID_INPUT'; end if;
  select * into old_contact from public.candidate_contacts where candidate_id=candidate.id
    and kind='phone' and archived_at is null and is_primary for update;
  if old_contact.id is not null then
    update public.candidate_contacts set archived_at=clock_timestamp(), archived_by=actor.id, is_primary=false
      where id=old_contact.id;
  end if;
  if nullif(trim(coalesce(p_phone,'')),'') is not null then
    insert into public.candidate_contacts(candidate_id,kind,value,normalized_value,is_primary)
      values(candidate.id,'phone',trim(p_phone),regexp_replace(p_phone,'[^0-9+]','','g'),true);
  end if;
  update public.candidate_profiles set updated_at=clock_timestamp() where id=candidate.id;
  perform private.record_event('candidate_profiles',candidate.id,'profile_updated',candidate.status::text,candidate.status::text,actor.id);
  return candidate.version+1;
end $$;

create function public.change_candidate_consent(p_expected_version integer, p_status text,
  p_policy_version text, p_policy_hash text) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; policy private.consent_policies;
  previous public.candidate_consents; item public.participations; referral public.referrals;
  next_status public.candidate_status;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null for update;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_status not in ('accepted','withdrawn') then raise exception 'INVALID_INPUT'; end if;
  select * into policy from private.consent_policies where version=p_policy_version;
  if policy.version is null or policy.policy_hash is distinct from p_policy_hash then raise exception 'INVALID_INPUT'; end if;
  select * into previous from public.candidate_consents where candidate_id=candidate.id order by recorded_at desc,id desc limit 1;
  if previous.status::text is not distinct from p_status then raise exception 'INVALID_TRANSITION'; end if;
  insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
    values(candidate.id,policy.version,policy.policy_hash,p_status::public.consent_status,actor.id,'self_service');
  next_status := case when p_status='withdrawn' then 'consent_withdrawn'::public.candidate_status
    when candidate.status='consent_withdrawn' then 'draft'::public.candidate_status else candidate.status end;
  update public.candidate_profiles set status=next_status where id=candidate.id;
  if p_status='withdrawn' then
    for item in select * from public.participations where candidate_id=candidate.id and archived_at is null
      and status not in ('hired','not_selected','withdrawn','cancelled','no_company_response') for update
    loop
      update public.participations set status='withdrawn',final_outcome_at=clock_timestamp(),
        final_outcome_by=actor.id,withdrawal_reason='consent_withdrawn' where id=item.id;
      perform private.workflow_event('participations',item.id,'outcome_confirmed',item.status::text,'withdrawn',actor.id,'consent_withdrawn');
    end loop;
    for referral in select * from public.referrals where candidate_id=candidate.id and access_status='active' for update
    loop
      perform private.revoke_workflow_referral(referral.participation_id,actor.id,'consent_withdrawn');
    end loop;
  end if;
  perform private.record_event('candidate_profiles',candidate.id,
    case when p_status='accepted' then 'consent_accepted' else 'consent_withdrawn' end,
    candidate.status::text,next_status::text,actor.id);
  return candidate.version+1;
end $$;

create function public.activate_candidate(p_expected_version integer) returns integer
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
    or not exists(select 1 from public.cv_documents where candidate_id=candidate.id and status='valid' and archived_at is null)
  then raise exception 'INVALID_TRANSITION'; end if;
  update public.candidate_profiles set status='active', activated_at=coalesce(activated_at,clock_timestamp()),
    last_confirmed_at=clock_timestamp(),refresh_due_at=clock_timestamp()+interval '6 months' where id=candidate.id;
  perform private.record_event('candidate_profiles',candidate.id,'profile_activated',candidate.status::text,'active',actor.id);
  return candidate.version+1;
end $$;

-- A rejected/pending metadata row reserves the exact immutable Storage key.
-- Failed uploads never supersede the current valid CV.
create function public.reserve_candidate_cv(p_candidate uuid,p_expected_version integer,
  p_cv uuid,p_path text,p_name text,p_size bigint,p_sha256 text) returns void
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles;
begin
  actor := private.require_workflow_actor();
  if actor.role not in ('candidate','admin') then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for share;
  if candidate.id is null or (actor.role='candidate' and candidate.account_id<>actor.id) then raise exception 'NOT_FOUND'; end if;
  if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_path is distinct from p_candidate::text||'/'||p_cv::text||'.pdf' or length(coalesce(p_name,'')) not between 1 and 200
    or p_size not between 1 and 5242880 or p_sha256 !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_INPUT'; end if;
  insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,
    status,validation_result,uploaded_by)
    values(p_cv,candidate.id,p_path,p_name,'application/pdf',p_size,p_sha256,'rejected','upload_pending',actor.id);
end $$;

drop policy cv_validated_insert on storage.objects;
create policy cv_validated_insert on storage.objects for insert to authenticated with check (
  bucket_id='candidate-cvs' and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.pdf$'
  and metadata->>'mimetype'='application/pdf'
  and coalesce((metadata->>'size')::bigint,0) between 1 and 5242880
  and exists(select 1 from public.cv_documents d where d.storage_path=name
    and d.status='rejected' and d.validation_result='upload_pending'
    and d.mime_type='application/pdf' and d.byte_size=(metadata->>'size')::bigint
    and (private.is_admin() or private.owns_candidate(d.candidate_id)))
);

create function public.commit_candidate_cv(p_candidate uuid,p_expected_version integer,
  p_cv uuid,p_path text,p_name text,p_size bigint,p_sha256 text) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; old_cv public.cv_documents; object_exists boolean;
begin
  actor := private.require_workflow_actor();
  if actor.role not in ('candidate','admin') then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for update;
  if candidate.id is null or (actor.role='candidate' and candidate.account_id<>actor.id) then raise exception 'NOT_FOUND'; end if;
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

-- Only the candidate sees this limited status projection. Raw participations
-- and the administrative stages/notes remain under their existing RLS grants.
create function public.my_candidate_participations()
returns table(id uuid,opening_id uuid,opening_title text,display_status text,created_at timestamptz,version integer)
language plpgsql stable security definer set search_path = '' as $$
declare actor public.accounts;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  return query select p.id,p.opening_id,o.title,
    case when p.status in ('hired','not_selected','withdrawn','cancelled','no_company_response')
      then p.status::text else 'received' end,p.created_at,p.version
    from public.participations p join public.job_openings o on o.id=p.opening_id
    join public.candidate_profiles c on c.id=p.candidate_id
    where c.account_id=actor.id and c.archived_at is null and p.archived_at is null
    order by p.created_at desc,p.id desc;
end $$;

-- The public receives only a fixed list of employment fields, never company
-- identity documents, private contacts or individual cases.
create function public.published_offers(p_page integer default 1,p_page_size integer default 10,p_id uuid default null)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare safe_page integer := greatest(1,least(coalesce(p_page,1),10000));
  safe_size integer := greatest(1,least(coalesce(p_page_size,10),30)); result jsonb;
begin
  select jsonb_build_object('total',count(*),'page',safe_page,'pageSize',safe_size,
    'items',coalesce((select jsonb_agg(to_jsonb(x)) from (
      select o.id,o.title,o.tasks,o.requirements,o.vacancies,o.location,o.modality,o.schedule,
        o.contract_type,o.closing_date,o.salary,o.benefits,c.legal_name as company_name,
        coalesce((select jsonb_agg(jsonb_build_object('id',j.id,'name',j.name) order by j.name)
          from public.opening_categories oc join public.job_categories j on j.id=oc.category_id
          where oc.opening_id=o.id), '[]'::jsonb) as categories
      from public.job_openings o join public.company_profiles c on c.id=o.company_id
      join public.accounts a on a.id=c.account_id
      where o.status='published' and o.archived_at is null and c.status='active' and c.archived_at is null
        and a.status='active' and o.closing_date >= (clock_timestamp() at time zone 'America/Buenos_Aires')::date
        and (p_id is null or o.id=p_id)
      order by o.published_at desc,o.id desc limit safe_size offset (safe_page-1)*safe_size
    ) x),'[]'::jsonb)) into result
  from public.job_openings o join public.company_profiles c on c.id=o.company_id
  join public.accounts a on a.id=c.account_id
  where o.status='published' and o.archived_at is null and c.status='active' and c.archived_at is null
    and a.status='active' and o.closing_date >= (clock_timestamp() at time zone 'America/Buenos_Aires')::date
    and (p_id is null or o.id=p_id);
  return result;
end $$;

create function public.apply_to_opening(p_opening uuid,p_candidate_version integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; candidate public.candidate_profiles; opening public.job_openings;
begin
  actor := private.require_workflow_actor();
  if actor.role <> 'candidate' then raise exception 'FORBIDDEN'; end if;
  select * into candidate from public.candidate_profiles where account_id=actor.id and archived_at is null for share;
  if candidate.id is null then raise exception 'NOT_FOUND'; end if;
  select * into opening from public.job_openings where id=p_opening for share;
  if opening.id is null then raise exception 'NOT_FOUND'; end if;
  return public.create_participation(candidate.id,p_candidate_version,opening.id,opening.version,'self_application');
end $$;

revoke all on function public.candidate_consent_policy(),public.bootstrap_candidate(text,text),
  public.save_candidate_profile(integer,text,text,text,text,text,text,text,uuid[]),
  public.set_candidate_phone(integer,text),public.change_candidate_consent(integer,text,text,text),
  public.activate_candidate(integer),public.reserve_candidate_cv(uuid,integer,uuid,text,text,bigint,text),
  public.commit_candidate_cv(uuid,integer,uuid,text,text,bigint,text),
  public.my_candidate_participations(),public.published_offers(integer,integer,uuid),
  public.apply_to_opening(uuid,integer)
  from public,anon,authenticated,service_role;
grant execute on function public.candidate_consent_policy(),public.published_offers(integer,integer,uuid) to anon,authenticated;
grant execute on function public.bootstrap_candidate(text,text),
  public.save_candidate_profile(integer,text,text,text,text,text,text,text,uuid[]),
  public.set_candidate_phone(integer,text),public.change_candidate_consent(integer,text,text,text),
  public.activate_candidate(integer),public.reserve_candidate_cv(uuid,integer,uuid,text,text,bigint,text),
  public.commit_candidate_cv(uuid,integer,uuid,text,text,bigint,text),
  public.my_candidate_participations(),public.apply_to_opening(uuid,integer) to authenticated;
