-- EXTRA069. Read-only minimum identity for already referred own candidates.
-- No backfill, snapshot, state transition or change to full-data/Storage permissions.
begin;

create function public.company_referral_summaries(p_opening uuid)
returns table(referral_id uuid,opening_id uuid,opening_title text,referred_at timestamptz,candidate_name text)
-- Session authorization takes FOR SHARE; PostgREST must allow that lock.
language plpgsql volatile security definer set search_path='' as $$
declare actor public.accounts;
begin
  actor:=private.require_workflow_actor();
  if actor.role <> 'company' then raise exception 'NOT_FOUND'; end if;
  return query
    select reference.referral_id,reference.opening_id,reference.opening_title,reference.referred_at,candidate.display_name
    from public.company_referral_references(p_opening) reference
    join public.referrals referral on referral.id=reference.referral_id
    join public.participations participation on participation.id=referral.participation_id
    join public.candidate_profiles candidate on candidate.id=participation.candidate_id
    order by reference.referred_at desc,reference.referral_id;
end $$;
revoke all on function public.company_referral_summaries(uuid) from public,anon,authenticated,service_role;
grant execute on function public.company_referral_summaries(uuid) to authenticated;

create or replace function public.company_referral(p_referral uuid) returns jsonb
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
  if company.id is null or company.account_id <> actor or company.status <> 'active' or company.archived_at is not null
    or not exists(select 1 from public.accounts a where a.id=actor and a.role='company' and a.status='active')
    or o.archived_at is not null or p.archived_at is not null or r.archived_at is not null
  then raise exception 'NOT_FOUND'; end if;
  result := jsonb_build_object('referralId', r.id, 'openingId', o.id,
    'openingTitle', o.title, 'referredAt', r.referred_at);
  select * into cp from public.candidate_profiles where id = p.candidate_id;
  if cp.id is not null then
    result := result || jsonb_build_object('candidateName',cp.display_name);
  end if;
  if p.status = 'hired' and cp.id is not null then
    result := result || jsonb_build_object('hiredCandidate',jsonb_build_object('displayName',cp.display_name,'outcome','hired'));
  end if;
  if not private.can_company_read_referral(r.id) then return result; end if;
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
revoke all on function public.company_referral(uuid) from public,anon,authenticated,service_role;
grant execute on function public.company_referral(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
