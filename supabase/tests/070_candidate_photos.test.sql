-- Requires the versioned fictitious seed; transaction-local, no fixture reset.
-- Storage SQL rows below model object metadata, NOT physical Storage API deletion proof.
begin;
select no_plan();
select has_table('public','candidate_photos','Private persisted photo metadata');
select ok(not has_table_privilege('authenticated','public.candidate_photos','INSERT,UPDATE,DELETE'),'No direct metadata writes');
select ok(not has_function_privilege('authenticated','public.ingest_candidate_photo(uuid,uuid,uuid,uuid,integer,text,uuid,bigint,text)','EXECUTE'),'Untrusted caller cannot ingest');
select ok(not has_function_privilege('anon','public.ingest_candidate_photo(uuid,uuid,uuid,uuid,integer,text,uuid,bigint,text)','EXECUTE'),'Anonymous cannot ingest');
select ok(not (select public from storage.buckets where id='candidate-photos'),'Bucket is private');
grant execute on function private.fixture_id(text,integer) to authenticated,service_role;
grant usage on schema private to service_role;
insert into auth.sessions(id,user_id) values
 ('ee700000-0000-4000-8000-000000000001',private.fixture_id('candidate',5)),
 ('ee700000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
 ('ee700000-0000-4000-8000-000000000003',private.fixture_id('admin',1));
create function pg_temp.photo_actor() returns uuid language sql security definer set search_path='' as $$
 select id from public.accounts where auth_user_id=private.fixture_id('candidate',5)
$$;
grant execute on function pg_temp.photo_actor() to service_role,authenticated;
create function pg_temp.expected_company_photo() returns boolean language sql security definer set search_path='' as $$
 select exists(select 1 from public.referrals r where r.candidate_id=private.fixture_id('profile',5) and private.can_company_read_referral(r.id))
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',5)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',5)::text,'session_id','ee700000-0000-4000-8000-000000000001')::text,true);
select lives_ok($$select public.authorize_candidate_photo_mutation(private.fixture_id('profile',5),1)$$,'Owner preflight succeeds');
select throws_ok($$select public.authorize_candidate_photo_mutation(private.fixture_id('profile',6),1)$$,'P0001','NOT_FOUND','Owner cannot write another candidate');
select throws_ok($$select public.authorize_candidate_photo_mutation(private.fixture_id('profile',5),999)$$,'P0001','CONFLICT_STALE_DATA','Stale preflight fails');
reset role;
set local role service_role;
select lives_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),1,'prepare',private.fixture_id('photo',1),4,repeat('a',64))$$,'Trusted reservation');
select throws_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',6),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),1,'remove',null,0,'')$$,'P0001','AUTH_REQUIRED','Explicit actor/auth identity mismatch denied');
select throws_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),1,'commit',private.fixture_id('photo',1),4,repeat('a',64))$$,'P0001','INVALID_INPUT','Missing new object cannot replace old');
reset role;
insert into storage.objects(bucket_id,name,metadata) values('candidate-photos',private.fixture_id('profile',5)::text||'/'||private.fixture_id('photo',1)::text||'.webp','{"size":4,"mimetype":"image/webp"}');
set local role service_role;
select lives_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),1,'commit',private.fixture_id('photo',1),4,repeat('a',64))$$,'Commit current normalized photo');
select throws_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),1,'remove',null,0,'')$$,'P0001','CONFLICT_STALE_DATA','Stale removal cannot delete current');
reset role;
select is((select state from public.candidate_photos where id=private.fixture_id('photo',1)),'current','Current survives stale write');
set local role authenticated;
select is((select count(*) from public.candidate_photos),1::bigint,'Owner sees only current');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee700000-0000-4000-8000-000000000002')::text,true);
select is((select exists(select 1 from public.candidate_photos where candidate_id=private.fixture_id('profile',5))),
 pg_temp.expected_company_photo(),
 'Company photo visibility follows live referral projection');
select ok(pg_temp.expected_company_photo(),'Fixture has a qualifying live company referral');
reset role;
update public.referrals set access_status='revoked',access_changed_at=clock_timestamp(),access_changed_actor_type='account',
 access_changed_by_account_id=private.fixture_id('admin',1),access_change_reason='consent_withdrawn'
 where candidate_id=private.fixture_id('profile',5) and access_status='active';
set local role authenticated;
select is((select count(*) from public.candidate_photos),0::bigint,'Live revocation immediately hides the current company photo');
reset role;
set local role service_role;
select lives_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),2,'remove',null,0,'')$$,'Logical removal queues physical erasure');
select throws_ok($$select public.complete_candidate_photo_cleanup(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),private.fixture_id('photo',1))$$,'P0001','CLEANUP_NOT_COMPLETE','Queue cannot acknowledge while blob remains');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',5)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',5)::text,'session_id','ee700000-0000-4000-8000-000000000001')::text,true);
select is((select count(*) from public.candidate_photos),0::bigint,'Old photo immediately unreadable even to owner');
select ok(public.candidate_photo_cleanup_pending(private.fixture_id('profile',5)),'Durable pending flag survives refresh without current');
reset role;
select ok(exists(select 1 from storage.objects where bucket_id='candidate-photos' and name=private.fixture_id('profile',5)::text||'/'||private.fixture_id('photo',1)::text||'.webp'),'Logical commit did not pretend physical deletion');
select ok(exists(select 1 from public.audit_events where entity_id=private.fixture_id('photo',1) and action='photo_removed'),'Removal audited');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee700000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.authorize_candidate_photo_mutation(private.fixture_id('profile',5),3)$$,'P0001','FORBIDDEN','Administrator cannot mutate the owner photo');
reset role;
delete from auth.sessions where id='ee700000-0000-4000-8000-000000000001';
set local role service_role;
select throws_ok($$select public.ingest_candidate_photo(pg_temp.photo_actor(),private.fixture_id('candidate',5),'ee700000-0000-4000-8000-000000000001',private.fixture_id('profile',5),3,'prepare',private.fixture_id('photo',2),4,repeat('b',64))$$,'P0001','AUTH_REQUIRED','Trusted ingestion rejects a revoked originating session');
reset role;
select ok(not exists(select 1 from public.candidate_photos where id=private.fixture_id('photo',2)),'Revoked session created no reservation');
select * from finish();
rollback;
