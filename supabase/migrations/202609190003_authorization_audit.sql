-- T012/T016 foundation. Exposed tables default-deny; commands own all mutations.
create table public.audit_events (
 id uuid primary key default gen_random_uuid(), entity_type text not null check(entity_type ~ '^[a-z_]{1,64}$'), entity_id uuid not null,
 action text not null check(action in ('account_created','account_verified','admin_provisioned','account_suspended','account_reactivated','account_archived','account_restored','profile_created','profile_updated','profile_activated','profile_archived','profile_restored','profile_linked','availability_changed','consent_accepted','consent_withdrawn','cv_uploaded','cv_replaced','cv_archived','duplicate_resolved','opening_submitted','opening_approved','opening_changes_requested','opening_rejected','opening_paused','opening_resumed','opening_closed','opening_auto_closed','opening_suspended','opening_archived','opening_restored','opening_cancelled','participation_created','participation_advanced','stage_skipped','preinterview_recorded','preselection_recorded','referral_created','referral_revoked','interview_recorded','feedback_recorded','outcome_confirmed','outcome_corrected','no_company_response','post_hire_window_ended','contact_recorded','note_recorded','import_confirmed','import_completed','import_failed','metrics_exported','freshness_due')),
 previous_state text check(previous_state ~ '^[a-z_]{1,64}$'), new_state text check(new_state ~ '^[a-z_]{1,64}$'),
 reason_code text check(reason_code ~ '^[a-z_]{1,64}$'), reason_text text check(reason_text is null),
 actor_type text not null check(actor_type in ('account','system')), actor_account_id uuid references public.accounts(id) on delete restrict,
 occurred_at timestamptz not null default clock_timestamp(), request_id uuid not null default gen_random_uuid(),
 metadata_safe jsonb not null default '{}' check(jsonb_typeof(metadata_safe)='object' and (metadata_safe - array['decision_id','version','count'])='{}'),
 check((actor_type='account')=(actor_account_id is not null)),
 check(actor_type<>'system' or action in ('opening_auto_closed','no_company_response','post_hire_window_ended')),
 check(not(metadata_safe ? 'decision_id') or metadata_safe->>'decision_id' ~ '^[a-f0-9-]{36}$'),
 check(not(metadata_safe ? 'version') or jsonb_typeof(metadata_safe->'version')='number'),
 check(not(metadata_safe ? 'count') or jsonb_typeof(metadata_safe->'count')='number')
);
create index audit_history on public.audit_events(entity_type,entity_id,occurred_at);
create table private.account_decisions (
 id uuid primary key default gen_random_uuid(), account_id uuid not null references public.accounts(id),
 actor_account_id uuid not null references public.accounts(id), command text not null,
 reason text check(length(reason) between 1 and 500), created_at timestamptz not null default clock_timestamp()
);
revoke all on private.account_decisions from public,anon,authenticated,service_role;

create function private.deny_history_change() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'APPEND_ONLY'; end; $$;
create function private.bump_version() returns trigger language plpgsql set search_path='' as $$
begin new.version:=old.version+1; new.updated_at:=clock_timestamp(); return new; end; $$;
create function private.guard_referral() returns trigger language plpgsql set search_path='' as $$
begin
 if new.cv_document_id<>old.cv_document_id or new.consent_event_id<>old.consent_event_id or new.participation_id<>old.participation_id or new.candidate_id<>old.candidate_id or new.referred_at<>old.referred_at or new.feedback_due_at<>old.feedback_due_at or (old.access_status='revoked' and new.access_status<>'revoked') then raise exception 'INVALID_TRANSITION'; end if;
 return new;
end; $$;
create trigger immutable_referral before update on public.referrals for each row execute function private.guard_referral();

create function private.current_account_id() returns uuid language sql stable security definer set search_path='' as $$
 select id from public.accounts where auth_user_id=auth.uid() and status='active'
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.accounts where auth_user_id=auth.uid() and status='active' and role='admin')
$$;
create function private.owns_candidate(p_candidate uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.candidate_profiles p where p.id=p_candidate and p.account_id=private.current_account_id() and p.archived_at is null)
$$;
create function private.current_consent(p_candidate uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((select c.status='accepted' from public.candidate_consents c where c.candidate_id=p_candidate order by c.recorded_at desc,c.id desc limit 1),false)
$$;
create function private.can_read_cv(p_cv uuid) returns boolean language sql stable security definer set search_path='' as $$
 select private.current_account_id() is not null and exists(
 select 1 from public.cv_documents d join public.candidate_profiles cp on cp.id=d.candidate_id
 where d.id=p_cv and (private.is_admin() or (private.owns_candidate(cp.id) and d.status in ('valid','superseded')) or
 exists(
 select 1 from public.referrals r join public.participations p on p.id=r.participation_id
 join public.job_openings o on o.id=p.opening_id join public.company_profiles c on c.id=o.company_id
 join public.accounts ca on ca.id=c.account_id
 left join public.accounts a on a.id=cp.account_id
 where r.cv_document_id=d.id and r.access_status='active' and r.archived_at is null
 and c.account_id=private.current_account_id() and ca.status='active' and c.status='active' and c.archived_at is null
 and cp.archived_at is null and cp.status not in ('archived','consent_withdrawn') and (cp.account_id is null or a.status='active')
 and p.archived_at is null and o.archived_at is null and o.status not in ('suspended','cancelled')
 and d.status in ('valid','superseded') and d.archived_at is null and private.current_consent(cp.id)
 and (r.post_hire_access_until is null or clock_timestamp()<r.post_hire_access_until)
 and p.status in ('referred','company_interview','awaiting_feedback','hired')
 and (p.status<>'hired' or r.post_hire_access_until is not null)
 )))
$$;

create function private.record_event(p_type text,p_id uuid,p_action text,p_before text,p_after text,p_actor uuid,p_reason text default null,p_meta jsonb default '{}') returns void
language sql security definer set search_path='' as $$
 insert into public.audit_events(entity_type,entity_id,action,previous_state,new_state,actor_type,actor_account_id,reason_code,metadata_safe)
 values(p_type,p_id,p_action,p_before,p_after,'account',p_actor,p_reason,p_meta)
$$;

create function private.on_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
declare chosen public.account_role; aid uuid; actor uuid;
begin
 if tg_op='INSERT' then
   if new.raw_app_meta_data->>'portal_role'='admin' then chosen:='admin';
   elsif new.raw_user_meta_data->>'role' in ('candidate','company') then chosen:=(new.raw_user_meta_data->>'role')::public.account_role;
   else raise exception 'INVALID_INPUT'; end if;
   insert into public.accounts(auth_user_id,role,status)
   values(new.id,chosen,case when new.email_confirmed_at is null then 'pending_verification'::public.account_status else 'active'::public.account_status end) returning id into aid;
   actor:=coalesce(nullif(new.raw_app_meta_data->>'provisioned_by','')::uuid,aid);
   perform private.record_event('accounts',aid,case when chosen='admin' then 'admin_provisioned' else 'account_created' end,null,case when new.email_confirmed_at is null then 'pending_verification' else 'active' end,actor);
 elsif old.email_confirmed_at is null and new.email_confirmed_at is not null then
   update public.accounts set status='active' where auth_user_id=new.id and status='pending_verification' returning id into aid;
   if aid is not null then perform private.record_event('accounts',aid,'account_verified','pending_verification','active',aid); end if;
 end if;
 return new;
end; $$;
create trigger portal_auth_insert after insert on auth.users for each row execute function private.on_auth_user();
create trigger portal_auth_verify after update of email_confirmed_at on auth.users for each row execute function private.on_auth_user();

-- Minimal own-account status projection also works after suspension to display a safe notice.
create function public.my_account_status() returns table(id uuid,role public.account_role,status public.account_status,version integer)
language sql stable security definer set search_path='' as $$
 select a.id,a.role,a.status,a.version from public.accounts a where a.auth_user_id=auth.uid()
$$;

create function public.change_account_status(p_account uuid,p_version integer,p_command text,p_reason text,p_confirmed boolean)
returns integer language plpgsql security definer set search_path='' as $$
declare actor public.accounts; target public.accounts; desired public.account_status;
 decision uuid; cp uuid; co uuid; changed record; action_code text;
begin
 -- Serialize lifecycle decisions to prevent two administrators suspending one another concurrently.
 perform pg_advisory_xact_lock(70620260919);
 select * into actor from public.accounts where auth_user_id=auth.uid() for update;
 if actor.id is null or actor.status<>'active' then raise exception 'AUTH_REQUIRED'; end if;
 select * into target from public.accounts where id=p_account for update;
 if target.id is null or (actor.role<>'admin' and target.id<>actor.id) then raise exception 'NOT_FOUND'; end if;
 if p_version is distinct from target.version then raise exception 'CONFLICT_STALE_DATA'; end if;
 if not coalesce(p_confirmed,false) or p_command not in ('suspend','reactivate','archive','restore') then raise exception 'INVALID_INPUT'; end if;
 if actor.role='admin' and (p_reason is null or length(trim(p_reason)) not between 1 and 500) then raise exception 'INVALID_INPUT'; end if;
 if actor.role<>'admin' and p_command<>'archive' then raise exception 'FORBIDDEN'; end if;
 if target.role='admin' and p_command in ('archive','restore') then raise exception 'INVALID_TRANSITION'; end if;
 if p_command='suspend' then
   if target.status<>'active' then raise exception 'INVALID_TRANSITION'; end if;
   if target.id=actor.id then raise exception 'FORBIDDEN'; end if;
   if target.role='admin' and (select count(*) from public.accounts where role='admin' and status='active')<=1 then raise exception 'FORBIDDEN'; end if;
   desired:='suspended'; action_code:='account_suspended';
 elsif p_command='reactivate' then
   if target.status<>'suspended' then raise exception 'INVALID_TRANSITION'; end if;
   desired:='active'; action_code:='account_reactivated';
 elsif p_command='archive' then
   if target.status not in ('active','suspended') or (target.role='candidate' and actor.id<>target.id) then raise exception 'INVALID_TRANSITION'; end if;
   desired:='archived'; action_code:='account_archived';
 else
   if target.status<>'archived' then raise exception 'INVALID_TRANSITION'; end if;
   desired:='active'; action_code:='account_restored';
 end if;
 insert into private.account_decisions(account_id,actor_account_id,command,reason) values(target.id,actor.id,p_command,nullif(trim(p_reason),'')) returning id into decision;
 update public.accounts set status=desired,
 suspended_reason=case when desired='suspended' then trim(p_reason) end,
 suspended_at=case when desired='suspended' then clock_timestamp() end,
 suspended_by=case when desired='suspended' then actor.id end,
 archived_at=case when desired='archived' then clock_timestamp() end,
 archived_by=case when desired='archived' then actor.id end,
 archive_reason=case when desired='archived' then nullif(trim(p_reason),'') end
 where id=target.id;
 select id into cp from public.candidate_profiles where account_id=target.id for update;
 select id into co from public.company_profiles where account_id=target.id for update;
 if p_command in ('suspend','archive') then
   for changed in
     select r.id,r.access_status from public.referrals r join public.participations p on p.id=r.participation_id
     join public.job_openings o on o.id=p.opening_id
     where r.access_status='active' and (p.candidate_id=cp or o.company_id=co) for update of r
   loop
     update public.referrals set access_status='revoked',access_changed_at=clock_timestamp(),
       access_changed_actor_type='account',access_changed_by_account_id=actor.id,
       access_change_reason=case when cp is not null then 'candidate_' else 'company_' end || case when p_command='suspend' then 'suspended' else 'archived' end
       where id=changed.id;
     perform private.record_event('referrals',changed.id,'referral_revoked','active','revoked',actor.id,'account_access_removed');
   end loop;
 end if;
 if cp is not null and p_command in ('archive','restore') then
   for changed in select status from public.candidate_profiles where id=cp loop
    update public.candidate_profiles set status=case when p_command='archive' then 'archived'::public.candidate_status else 'draft'::public.candidate_status end,
       archived_at=case when p_command='archive' then clock_timestamp() end,archived_by=case when p_command='archive' then actor.id end where id=cp;
    perform private.record_event('candidate_profiles',cp,case when p_command='archive' then 'profile_archived' else 'profile_restored' end,changed.status::text,case when p_command='archive' then 'archived' else 'draft' end,actor.id,'account_decision');
   end loop;
   if p_command='archive' then
    for changed in select id,status from public.cv_documents where candidate_id=cp and status<>'archived' for update loop
     update public.cv_documents set status='archived',archived_at=clock_timestamp(),archived_by=actor.id where id=changed.id;
     perform private.record_event('cv_documents',changed.id,'cv_archived',changed.status::text,'archived',actor.id,'account_decision');
    end loop;
   end if;
 end if;
 if co is not null then
   for changed in select status from public.company_profiles where id=co loop
    update public.company_profiles set status=case when p_command='suspend' then 'suspended'::public.company_status when p_command='archive' then 'archived'::public.company_status else 'incomplete'::public.company_status end,
     suspension_reason=case when p_command='suspend' then trim(p_reason) end,
     suspended_at=case when p_command='suspend' then clock_timestamp() end,suspended_by=case when p_command='suspend' then actor.id end,
     archived_at=case when p_command='archive' then clock_timestamp() end,archived_by=case when p_command='archive' then actor.id end where id=co;
    perform private.record_event('company_profiles',co,case when p_command='archive' then 'profile_archived' when p_command='restore' then 'profile_restored' else 'profile_updated' end,changed.status::text,case when p_command='suspend' then 'suspended' when p_command='archive' then 'archived' else 'incomplete' end,actor.id,'account_decision');
   end loop;
   if p_command<>'reactivate' then
    for changed in select id,status from public.job_openings where company_id=co and
     ((p_command='restore' and archived_at is not null) or (p_command<>'restore' and status not in ('closed','rejected','cancelled') and archived_at is null)) for update
    loop
     update public.job_openings set status=case when p_command='suspend' then 'suspended'::public.opening_status when p_command='restore' then 'draft'::public.opening_status else status end,
      archived_at=case when p_command='archive' then clock_timestamp() end,archived_by=case when p_command='archive' then actor.id end where id=changed.id;
     perform private.record_event('job_openings',changed.id,case when p_command='suspend' then 'opening_suspended' when p_command='restore' then 'opening_restored' else 'opening_archived' end,changed.status::text,case when p_command='suspend' then 'suspended' when p_command='restore' then 'draft' else changed.status::text end,actor.id,'account_decision');
    end loop;
   end if;
 end if;
 perform private.record_event('accounts',target.id,action_code,target.status::text,desired::text,actor.id,'decision_recorded',jsonb_build_object('decision_id',decision,'version',target.version+1));
 return target.version+1;
end; $$;

alter table public.accounts enable row level security;
revoke all on public.accounts from anon,authenticated,service_role;
grant select on public.accounts to authenticated;
create policy admin_read on public.accounts for select to authenticated using(private.is_admin());
alter table public.job_categories enable row level security;
revoke all on public.job_categories from anon,authenticated,service_role;
grant select on public.job_categories to authenticated;
create policy admin_read on public.job_categories for select to authenticated using(private.is_admin());
alter table public.candidate_profiles enable row level security;
revoke all on public.candidate_profiles from anon,authenticated,service_role;
grant select on public.candidate_profiles to authenticated;
create policy admin_read on public.candidate_profiles for select to authenticated using(private.is_admin());
alter table public.candidate_private_data enable row level security;
revoke all on public.candidate_private_data from anon,authenticated,service_role;
grant select on public.candidate_private_data to authenticated;
create policy admin_read on public.candidate_private_data for select to authenticated using(private.is_admin());
alter table public.candidate_contacts enable row level security;
revoke all on public.candidate_contacts from anon,authenticated,service_role;
grant select on public.candidate_contacts to authenticated;
create policy admin_read on public.candidate_contacts for select to authenticated using(private.is_admin());
alter table public.candidate_categories enable row level security;
revoke all on public.candidate_categories from anon,authenticated,service_role;
grant select on public.candidate_categories to authenticated;
create policy admin_read on public.candidate_categories for select to authenticated using(private.is_admin());
alter table public.candidate_consents enable row level security;
revoke all on public.candidate_consents from anon,authenticated,service_role;
grant select on public.candidate_consents to authenticated;
create policy admin_read on public.candidate_consents for select to authenticated using(private.is_admin());
alter table public.cv_documents enable row level security;
revoke all on public.cv_documents from anon,authenticated,service_role;
grant select on public.cv_documents to authenticated;
create policy admin_read on public.cv_documents for select to authenticated using(private.is_admin());
alter table public.company_profiles enable row level security;
revoke all on public.company_profiles from anon,authenticated,service_role;
grant select on public.company_profiles to authenticated;
create policy admin_read on public.company_profiles for select to authenticated using(private.is_admin());
alter table public.job_openings enable row level security;
revoke all on public.job_openings from anon,authenticated,service_role;
grant select on public.job_openings to authenticated;
create policy admin_read on public.job_openings for select to authenticated using(private.is_admin());
alter table public.opening_categories enable row level security;
revoke all on public.opening_categories from anon,authenticated,service_role;
grant select on public.opening_categories to authenticated;
create policy admin_read on public.opening_categories for select to authenticated using(private.is_admin());
alter table public.opening_moderation_events enable row level security;
revoke all on public.opening_moderation_events from anon,authenticated,service_role;
grant select on public.opening_moderation_events to authenticated;
create policy admin_read on public.opening_moderation_events for select to authenticated using(private.is_admin());
alter table public.participations enable row level security;
revoke all on public.participations from anon,authenticated,service_role;
grant select on public.participations to authenticated;
create policy admin_read on public.participations for select to authenticated using(private.is_admin());
alter table public.preinterviews enable row level security;
revoke all on public.preinterviews from anon,authenticated,service_role;
grant select on public.preinterviews to authenticated;
create policy admin_read on public.preinterviews for select to authenticated using(private.is_admin());
alter table public.referrals enable row level security;
revoke all on public.referrals from anon,authenticated,service_role;
grant select on public.referrals to authenticated;
create policy admin_read on public.referrals for select to authenticated using(private.is_admin());
alter table public.company_feedback enable row level security;
revoke all on public.company_feedback from anon,authenticated,service_role;
grant select on public.company_feedback to authenticated;
create policy admin_read on public.company_feedback for select to authenticated using(private.is_admin());
alter table public.company_interviews enable row level security;
revoke all on public.company_interviews from anon,authenticated,service_role;
grant select on public.company_interviews to authenticated;
create policy admin_read on public.company_interviews for select to authenticated using(private.is_admin());
alter table public.contact_events enable row level security;
revoke all on public.contact_events from anon,authenticated,service_role;
grant select on public.contact_events to authenticated;
create policy admin_read on public.contact_events for select to authenticated using(private.is_admin());
alter table public.internal_notes enable row level security;
revoke all on public.internal_notes from anon,authenticated,service_role;
grant select on public.internal_notes to authenticated;
create policy admin_read on public.internal_notes for select to authenticated using(private.is_admin());
alter table public.import_batches enable row level security;
revoke all on public.import_batches from anon,authenticated,service_role;
grant select on public.import_batches to authenticated;
create policy admin_read on public.import_batches for select to authenticated using(private.is_admin());
alter table public.import_rows enable row level security;
revoke all on public.import_rows from anon,authenticated,service_role;
grant select on public.import_rows to authenticated;
create policy admin_read on public.import_rows for select to authenticated using(private.is_admin());
alter table public.duplicate_reviews enable row level security;
revoke all on public.duplicate_reviews from anon,authenticated,service_role;
grant select on public.duplicate_reviews to authenticated;
create policy admin_read on public.duplicate_reviews for select to authenticated using(private.is_admin());
alter table public.audit_events enable row level security;
revoke all on public.audit_events from anon,authenticated,service_role;
grant select on public.audit_events to authenticated;
create policy admin_read on public.audit_events for select to authenticated using(private.is_admin());
-- Accounts contain private suspension motives; only safe columns are selectable even with RLS.
revoke select on public.accounts from authenticated;
grant select(id,auth_user_id,role,status,created_at,updated_at,version,last_sign_in_at) on public.accounts to authenticated;
create policy account_owner on public.accounts for select to authenticated using(id=private.current_account_id());
create policy categories_active on public.job_categories for select to authenticated using(private.current_account_id() is not null and active);
create policy candidate_owner on public.candidate_profiles for select to authenticated using(private.owns_candidate(id));
create policy candidate_owner on public.candidate_private_data for select to authenticated using(private.owns_candidate(candidate_id));
create policy candidate_owner on public.candidate_contacts for select to authenticated using(private.owns_candidate(candidate_id));
create policy candidate_owner on public.candidate_categories for select to authenticated using(private.owns_candidate(candidate_id));
create policy candidate_owner on public.candidate_consents for select to authenticated using(private.owns_candidate(candidate_id));
create policy cv_owner on public.cv_documents for select to authenticated using(private.owns_candidate(candidate_id));
-- Raw candidate/referral data is deliberately not granted to companies. T031 supplies a projection.
create trigger version_row before update on public.accounts for each row execute function private.bump_version();
create trigger version_row before update on public.candidate_profiles for each row execute function private.bump_version();
create trigger version_row before update on public.candidate_private_data for each row execute function private.bump_version();
create trigger version_row before update on public.candidate_contacts for each row execute function private.bump_version();
create trigger version_row before update on public.cv_documents for each row execute function private.bump_version();
create trigger version_row before update on public.company_profiles for each row execute function private.bump_version();
create trigger version_row before update on public.job_openings for each row execute function private.bump_version();
create trigger version_row before update on public.participations for each row execute function private.bump_version();
create trigger version_row before update on public.preinterviews for each row execute function private.bump_version();
create trigger version_row before update on public.referrals for each row execute function private.bump_version();
create trigger version_row before update on public.company_interviews for each row execute function private.bump_version();
create trigger version_row before update on public.import_batches for each row execute function private.bump_version();
create trigger append_only before update or delete on public.audit_events for each row execute function private.deny_history_change();
create trigger append_only before update or delete on public.candidate_consents for each row execute function private.deny_history_change();
create trigger append_only before update or delete on public.opening_moderation_events for each row execute function private.deny_history_change();
create trigger append_only before update or delete on public.contact_events for each row execute function private.deny_history_change();
create trigger append_only before update or delete on public.internal_notes for each row execute function private.deny_history_change();
create trigger decision_append_only before update or delete on private.account_decisions for each row execute function private.deny_history_change();
revoke all on all functions in schema private from public,anon,authenticated,service_role;
grant usage on schema private to authenticated;
grant execute on function private.current_account_id(),private.is_admin(),private.owns_candidate(uuid),private.current_consent(uuid),private.can_read_cv(uuid) to authenticated;
revoke all on function public.my_account_status(),public.change_account_status(uuid,integer,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.my_account_status(),public.change_account_status(uuid,integer,text,text,boolean) to authenticated;
alter default privileges in schema public revoke all on tables from anon,authenticated,service_role;
alter default privileges in schema public revoke execute on functions from public,anon,authenticated,service_role;
alter default privileges in schema private revoke execute on functions from public,anon,authenticated,service_role;

