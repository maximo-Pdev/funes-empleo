-- Registration terms are separate from operational candidate_consents.
-- No UPDATE of existing users, receipt backfill or change to workflow gates.
create table private.registration_terms_receipts (
  account_id uuid primary key references public.accounts(id) on delete restrict,
  role public.account_role not null check (role in ('candidate','company')),
  terms_version text not null check (terms_version='demo-terms-draft-1'),
  accepted_at timestamptz not null default clock_timestamp()
);
revoke all on private.registration_terms_receipts from public,anon,authenticated,service_role;
create trigger registration_terms_append_only
  before update or delete on private.registration_terms_receipts
  for each row execute function private.deny_history_change();

create function private.validate_registration_terms(p_metadata jsonb,p_required boolean)
returns boolean language plpgsql set search_path='' as $$
begin
  -- Trusted database provisioning may omit the fields, but never gains a receipt.
  if not p_required and not (coalesce(p_metadata,'{}') ?| array['registration_terms_accepted','registration_terms_version']) then
    return false;
  end if;
  if p_metadata->'registration_terms_accepted' is distinct from 'true'::jsonb
    or p_metadata->>'registration_terms_version' is distinct from 'demo-terms-draft-1' then
    raise exception 'REGISTRATION_TERMS_REQUIRED';
  end if;
  return true;
end; $$;
revoke all on function private.validate_registration_terms(jsonb,boolean) from public,anon,authenticated,service_role;

create function private.record_registration_terms() returns trigger
language plpgsql security definer set search_path='' as $$
declare target public.accounts;
begin
  -- portal_auth_insert runs first (alphabetical AFTER INSERT trigger ordering).
  -- It remains the authority for role, invitation and account creation/verification.
  select * into strict target from public.accounts where auth_user_id=new.id;
  if target.role not in ('candidate','company') then return new; end if;
  -- Auth API connections are not postgres/supabase_admin. session_user deliberately
  -- survives this SECURITY DEFINER boundary; user metadata cannot choose this bypass.
  if private.validate_registration_terms(new.raw_user_meta_data,session_user not in ('postgres','supabase_admin')) then
    insert into private.registration_terms_receipts(account_id,role,terms_version)
      values(target.id,target.role,'demo-terms-draft-1');
  end if;
  return new;
end; $$;
revoke all on function private.record_registration_terms() from public,anon,authenticated,service_role;
create trigger portal_registration_terms_insert after insert on auth.users
  for each row execute function private.record_registration_terms();

-- Recovery: application-only rollback must retain this immutable receipt table.
-- If necessary, disable the signup trigger under a reviewed maintenance procedure;
-- do not fabricate missing acceptance or delete existing receipts. No destructive down migration.
