-- US4. Forward-only. Recovery: corrective migration; local fictitious data may
-- be rebuilt from migrations/seed. No Auth identity, profile or history is merged.
create function private.assisted_matches(p_dni text,p_email text,p_exclude uuid default null)
returns table(candidate_id uuid,match_basis text) language sql security definer set search_path='' as $$
 select p.id, case when d.dni_normalized=p_dni and exists(select 1 from public.candidate_contacts c
   where c.candidate_id=p.id and c.kind='email' and c.archived_at is null and c.normalized_value=p_email)
   then 'both' when d.dni_normalized=p_dni then 'dni' else 'email' end
 from public.candidate_profiles p join public.candidate_private_data d on d.candidate_id=p.id
 where p.id is distinct from p_exclude and (d.dni_normalized=p_dni or exists(
   select 1 from public.candidate_contacts c where c.candidate_id=p.id and c.kind='email'
   and c.archived_at is null and c.normalized_value=nullif(p_email,'')))
 order by p.id
$$;

create function public.screen_assisted_duplicates(p_dni text,p_email text,p_exclude uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; source uuid:=gen_random_uuid(); matches jsonb;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if regexp_replace(coalesce(p_dni,''),'[^0-9]','','g') !~ '^[0-9]{7,8}$' then raise exception 'INVALID_INPUT'; end if;
 insert into public.duplicate_reviews(source_type,source_id,matched_candidate_id,match_basis)
 select 'assisted_registration',source,candidate_id,match_basis from private.assisted_matches(
   regexp_replace(p_dni,'[^0-9]','','g'),lower(trim(p_email)),p_exclude);
 select coalesce(jsonb_agg(jsonb_build_object('reviewId',r.id,'candidateId',p.id,
   'name',p.display_name,'basis',r.match_basis,'version',p.version)),'[]') into matches
 from public.duplicate_reviews r join public.candidate_profiles p on p.id=r.matched_candidate_id where r.source_id=source;
 return matches;
end $$;

create function public.save_assisted_candidate(p_candidate uuid,p_expected_version integer,p_data jsonb,
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
 update public.candidate_private_data set dni_normalized=normalized,dni_display=normalized,address=nullif(trim(data->>'address'),'') where candidate_id=target;
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
   delete from public.candidate_categories where candidate_id=target;
   insert into public.candidate_categories(candidate_id,category_id,kind) select target,x,'occupation' from unnest(ids) x;
   insert into public.candidate_categories(candidate_id,category_id,kind) select target,x,'interest' from unnest(interests) x;
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

create function public.assisted_candidate_command(p_candidate uuid,p_expected_version integer,p_command text,
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
 next_status:=candidate.status;
 if p_command='activate' then
   if candidate.status not in ('draft','needs_update','unavailable','consent_withdrawn') or candidate.availability is distinct from 'available'
     or nullif(trim(candidate.locality),'') is null or nullif(trim(candidate.skills_experience_summary),'') is null
     or not exists(select 1 from public.candidate_categories where candidate_id=candidate.id)
     or not exists(select 1 from public.candidate_contacts where candidate_id=candidate.id and archived_at is null)
     then raise exception 'INVALID_TRANSITION'; end if;
   if not private.current_consent(candidate.id) then raise exception 'CONSENT_REQUIRED'; end if;
   if candidate.origin='self_service' and not exists(select 1 from public.cv_documents where candidate_id=candidate.id and status='valid' and archived_at is null) then raise exception 'VALID_CV_REQUIRED'; end if;
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

create function public.assisted_claim_requests(p_candidate uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb;
begin
 actor:=private.require_workflow_actor(); if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('accountId',a.id,'email',u.email,'verified',u.email_confirmed_at is not null)),'[]') into result
 from private.candidate_claim_requests r join public.accounts a on a.id=r.account_id join auth.users u on u.id=a.auth_user_id
 where r.candidate_id=p_candidate;
 return result;
end $$;

create function public.claim_assisted_profile(p_candidate uuid,p_expected_version integer,p_account uuid,p_dni text,p_in_person boolean)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; target public.accounts; identity auth.users;
 normalized text; conflict boolean; rid uuid;
begin
 actor:=private.require_workflow_actor(); if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
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
   perform private.workflow_event('duplicate_reviews',rid,'duplicate_detected',null,'pending',actor.id);
   return 'duplicate_review_required';
 end if;
 update public.candidate_profiles set account_id=target.id where id=candidate.id;
 -- Only a previously successful explicit claim can close its corresponding review.
 update public.duplicate_reviews set status='resolved',decision='use_or_update_existing',reason='Identidad comprobada presencialmente; datos corregidos y revalidados.',
   resolved_by=actor.id,resolved_at=clock_timestamp() where source_type='account_link' and source_id=target.id and matched_candidate_id=candidate.id and status='pending';
 perform private.record_event('candidate_profiles',candidate.id,'assisted_account_linked',candidate.status::text,candidate.status::text,actor.id);
 return 'linked';
end $$;

revoke all on function private.assisted_matches(text,text,uuid) from public,anon,authenticated,service_role;
revoke all on function public.screen_assisted_duplicates(text,text,uuid),public.save_assisted_candidate(uuid,integer,jsonb,uuid,text,text,text[]),
 public.assisted_candidate_command(uuid,integer,text,text,text),public.assisted_claim_requests(uuid),
 public.claim_assisted_profile(uuid,integer,uuid,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.screen_assisted_duplicates(text,text,uuid),public.save_assisted_candidate(uuid,integer,jsonb,uuid,text,text,text[]),
 public.assisted_candidate_command(uuid,integer,text,text,text),public.assisted_claim_requests(uuid),
 public.claim_assisted_profile(uuid,integer,uuid,text,boolean) to authenticated;
