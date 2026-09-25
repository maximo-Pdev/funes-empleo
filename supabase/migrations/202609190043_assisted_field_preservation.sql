-- US4 review: preserve unselected category relationships and their timestamps.
-- The state-machine contract requires a reason for duplicate resolution, not
-- an ordinary conflict-free claim. Link the supplied reason to its audit event.
-- Forward-only correction; retain previous migrations during recovery.
create or replace function public.save_assisted_candidate(p_candidate uuid,p_expected_version integer,p_data jsonb,
 p_review uuid default null,p_decision text default null,p_reason text default null,p_fields text[] default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; review public.duplicate_reviews;
 data jsonb:=p_data; old_data jsonb; matches jsonb; normalized text; email_value text; phone_value text;
 key text; ids uuid[]; interests uuid[]; item record; target uuid:=p_candidate; next_status public.candidate_status;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
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
       'categories',coalesce((select jsonb_agg(category_id) from public.candidate_categories where candidate_id=target and kind='occupation'),'[]'),
       'interests',coalesce((select jsonb_agg(category_id) from public.candidate_categories where candidate_id=target and kind='interest'),'[]'))
     into old_data from public.candidate_private_data d where d.candidate_id=target;
     foreach key in array p_fields loop
       if key not in ('name','dni','phone','email','locality','summary','availability','detail','address','categories','interests')
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
   or jsonb_typeof(data->'categories') is distinct from 'array' or jsonb_typeof(data->'interests') is distinct from 'array'
 then raise exception 'INVALID_INPUT'; end if;
 select coalesce(array_agg(x::uuid),'{}') into ids from jsonb_array_elements_text(data->'categories') x;
 select coalesce(array_agg(x::uuid),'{}') into interests from jsonb_array_elements_text(data->'interests') x;
 if cardinality(ids)>20 or cardinality(interests)>20
   or cardinality(ids||interests)<>(select count(distinct x) from unnest(ids||interests) x)
   or exists(select 1 from unnest(ids||interests) x left join public.job_categories c on c.id=x and c.active where c.id is null)
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
   when candidate.status='active' and (nullif(trim(data->>'locality'),'') is null or nullif(trim(data->>'summary'),'') is null or cardinality(ids||interests)=0)
   then 'needs_update'::public.candidate_status else candidate.status end;
 -- A use-existing decision with no selected fields writes only the decision.
 if p_decision is distinct from 'use_or_update_existing' or cardinality(p_fields)>0 then
   update public.candidate_profiles set display_name=trim(data->>'name'),locality=nullif(trim(data->>'locality'),''),
     skills_experience_summary=nullif(trim(data->>'summary'),''),availability=data->>'availability',
     availability_detail=nullif(trim(data->>'detail'),''),status=next_status,
     last_confirmed_at=clock_timestamp(),refresh_due_at=clock_timestamp()+interval '6 months' where id=target;
   if p_decision is distinct from 'use_or_update_existing' or p_fields && array['categories','interests'] then
     delete from public.candidate_categories where candidate_id=target
       and (p_decision is distinct from 'use_or_update_existing' or (kind='occupation' and 'categories'=any(p_fields)) or (kind='interest' and 'interests'=any(p_fields)));
     if p_decision is distinct from 'use_or_update_existing' or 'categories'=any(p_fields) then
       insert into public.candidate_categories(candidate_id,category_id,kind) select target,x,'occupation' from unnest(ids) x;
     end if;
     if p_decision is distinct from 'use_or_update_existing' or 'interests'=any(p_fields) then
       insert into public.candidate_categories(candidate_id,category_id,kind) select target,x,'interest' from unnest(interests) x;
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

create or replace function public.claim_assisted_profile(p_candidate uuid,p_expected_version integer,p_account uuid,p_dni text,p_in_person boolean,p_reason text)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; target public.accounts; identity auth.users;
 normalized text; conflict boolean; rid uuid; decision_id uuid;
begin
 actor:=private.require_workflow_actor(); if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if length(coalesce(p_reason,''))>1000 then raise exception 'INVALID_INPUT'; end if;
 if p_in_person is distinct from true then raise exception 'INVALID_INPUT'; end if;
 perform pg_advisory_xact_lock(604040);
 select * into target from public.accounts where id=p_account for update;
 select * into candidate from public.candidate_profiles where id=p_candidate and archived_at is null for update;
 if candidate.id is null or target.id is null or candidate.origin<>'assisted' then raise exception 'NOT_FOUND'; end if;
 if candidate.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 select * into identity from auth.users where id=target.auth_user_id for share;
 if target.role<>'candidate' or target.status<>'active' or identity.email_confirmed_at is null then raise exception 'INVALID_TRANSITION'; end if;
 normalized:=regexp_replace(coalesce(p_dni,''),'[^0-9]','','g');
 conflict:=candidate.account_id is not null or exists(select 1 from public.candidate_profiles where account_id=target.id)
   or normalized is distinct from (select dni_normalized from public.candidate_private_data where candidate_id=candidate.id)
   or normalized is distinct from regexp_replace(coalesce(identity.raw_user_meta_data->>'candidate_dni',''),'[^0-9]','','g')
   or not exists(select 1 from private.candidate_claim_requests where account_id=target.id and candidate_id=candidate.id)
   or exists(select 1 from public.candidate_contacts where kind='email' and archived_at is null
     and normalized_value=lower(identity.email) and candidate_id<>candidate.id)
   or exists(select 1 from public.candidate_contacts where kind='email' and archived_at is null and candidate_id=candidate.id
     and normalized_value<>lower(identity.email));
 if conflict then
   insert into public.duplicate_reviews(source_type,source_id,matched_candidate_id,match_basis)
     values('account_link',target.id,candidate.id,'both') returning id into rid;

   return 'duplicate_review_required';
 end if;
 if exists(select 1 from public.duplicate_reviews where source_type='account_link' and source_id=target.id and matched_candidate_id=candidate.id and status='pending')
   and nullif(trim(coalesce(p_reason,'')),'') is null then raise exception 'INVALID_INPUT'; end if;
 update public.candidate_profiles set account_id=target.id where id=candidate.id;
 -- Only a previously successful explicit claim can close its corresponding review.
 update public.duplicate_reviews set status='resolved',decision='use_or_update_existing',reason=trim(p_reason),
   resolved_by=actor.id,resolved_at=clock_timestamp() where source_type='account_link' and source_id=target.id and matched_candidate_id=candidate.id and status='pending';
 if nullif(trim(coalesce(p_reason,'')),'') is not null then
   decision_id:=private.workflow_reason('candidate_profiles',candidate.id,'profile_linked',p_reason,actor.id);
 end if;
 perform private.workflow_event('candidate_profiles',candidate.id,'profile_linked',candidate.status::text,candidate.status::text,actor.id,null,decision_id);
 return 'linked';
end $$;
