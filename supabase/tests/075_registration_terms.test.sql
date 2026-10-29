-- Execute only against an isolated migrated database; transaction-local fictitious rows.
begin;
select no_plan();
select has_table('private','registration_terms_receipts','Terms receipts have independent storage');
select is((select count(*) from private.registration_terms_receipts where account_id=private.fixture_id('candidate',1)),0::bigint,'No historical acceptance backfill');
select ok(not has_table_privilege('anon','private.registration_terms_receipts','select,insert,update,delete'),'Anonymous has no receipt access');
select ok(not has_table_privilege('authenticated','private.registration_terms_receipts','select,insert,update,delete'),'Authenticated callers cannot forge receipts');
select ok(not has_table_privilege('service_role','private.registration_terms_receipts','insert,update,delete'),'API service role cannot mutate receipts directly');
select throws_ok($$select private.validate_registration_terms('{}',true)$$,'P0001','REGISTRATION_TERMS_REQUIRED','Public signup cannot omit acceptance');
select throws_ok($$select private.validate_registration_terms('{"registration_terms_accepted":false,"registration_terms_version":"demo-terms-draft-1"}',true)$$,'P0001','REGISTRATION_TERMS_REQUIRED','Unchecked rejected');
select throws_ok($$select private.validate_registration_terms('{"registration_terms_accepted":"true","registration_terms_version":"demo-terms-draft-1"}',true)$$,'P0001','REGISTRATION_TERMS_REQUIRED','String true is not boolean acceptance');
select throws_ok($$select private.validate_registration_terms('{"registration_terms_accepted":true,"registration_terms_version":"previous-draft"}',true)$$,'P0001','REGISTRATION_TERMS_REQUIRED','Unknown version rejected');
select is(private.validate_registration_terms('{}',false),false,'Trusted fixture/provisioning omission is not acceptance');
select is(private.validate_registration_terms('{"registration_terms_accepted":true,"registration_terms_version":"demo-terms-draft-1"}',true),true,'Explicit current version accepted');
select set_config('terms.consent_count',(select count(*)::text from public.candidate_consents),true);
select throws_ok($$insert into auth.users(id,email,raw_user_meta_data) values ('07500000-0000-4000-8000-000000000003','terms-invalid@example.invalid','{"role":"candidate","registration_terms_accepted":false,"registration_terms_version":"demo-terms-draft-1"}')$$,'P0001','REGISTRATION_TERMS_REQUIRED','Invalid signup metadata cannot create a receipt or account');
select is((select count(*) from public.accounts where auth_user_id='07500000-0000-4000-8000-000000000003'),0::bigint,'Rejected insertion rolls back existing account trigger too');
insert into auth.users(id,email,raw_user_meta_data) values ('07500000-0000-4000-8000-000000000004','terms-provisioned@example.invalid','{"role":"company"}');
update auth.users set raw_user_meta_data='{"role":"company","registration_terms_accepted":true,"registration_terms_version":"demo-terms-draft-1"}' where id='07500000-0000-4000-8000-000000000004';
select is((select count(*) from private.registration_terms_receipts where account_id='07500000-0000-4000-8000-000000000004'),0::bigint,'Updating a provisioned account never invents historical acceptance');
insert into auth.users(id,email,raw_user_meta_data) values
 ('07500000-0000-4000-8000-000000000001','terms-candidate@example.invalid','{"role":"candidate","registration_terms_accepted":true,"registration_terms_version":"demo-terms-draft-1"}'),
 ('07500000-0000-4000-8000-000000000002','terms-company@example.invalid','{"role":"company","registration_terms_accepted":true,"registration_terms_version":"demo-terms-draft-1"}');
select is((select count(*) from private.registration_terms_receipts where account_id in ('07500000-0000-4000-8000-000000000001','07500000-0000-4000-8000-000000000002')),2::bigint,'Both roles receive a receipt at insertion');
select ok(exists(select 1 from private.registration_terms_receipts where account_id='07500000-0000-4000-8000-000000000001' and role='candidate' and terms_version='demo-terms-draft-1' and accepted_at is not null),'Candidate receipt uses persisted role, version and server time');
select ok(exists(select 1 from private.registration_terms_receipts where account_id='07500000-0000-4000-8000-000000000002' and role='company'),'Company receipt retains its role');
update auth.users set raw_user_meta_data='{"role":"candidate","registration_terms_accepted":false}',email_confirmed_at=clock_timestamp() where id='07500000-0000-4000-8000-000000000001';
select is((select count(*) from private.registration_terms_receipts where account_id='07500000-0000-4000-8000-000000000001'),1::bigint,'Metadata edits and email verification never rewrite or duplicate acceptance');
select is((select terms_version from private.registration_terms_receipts where account_id='07500000-0000-4000-8000-000000000001'),'demo-terms-draft-1','Receipt survives mutable metadata');
select throws_ok($$update private.registration_terms_receipts set terms_version='previous-draft' where account_id='07500000-0000-4000-8000-000000000001'$$,'P0001','APPEND_ONLY','Receipts cannot be changed');
select throws_ok($$delete from private.registration_terms_receipts where account_id='07500000-0000-4000-8000-000000000001'$$,'P0001','APPEND_ONLY','Receipts cannot be deleted');
select is((select count(*)::text from public.candidate_consents),current_setting('terms.consent_count'),'Registration terms never create operational consent');
select * from finish();
rollback;
