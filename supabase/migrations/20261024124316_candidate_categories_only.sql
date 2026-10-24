-- EXTRA057. Preserve original classifications before consolidating effective categories.
-- Additive private history; no profile/state/consent/audit rewrites or catalog activation.
begin;
lock table public.candidate_profiles in share mode;
lock table public.candidate_categories in access exclusive mode;
create table private.legacy_candidate_interests (
 candidate_id uuid not null references public.candidate_profiles(id) on delete restrict,
 category_id uuid not null references public.job_categories(id) on delete restrict,
 interest_created_at timestamptz not null, interest_updated_at timestamptz not null,
 profile_version integer not null, migration_version text not null default '20261024124316',
 captured_at timestamptz not null default clock_timestamp(), captured_by name not null default session_user,
 primary key(candidate_id,category_id)
);
create table private.category_command_recovery (
 signature text primary key, definition text not null,
 migration_version text not null default '20261024124316',
 captured_at timestamptz not null default clock_timestamp()
);
alter table private.legacy_candidate_interests enable row level security;
alter table private.category_command_recovery enable row level security;
revoke all on private.legacy_candidate_interests,private.category_command_recovery from public,anon,authenticated,service_role;
insert into private.category_command_recovery(signature,definition)
select signature,pg_get_functiondef(signature::regprocedure)
from unnest(array[
 'public.save_assisted_candidate(uuid,integer,jsonb,uuid,text,text,text[])',
 'public.save_candidate_profile(integer,text,text,text,text,text,text,text,uuid[])',
 'public.create_active_assisted_candidate(jsonb,boolean,text,text,integer,uuid,text,text,text[])'
]) signature;
insert into private.legacy_candidate_interests(candidate_id,category_id,interest_created_at,interest_updated_at,profile_version)
select i.candidate_id,i.category_id,i.created_at,i.updated_at,p.version
from public.candidate_categories i join public.candidate_profiles p on p.id=i.candidate_id where i.kind='interest';
do $$
begin
 if exists(select 1 from public.candidate_categories i where i.kind='interest' and not exists(
   select 1 from private.legacy_candidate_interests h where h.candidate_id=i.candidate_id and h.category_id=i.category_id and h.interest_created_at=i.created_at and h.interest_updated_at=i.updated_at))
 then raise exception 'CATEGORY_CONSOLIDATION_INCOMPLETE'; end if;
end $$;
-- The existing PK(candidate_id,category_id) already guarantees a unique union.
-- Reclassify in place: no association is inserted/deleted and both timestamps stay intact.
update public.candidate_categories set kind='occupation' where kind='interest';
do $$
begin
 if exists(select 1 from private.legacy_candidate_interests h where not exists(
   select 1 from public.candidate_categories o where o.candidate_id=h.candidate_id and o.category_id=h.category_id
   and o.kind='occupation' and o.created_at=h.interest_created_at and o.updated_at=h.interest_updated_at))
 then raise exception 'CATEGORY_CONSOLIDATION_INCOMPLETE'; end if;
end $$;
alter table public.candidate_categories drop constraint candidate_categories_kind_check;
alter table public.candidate_categories add constraint candidate_categories_kind_check check(kind='occupation');
create trigger append_only before update or delete on private.legacy_candidate_interests for each row execute function private.deny_history_change();
create trigger append_only before update or delete on private.category_command_recovery for each row execute function private.deny_history_change();

create or replace function public.save_assisted_candidate(p_candidate uuid,p_expected_version integer,p_data jsonb,
 p_review uuid default null,p_decision text default null,p_reason text default null,p_fields text[] default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; review public.duplicate_reviews;
 data jsonb:=p_data; old_data jsonb; matches jsonb; normalized text; email_value text; phone_value text;
 key text; ids uuid[]; item record; target uuid:=p_candidate; next_status public.candidate_status;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if p_data ? 'interests' and p_data->'interests' is distinct from '[]'::jsonb then raise exception 'INVALID_INPUT'; end if;
 -- Serializes assisted duplicate checks, including shared-email false positives.
 perform pg_advisory_xact_lock(604040);
 if p_review is not null then
   select * into review from public.duplicate_reviews where id=p_review for update;
   if review.id is null or review.source_type<>'assisted_registration' or review.status<>'pending' then raise exception 'INVALID_TRANSITION'; end if;
   if p_decision is null or p_decision not in ('use_or_update_existing','correct_and_create','reject')
     or length(trim(coalesce(p_reason,''))) not between 1 and 1000 then raise exception 'INVALID_INPUT'; end if;
   if p_decision='use_or_update_existing' then
     if target is not null and target<>review.matched_candidate_id then raise exception 'INVALID_INPUT'; end if;
     target:=review.matched_candidate_id;
   elsif p_decision='correct_and_create' and target is not null then raise exception 'INVALID_INPUT';
   end if;
 elsif p_decision is not null then raise exception 'INVALID_INPUT'; end if;
 if p_decision='reject' then
   update public.duplicate_reviews set status='resolved',decision=p_decision,reason=trim(p_reason),resolved_by=actor.id,
     resolved_at=clock_timestamp() where source_id=review.source_id and status='pending';
   perform private.workflow_event('duplicate_reviews',review.id,'duplicate_resolved','pending','resolved',actor.id,'reject',review.id);
   return jsonb_build_object('status','rejected');
 end if;
 if target is not null then
   select * into candidate from public.candidate_profiles where id=target and archived_at is null for update;
   if candidate.id is null then raise exception 'NOT_FOUND'; end if;
   if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
   if candidate.account_id is not null and not exists(select 1 from public.accounts where id=candidate.account_id and status='active') then raise exception 'INVALID_TRANSITION'; end if;
   if p_decision='use_or_update_existing' then
     select jsonb_build_object('name',candidate.display_name,'dni',d.dni_normalized,'address',coalesce(d.address,''),
       'locality',coalesce(candidate.locality,''),'summary',coalesce(candidate.skills_experience_summary,''),
       'availability',coalesce(candidate.availability,'available'),'detail',coalesce(candidate.availability_detail,''),
       'phone',coalesce((select value from public.candidate_contacts where candidate_id=target and kind='phone' and archived_at is null and is_primary),''),
       'email',coalesce((select value from public.candidate_contacts where candidate_id=target and kind='email' and archived_at is null and is_primary),''),
       'categories',coalesce((select jsonb_agg(category_id) from public.candidate_categories where candidate_id=target and kind='occupation'),'[]'))
     into old_data from public.candidate_private_data d where d.candidate_id=target;
     foreach key in array p_fields loop
       if key not in ('name','dni','phone','email','locality','summary','availability','detail','address','categories')
         or not (p_data ? key) then raise exception 'INVALID_INPUT'; end if;
       old_data:=jsonb_set(old_data,array[key],p_data->key);
     end loop;
     data:=old_data;
   end if;
 end if;
 if jsonb_typeof(data) is distinct from 'object' then raise exception 'INVALID_INPUT'; end if;
 normalized:=regexp_replace(coalesce(data->>'dni',''),'[^0-9]','','g');
 email_value:=lower(trim(coalesce(data->>'email',''))); phone_value:=trim(coalesce(data->>'phone',''));
 if length(trim(coalesce(data->>'name',''))) not between 2 and 200 or normalized !~ '^[0-9]{7,8}$'
   or (phone_value='' and email_value='') or length(email_value)>320 or (email_value<>'' and email_value !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
   or (phone_value<>'' and phone_value !~ '^[+0-9() -]{6,50}$')
   or coalesce(data->>'availability','') not in ('available','unavailable')
   or length(coalesce(data->>'locality',''))>150 or length(coalesce(data->>'summary',''))>5000
   or length(coalesce(data->>'detail',''))>500 or length(coalesce(data->>'address',''))>500
   or jsonb_typeof(data->'categories') is distinct from 'array'
 then raise exception 'INVALID_INPUT'; end if;
 select coalesce(array_agg(x::uuid),'{}') into ids from jsonb_array_elements_text(data->'categories') x;
 if cardinality(ids)>40
   or cardinality(ids)<>(select count(distinct x) from unnest(ids) x)
   or exists(select 1 from unnest(ids) x left join public.job_categories c on c.id=x and c.active where c.id is null)
 then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from private.assisted_matches(normalized,email_value,target)) then
   matches:=public.screen_assisted_duplicates(normalized,email_value,target);
   return jsonb_build_object('status','duplicates','matches',matches);
 end if;
 if target is null then
   insert into public.candidate_profiles(origin,managed_by_admin_id,display_name) values('assisted',actor.id,trim(data->>'name')) returning * into candidate;
   target:=candidate.id;
   insert into public.candidate_private_data(candidate_id,dni_normalized,dni_display) values(target,normalized,normalized);
 end if;
 if p_decision is distinct from 'use_or_update_existing' or p_fields && array['dni','address'] then
   update public.candidate_private_data set dni_normalized=normalized,dni_display=normalized,address=nullif(trim(data->>'address'),'') where candidate_id=target;
 end if;
 next_status:=case when data->>'availability'='unavailable' and candidate.status='active' then 'unavailable'::public.candidate_status
   when data->>'availability'='available' and candidate.status='unavailable' then 'needs_update'::public.candidate_status
   when candidate.status='active' and (nullif(trim(data->>'locality'),'') is null or nullif(trim(data->>'summary'),'') is null or cardinality(ids)=0)
   then 'needs_update'::public.candidate_status else candidate.status end;
 -- A use-existing decision with no selected fields writes only the decision.
 if p_decision is distinct from 'use_or_update_existing' or cardinality(p_fields)>0 then
   update public.candidate_profiles set display_name=trim(data->>'name'),locality=nullif(trim(data->>'locality'),''),
     skills_experience_summary=nullif(trim(data->>'summary'),''),availability=data->>'availability',
     availability_detail=nullif(trim(data->>'detail'),''),status=next_status,
     last_confirmed_at=clock_timestamp(),refresh_due_at=clock_timestamp()+interval '6 months' where id=target;
   if p_decision is distinct from 'use_or_update_existing' or p_fields && array['categories'] then
     delete from public.candidate_categories where candidate_id=target
       and (p_decision is distinct from 'use_or_update_existing' or (kind='occupation' and 'categories'=any(p_fields)));
     if p_decision is distinct from 'use_or_update_existing' or 'categories'=any(p_fields) then
       insert into public.candidate_categories(candidate_id,category_id,kind) select target,x,'occupation' from unnest(ids) x;
     end if;
   end if;
   for item in select * from (values('phone',phone_value),('email',email_value)) as contacts(kind,value) loop
     if coalesce((select value from public.candidate_contacts where candidate_id=target and kind=item.kind and is_primary and archived_at is null),'') is distinct from item.value then
       update public.candidate_contacts set archived_at=clock_timestamp(),archived_by=actor.id,is_primary=false
         where candidate_id=target and kind=item.kind and is_primary and archived_at is null;
       if item.value<>'' then insert into public.candidate_contacts(candidate_id,kind,value,normalized_value,is_primary)
         values(target,item.kind,item.value,case when item.kind='email' then item.value else regexp_replace(item.value,'[^0-9+]','','g') end,true); end if;
     end if;
   end loop;
   perform private.record_event('candidate_profiles',target,case when p_candidate is null and p_decision is distinct from 'use_or_update_existing' then 'profile_created' else 'profile_updated' end,
     candidate.status::text,next_status::text,actor.id);
 end if;
 if p_review is not null then
   update public.duplicate_reviews set status='resolved',decision=p_decision,reason=trim(p_reason),resolved_by=actor.id,
     resolved_at=clock_timestamp() where source_id=review.source_id and status='pending';
   perform private.workflow_event('duplicate_reviews',review.id,'duplicate_resolved','pending','resolved',actor.id,p_decision,review.id);
 end if;
 return jsonb_build_object('status','saved','candidateId',target);
exception when unique_violation then raise exception 'POTENTIAL_DUPLICATE';
end $$;

create or replace function public.save_candidate_profile(p_expected_version integer, p_name text, p_dni text,
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
    or p_availability not in ('available', 'unavailable') or coalesce(array_length(p_categories, 1), 0) > 40
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

create or replace function public.create_active_assisted_candidate(p_data jsonb,p_confirmed boolean,p_policy_version text,p_policy_hash text,
 p_expected_version integer default null,p_review uuid default null,p_decision text default null,p_reason text default null,p_fields text[] default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb; target uuid; current_version integer;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 -- Using/rejecting an existing match is not a new registration or new consent.
 if p_decision in ('use_or_update_existing','reject') then
   return public.save_assisted_candidate(null,p_expected_version,p_data,p_review,p_decision,p_reason,p_fields);
 end if;
 if p_confirmed is distinct from true then raise exception 'CONSENT_REQUIRED'; end if;
 if not exists(select 1 from public.candidate_consent_policy() policy
   where policy.version=p_policy_version and policy.policy_hash=p_policy_hash) then raise exception 'INVALID_INPUT'; end if;
 if jsonb_typeof(p_data) is distinct from 'object'
   or jsonb_typeof(p_data->'categories') is distinct from 'array' then raise exception 'INVALID_INPUT'; end if;
 if nullif(btrim(p_data->>'locality'),'') is null or nullif(btrim(p_data->>'summary'),'') is null
   or p_data->>'availability' is distinct from 'available'
   or jsonb_array_length(p_data->'categories')=0 then raise exception 'INVALID_INPUT'; end if;
 result:=public.save_assisted_candidate(null,p_expected_version,p_data,p_review,p_decision,p_reason,p_fields);
 if result->>'status'<>'saved' then return result; end if;
 target:=(result->>'candidateId')::uuid;
 select version into current_version from public.candidate_profiles where id=target for update;
 current_version:=public.assisted_candidate_command(target,current_version,'accept_consent',p_policy_version,p_policy_hash);
 perform public.assisted_candidate_command(target,current_version,'activate');
 return result;
end $$;

notify pgrst, 'reload schema';
commit;
