-- US1/T034. One idempotent database job; no HTTP endpoint or production secret.
-- The argument exists for controlled pgTAP time travel and is not granted to API roles.
create extension if not exists pg_cron with schema pg_catalog;

create function private.run_daily_employment_maintenance(p_now timestamptz default clock_timestamp())
returns jsonb language plpgsql security definer set search_path = '' as $$
declare opening public.job_openings; part public.participations; referral public.referrals;
  closed_openings integer := 0; closed_referrals integer := 0; expired_access integer := 0;
begin
  -- A second invocation during the same interval observes only unchanged rows.
  perform pg_advisory_xact_lock(70620260920);
  for opening in select * from public.job_openings o
    where o.status = 'published' and o.archived_at is null
      and p_now >= ((o.closing_date + 1)::timestamp at time zone 'America/Buenos_Aires')
    order by o.id for update skip locked
  loop
    update public.job_openings set status = 'closed', closed_at = p_now,
      moderation_message_public = null where id = opening.id;
    insert into public.opening_moderation_events(opening_id,decision,previous_status,new_status,
      actor_type,actor_account_id)
    values(opening.id,'auto_closed','published','closed','system',null);
    perform private.workflow_event('job_openings',opening.id,'opening_auto_closed','published','closed',
      null,'closing_date_ended');
    closed_openings := closed_openings + 1;
  end loop;
  for part in select p.* from public.participations p join public.referrals r on r.participation_id = p.id
    where p.status in ('referred','company_interview','awaiting_feedback') and p.archived_at is null
      and r.feedback_due_at <= p_now and r.archived_at is null
      and not exists(select 1 from public.company_feedback f where f.referral_id = r.id
        and f.reported_outcome in ('hired','not_selected','candidate_withdrew','process_cancelled'))
    order by p.id for update of p skip locked
  loop
    update public.participations set status = 'no_company_response',
      final_outcome_at = p_now, final_outcome_by = null where id = part.id;
    perform private.revoke_workflow_referral(part.id,null,'no_company_response');
    perform private.workflow_event('participations',part.id,'no_company_response',
      part.status::text,'no_company_response',null,'feedback_deadline_ended');
    closed_referrals := closed_referrals + 1;
  end loop;
  for referral in select r.* from public.referrals r join public.participations p on p.id = r.participation_id
    where p.status = 'hired' and r.access_status = 'active'
      and r.post_hire_access_until is not null and r.post_hire_access_until <= p_now
    order by r.id for update of r skip locked
  loop
    update public.referrals set access_status = 'revoked', access_changed_at = p_now,
      access_changed_actor_type = 'system', access_changed_by_account_id = null,
      access_change_reason = 'post_hire_window_ended' where id = referral.id;
    perform private.workflow_event('referrals',referral.id,'post_hire_window_ended',
      'active','revoked',null,'post_hire_window_ended');
    expired_access := expired_access + 1;
  end loop;
  return jsonb_build_object('closedOpenings',closed_openings,'noCompanyResponse',closed_referrals,
    'expiredPostHireAccess',expired_access);
end $$;

revoke all on function private.run_daily_employment_maintenance(timestamptz)
  from public,anon,authenticated,service_role;

-- Supabase Cron uses UTC. 03:00 UTC is midnight in Buenos Aires for the demo;
-- each predicate still compares the exact UTC deadline, independent of run time.
select cron.schedule('municipal-employment-daily', '0 3 * * *',
  'select private.run_daily_employment_maintenance()');
