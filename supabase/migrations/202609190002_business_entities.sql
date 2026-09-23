-- T011. Every business relationship preserves history; no destructive cascades.
create table public.candidate_profiles (
 id uuid primary key default gen_random_uuid(), account_id uuid references public.accounts(id) on delete restrict unique,
 origin text not null check(origin in ('self_service','assisted','imported')),
 managed_by_admin_id uuid references public.accounts(id) on delete restrict, display_name text not null check(length(display_name) between 1 and 200),
 locality text check(length(locality)<=150), skills_experience_summary text check(length(skills_experience_summary)<=5000),
 availability text check(length(availability)<=100), availability_detail text check(length(availability_detail)<=500),
 status public.candidate_status not null default 'draft',
 last_confirmed_at timestamptz, refresh_due_at timestamptz, activated_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)),
 check(account_id is not null or managed_by_admin_id is not null),
 check(refresh_due_at is null or last_confirmed_at is not null)
);
create table public.candidate_private_data (
 candidate_id uuid primary key references public.candidate_profiles(id) on delete restrict,
 dni_normalized text not null unique check(dni_normalized ~ '^[0-9]{7,8}$'),
 dni_display text not null check(length(dni_display)<=20), address text check(length(address)<=500),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0)
);
create table public.candidate_contacts (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete restrict not null,
 kind text not null check(kind in ('email','phone','other_approved')),
 value text not null check(length(value) between 1 and 320), normalized_value text not null check(length(normalized_value) between 1 and 320),
 is_primary boolean not null default false, verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null))
);
create unique index contact_primary on public.candidate_contacts(candidate_id,kind) where is_primary and archived_at is null;
create table public.candidate_categories (
 candidate_id uuid references public.candidate_profiles(id) on delete restrict not null, category_id uuid references public.job_categories(id) on delete restrict not null,
 kind text not null check(kind in ('occupation','interest')), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), primary key(candidate_id,category_id)
);
create table public.candidate_consents (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete restrict not null,
 policy_version text not null check(length(policy_version) between 1 and 100), policy_hash text not null check(policy_hash ~ '^[a-f0-9]{64}$'),
 status public.consent_status not null, recorded_by uuid references public.accounts(id) on delete restrict not null,
 recorded_at timestamptz not null default now(), source text not null check(source in ('self_service','assisted')),
 unique(id,candidate_id)
);
create table public.cv_documents (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete restrict not null,
 storage_path text not null unique check(storage_path ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.pdf$'),
 original_name_safe text not null check(length(original_name_safe) between 1 and 200),
 mime_type text not null check(mime_type='application/pdf'), byte_size bigint not null check(byte_size between 1 and 5242880),
 sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'), status public.cv_status not null,
 validation_result text not null check(validation_result ~ '^[a-z_]{1,64}$'),
 uploaded_by uuid references public.accounts(id) on delete restrict not null, superseded_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)), unique(id,candidate_id)
);
create unique index cv_current on public.cv_documents(candidate_id) where status='valid' and archived_at is null;
create table public.company_profiles (
 id uuid primary key default gen_random_uuid(), account_id uuid references public.accounts(id) on delete restrict not null unique,
 legal_name text check(length(legal_name) between 1 and 200), cuit_normalized text unique check(cuit_normalized ~ '^[0-9]{11}$'),
 cuit_display text check(length(cuit_display)<=20), responsible_name text check(length(responsible_name)<=200),
 email text check(length(email)<=320), phone text check(length(phone)<=50),
 activity text check(length(activity)<=500), locality text check(length(locality)<=150),
 status public.company_status not null default 'incomplete', suspension_reason text check(length(suspension_reason)<=500),
 suspended_at timestamptz, suspended_by uuid references public.accounts(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)),
 check(status <> 'active' or (legal_name is not null and cuit_normalized is not null and responsible_name is not null and coalesce(email,phone) is not null and activity is not null and locality is not null))
);
create table public.job_openings (
 id uuid primary key default gen_random_uuid(), company_id uuid references public.company_profiles(id) on delete restrict not null,
 title text check(length(title) between 1 and 200), tasks text check(length(tasks)<=5000),
 requirements text check(length(requirements)<=5000), vacancies integer check(vacancies>0),
 location text check(length(location)<=200), modality text check(length(modality)<=100),
 schedule text check(length(schedule)<=500), contract_type text check(length(contract_type)<=100),
 closing_date date, salary text check(length(salary)<=500), benefits text check(length(benefits)<=2000),
 status public.opening_status not null default 'draft', published_at timestamptz, closed_at timestamptz,
 moderation_message_public text check(length(moderation_message_public)<=2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)),
 check(status <> 'published' or (published_at is not null and closing_date is not null and title is not null and tasks is not null and requirements is not null and vacancies is not null and location is not null and modality is not null and schedule is not null and contract_type is not null)),
 check(closing_date is null or published_at is null or closing_date >= (published_at at time zone 'America/Buenos_Aires')::date)
);
create table public.opening_categories (
 opening_id uuid references public.job_openings(id) on delete restrict not null, category_id uuid references public.job_categories(id) on delete restrict not null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(opening_id,category_id)
);
create table public.opening_moderation_events (
 id uuid primary key default gen_random_uuid(), opening_id uuid references public.job_openings(id) on delete restrict not null,
 decision text not null check(decision in ('submitted','approved','changes_requested','rejected','paused','resumed','closed','auto_closed','suspended','restored_to_draft','cancelled')),
 previous_status public.opening_status, new_status public.opening_status not null,
 company_message text check(length(company_message)<=2000), internal_reason text check(length(internal_reason)<=1000),
 actor_type text not null check(actor_type in ('account','system')), actor_account_id uuid references public.accounts(id) on delete restrict,
 created_at timestamptz not null default now(),
 check((actor_type='account')=(actor_account_id is not null)),
 check(decision not in ('changes_requested','rejected') or length(trim(company_message))>0)
);
create table public.participations (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete restrict not null,
 opening_id uuid references public.job_openings(id) on delete restrict not null, origin text not null check(origin in ('self_application','admin_nomination')),
 created_by uuid references public.accounts(id) on delete restrict not null, status public.participation_status not null,
 feedback_due_at timestamptz, final_outcome_at timestamptz, final_outcome_by uuid references public.accounts(id) on delete restrict,
 withdrawal_reason text check(length(withdrawal_reason)<=1000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)), unique(id,candidate_id)
);
create unique index participation_once on public.participations(candidate_id,opening_id) where archived_at is null;
create table public.preinterviews (
 id uuid primary key default gen_random_uuid(), participation_id uuid references public.participations(id) on delete restrict not null,
 scheduled_at timestamptz, held_at timestamptz, channel text not null check(channel in ('phone','email','whatsapp','in_person','video')),
 summary_internal text check(length(summary_internal)<=5000),
 recommendation text not null default 'pending' check(recommendation in ('pending','preselect','do_not_preselect')),
 recorded_by uuid references public.accounts(id) on delete restrict not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null))
);
create table public.referrals (
 id uuid primary key default gen_random_uuid(), participation_id uuid references public.participations(id) on delete restrict not null unique,
 candidate_id uuid references public.candidate_profiles(id) on delete restrict not null,
 referred_by uuid references public.accounts(id) on delete restrict not null, referred_at timestamptz not null default now(),
 access_status public.referral_access_status not null default 'active' check(access_status <> 'expired_by_policy'),
 consent_event_id uuid references public.candidate_consents(id) on delete restrict not null, cv_document_id uuid references public.cv_documents(id) on delete restrict not null,
 feedback_due_at timestamptz not null, post_hire_access_until timestamptz,
 access_changed_at timestamptz not null default now(), access_changed_actor_type text not null check(access_changed_actor_type in ('account','system')),
 access_changed_by_account_id uuid references public.accounts(id) on delete restrict,
 access_change_reason text not null check(access_change_reason in ('referral_created','application_withdrawn','consent_withdrawn','not_selected','process_cancelled','no_company_response','candidate_suspended','company_suspended','candidate_archived','company_archived','post_hire_window_ended','policy_expired')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)),
 check(feedback_due_at=referred_at+interval '720 hours'),
 check((access_changed_actor_type='account')=(access_changed_by_account_id is not null)),
 foreign key(participation_id,candidate_id) references public.participations(id,candidate_id) on delete restrict,
 foreign key(consent_event_id,candidate_id) references public.candidate_consents(id,candidate_id) on delete restrict,
 foreign key(cv_document_id,candidate_id) references public.cv_documents(id,candidate_id) on delete restrict
);
create table public.company_feedback (
 id uuid primary key default gen_random_uuid(), referral_id uuid references public.referrals(id) on delete restrict not null,
 reported_outcome text not null check(reported_outcome in ('hired','not_selected','candidate_withdrew','process_cancelled','other')),
 message text check(length(message)<=2000), reported_by uuid references public.accounts(id) on delete restrict not null,
 reported_at timestamptz not null default now(),
 review_status text not null default 'pending_admin' check(review_status in ('pending_admin','accepted','superseded'))
);
create table public.company_interviews (
 id uuid primary key default gen_random_uuid(), referral_id uuid references public.referrals(id) on delete restrict not null,
 scheduled_at timestamptz, held_at timestamptz, status text not null check(status in ('scheduled','completed','cancelled','no_show')),
 company_message text check(length(company_message)<=2000), internal_note text check(length(internal_note)<=5000),
 recorded_by uuid references public.accounts(id) on delete restrict not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null))
);
create table public.contact_events (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete restrict, company_id uuid references public.company_profiles(id) on delete restrict,
 opening_id uuid references public.job_openings(id) on delete restrict, participation_id uuid references public.participations(id) on delete restrict,
 channel text not null check(channel in ('phone','email','whatsapp','in_person')),
 direction text not null check(direction in ('inbound','outbound')), occurred_at timestamptz not null,
 summary_internal text not null check(length(summary_internal) between 1 and 5000), next_action_at timestamptz,
 recorded_by uuid references public.accounts(id) on delete restrict not null, created_at timestamptz not null default now(),
 check(num_nonnulls(candidate_id,company_id,opening_id,participation_id)>0)
);
create table public.internal_notes (
 id uuid primary key default gen_random_uuid(), candidate_id uuid references public.candidate_profiles(id) on delete restrict, participation_id uuid references public.participations(id) on delete restrict,
 note_kind text not null check(note_kind in ('applicant','training_guidance')),
 body text not null check(length(body) between 1 and 5000), created_by uuid references public.accounts(id) on delete restrict not null,
 created_at timestamptz not null default now(), supersedes_note_id uuid references public.internal_notes(id) on delete restrict, archived_at timestamptz,
 check(num_nonnulls(candidate_id,participation_id)>0)
);
create table public.import_batches (
 id uuid primary key default gen_random_uuid(), created_by uuid references public.accounts(id) on delete restrict not null,
 status public.import_status not null default 'uploaded' check(status <> 'archived'),
 mapping_version text check(length(mapping_version)<=100), source_reference_safe text check(source_reference_safe ~ '^[a-zA-Z0-9_-]{1,100}$'),
 file_sha256 text not null check(file_sha256 ~ '^[a-f0-9]{64}$'),
 total_rows integer not null default 0 check(total_rows>=0), valid_rows integer not null default 0 check(valid_rows>=0),
 warning_rows integer not null default 0 check(warning_rows>=0), invalid_rows integer not null default 0 check(invalid_rows>=0),
 duplicate_rows integer not null default 0 check(duplicate_rows>=0), confirmed_by uuid references public.accounts(id) on delete restrict,
 confirmed_at timestamptz, completed_at timestamptz, failure_code text check(failure_code ~ '^[A-Z_]{1,64}$'),
 retry_of_batch_id uuid references public.import_batches(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 version integer not null default 1 check(version>0), archived_at timestamptz,
 archived_by uuid references public.accounts(id) on delete restrict,
 check((archived_at is null)=(archived_by is null)),
 check(status not in ('confirming','completed') or mapping_version is not null),
 check(valid_rows+warning_rows+invalid_rows+duplicate_rows<=total_rows)
);
create table public.import_rows (
 id uuid primary key default gen_random_uuid(), batch_id uuid references public.import_batches(id) on delete restrict not null,
 row_number integer not null check(row_number>0), status public.import_row_status not null,
 normalized_payload jsonb not null default '{}' check(jsonb_typeof(normalized_payload)='object' and octet_length(normalized_payload::text)<=65536),
 error_codes text[] not null default '{}', matched_candidate_id uuid references public.candidate_profiles(id) on delete restrict,
 created_candidate_id uuid references public.candidate_profiles(id) on delete restrict, created_at timestamptz not null default now(), version integer not null default 1 check(version>0),
 unique(batch_id,row_number)
);
create table public.duplicate_reviews (
 id uuid primary key default gen_random_uuid(), source_type text not null check(source_type in ('self_registration','assisted_registration','account_link','import_row')),
 source_id uuid not null, matched_candidate_id uuid references public.candidate_profiles(id) on delete restrict not null,
 match_basis text not null check(match_basis in ('dni','email','both')),
 status text not null default 'pending' check(status in ('pending','resolved')),
 decision text check(decision in ('use_or_update_existing','correct_and_create','reject')),
 reason text check(length(reason) between 1 and 1000), resolved_by uuid references public.accounts(id) on delete restrict, resolved_at timestamptz,
 created_at timestamptz not null default now(), version integer not null default 1 check(version>0),
 check(status<>'resolved' or (decision is not null and reason is not null and resolved_by is not null and resolved_at is not null))
);
create index candidate_search on public.candidate_profiles(status,locality,refresh_due_at);
create index candidate_category on public.candidate_categories(category_id,candidate_id);
create index opening_search on public.job_openings(status,closing_date);
create index opening_category on public.opening_categories(category_id,opening_id);
create index participation_opening on public.participations(opening_id,status);
create index referral_deadline on public.referrals(access_status,feedback_due_at,post_hire_access_until);
create index consent_latest on public.candidate_consents(candidate_id,recorded_at desc,id);
