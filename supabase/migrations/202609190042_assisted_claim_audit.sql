-- Use the established profile_linked audit action and capture the explicit
-- administrative reason. Pending conflicts remain in duplicate_reviews.
-- Forward-only correction; never rewrites an applied migration.
drop function public.claim_assisted_profile(uuid,integer,uuid,text,boolean);
create function public.claim_assisted_profile(p_candidate uuid,p_expected_version integer,p_account uuid,p_dni text,p_in_person boolean,p_reason text)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; target public.accounts; identity auth.users;
 normalized text; conflict boolean; rid uuid;
begin
 actor:=private.require_workflow_actor(); if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if length(trim(coalesce(p_reason,''))) not between 1 and 1000 then raise exception 'INVALID_INPUT'; end if;
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
 update public.candidate_profiles set account_id=target.id where id=candidate.id;
 -- Only a previously successful explicit claim can close its corresponding review.
 update public.duplicate_reviews set status='resolved',decision='use_or_update_existing',reason=trim(p_reason),
   resolved_by=actor.id,resolved_at=clock_timestamp() where source_type='account_link' and source_id=target.id and matched_candidate_id=candidate.id and status='pending';
 perform private.workflow_reason('candidate_profiles',candidate.id,'profile_linked',p_reason,actor.id);
 perform private.record_event('candidate_profiles',candidate.id,'profile_linked',candidate.status::text,candidate.status::text,actor.id);
 return 'linked';
end $$;


revoke all on function public.claim_assisted_profile(uuid,integer,uuid,text,boolean,text) from public,anon,authenticated,service_role;
grant execute on function public.claim_assisted_profile(uuid,integer,uuid,text,boolean,text) to authenticated;
