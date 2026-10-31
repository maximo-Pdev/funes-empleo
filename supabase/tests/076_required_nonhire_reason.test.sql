-- Synthetic fixture only. Run against an isolated migrated database.
begin;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values(private.fixture_id('nonhire-session',1),private.fixture_id('company',1));
select set_config('nonhire.referral',(select r.id::text from public.referrals r
 join public.participations p on p.id=r.participation_id
 join public.job_openings o on o.id=p.opening_id
 join public.company_profiles c on c.id=o.company_id
 join public.accounts a on a.id=c.account_id
 where a.auth_user_id=private.fixture_id('company',1) and r.archived_at is null and p.archived_at is null
 and o.archived_at is null and c.archived_at is null and c.status='active'
 and p.status in ('referred','company_interview','awaiting_feedback','no_company_response') order by r.id limit 1),true);
select ok(current_setting('nonhire.referral') is not null,'Fixture contains an eligible owned referral');
select set_config('nonhire.feedback_hash',(select md5(coalesce(jsonb_agg(to_jsonb(f) order by f.id)::text,'[]')) from public.company_feedback f),true);
select set_config('nonhire.audit_hash',(select md5(coalesce(jsonb_agg(to_jsonb(e) order by e.id)::text,'[]')) from public.audit_events e),true);
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id',private.fixture_id('nonhire-session',1))::text,true);
set local role authenticated;
select throws_ok($$select public.submit_company_feedback(current_setting('nonhire.referral')::uuid,'not_selected',null)$$,'P0001','INVALID_INPUT','Non-hire needs a reason');
select throws_ok($$select public.submit_company_feedback(current_setting('nonhire.referral')::uuid,'not_selected','')$$,'P0001','INVALID_INPUT','Empty reason rejected');
select throws_ok($$select public.submit_company_feedback(current_setting('nonhire.referral')::uuid,'not_selected',E' \t\n')$$,'P0001','INVALID_INPUT','Whitespace reason rejected');
reset role;
select is((select md5(coalesce(jsonb_agg(to_jsonb(f) order by f.id)::text,'[]')) from public.company_feedback f),current_setting('nonhire.feedback_hash'),'Rejected reports preserve all feedback');
select is((select md5(coalesce(jsonb_agg(to_jsonb(e) order by e.id)::text,'[]')) from public.audit_events e),current_setting('nonhire.audit_hash'),'Rejected reports preserve audit');
set local role authenticated;
select set_config('nonhire.feedback',public.submit_company_feedback(current_setting('nonhire.referral')::uuid,'not_selected','Otro perfil seleccionado.')::text,true);
select lives_ok($$select public.submit_company_feedback(current_setting('nonhire.referral')::uuid,'hired',null)$$,'Hire detail remains optional');
reset role;
select is((select message from public.company_feedback where id=current_setting('nonhire.feedback')::uuid),'Otro perfil seleccionado.','Reason persists on its own feedback record');
select ok(exists(select 1 from public.audit_events where entity_id=current_setting('nonhire.feedback')::uuid and action='feedback_recorded'),'Valid report keeps audit');
select * from finish();
rollback;
