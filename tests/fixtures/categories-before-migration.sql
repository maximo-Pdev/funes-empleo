-- TEST ONLY. Execute only in a disposable fixture before migration20261024124316.
-- The probe supplies inactive/archived history and both former classifications.
insert into public.job_categories(id,code,name,version,active)
values(private.fixture_id('category-probe',1),'PROBE_INACTIVA','Categoría ficticia inactiva',98,false);
insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name,status,archived_at,archived_by)
values(private.fixture_id('category-probe-person',1),'assisted',private.fixture_id('admin',1),'Perfil ficticio archivado','archived',clock_timestamp(),private.fixture_id('admin',1));
insert into public.candidate_categories(candidate_id,category_id,kind,created_at) values
 (private.fixture_id('category-probe-person',1),private.fixture_id('category',1),'occupation','2026-09-01T12:00:00Z'),
 (private.fixture_id('category-probe-person',1),private.fixture_id('category',2),'interest','2026-09-02T12:00:00Z'),
 (private.fixture_id('category-probe-person',1),private.fixture_id('category-probe',1),'interest','2026-09-03T12:00:00Z');
create temporary table category_pairs_before as select distinct candidate_id,category_id from public.candidate_categories;
create temporary table category_interests_before as select * from public.candidate_categories where kind='interest';

-- A real eligible matching case with only the old classification, plus pagination.
insert into public.candidate_profiles(id,origin,managed_by_admin_id,display_name,status,availability,locality,skills_experience_summary,last_confirmed_at,refresh_due_at)
values(private.fixture_id('category-probe-person',2),'assisted',private.fixture_id('admin',1),'Perfil ficticio solo categoría previa','active','available','Funes','Experiencia ficticia',clock_timestamp(),clock_timestamp()+interval '1 month');
insert into public.candidate_categories(candidate_id,category_id,kind)
values(private.fixture_id('category-probe-person',2),private.fixture_id('category',2),'interest');
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
select private.fixture_id('category-probe-person',2),version,policy_hash,'accepted',private.fixture_id('admin',1),'assisted' from private.consent_policies where version='demo-not-approved';
insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by)
values(private.fixture_id('category-probe-cv',1),private.fixture_id('category-probe-person',2),private.fixture_id('category-probe-person',2)::text||'/'||private.fixture_id('category-probe-cv',1)||'.pdf','cv-ficticio.pdf','application/pdf',608,repeat('0',64),'valid','fictitious_fixture',private.fixture_id('admin',1));
update public.job_openings set status='paused',closing_date=(clock_timestamp()+interval '1 month')::date where id=private.fixture_id('opening',1);
insert into public.opening_categories(opening_id,category_id) values(private.fixture_id('opening',1),private.fixture_id('category',2)) on conflict do nothing;
insert into auth.sessions(id,user_id) values(private.fixture_id('category-probe-session',1),private.fixture_id('admin',1));
grant execute on function private.fixture_id(text,integer) to authenticated;
set role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,false);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id',private.fixture_id('category-probe-session',1))::text,false);
create temporary table category_rpc_before as select page,public.match_opening_candidates(private.fixture_id('opening',1),page,1) response from generate_series(1,3) page;
reset role;
drop table category_pairs_before;
create temporary table category_pairs_before as select distinct candidate_id,category_id from public.candidate_categories;
drop table category_interests_before;
create temporary table category_interests_before as select * from public.candidate_categories where kind='interest';
create temporary table category_profiles_before as select * from public.candidate_profiles;
create temporary table category_consents_before as select * from public.candidate_consents;
create temporary table category_parts_before as select * from public.participations;
create temporary table category_audit_before as select * from public.audit_events;
create temporary table category_catalog_before as select * from public.job_categories;
