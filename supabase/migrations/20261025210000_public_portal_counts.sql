-- Public totals approved in EXTRA-079. No table or private-view access is granted.
-- Recovery: retire the consumer, then DROP FUNCTION public.public_portal_counts();
-- this additive migration changes no business records.
create function public.public_portal_counts() returns jsonb
language sql stable security definer set search_path='' as $$
  select pg_catalog.jsonb_build_object(
    'candidates', (select count(*) from public.candidate_profiles
      where archived_at is null and status <> 'archived'),
    'companies', (select count(*) from public.company_profiles
      where archived_at is null and status <> 'archived'),
    'offers', (select count(*) from private.public_offer_rows)
  )
$$;
revoke all on function public.public_portal_counts() from public,anon,authenticated,service_role;
grant execute on function public.public_portal_counts() to anon,authenticated;
comment on function public.public_portal_counts() is
  'Nonarchived candidate/company profiles, including incomplete/assisted/suspended registrations; currently public openings. Aggregate only.';
notify pgrst, 'reload schema';
