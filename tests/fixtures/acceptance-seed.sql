-- GENERATED TEST-ONLY acceptance fixture. Never load into hosted/demo/default environments.
-- Source: supabase/seed.sql; regenerate with tests/fixtures/generate-acceptance-seed.mjs --write.
do $guard$ begin
 if current_setting('funes.fixture_context',true) is distinct from 'isolated-local-acceptance'
 then raise exception 'LOCAL_ACCEPTANCE_REQUIRED'; end if;
end $guard$;
-- T021. EXCLUSIVELY FICTIONAL LOCAL DATA. Never load this fixture into a real-data project.
-- Stable IDs derive from a public fixture namespace; no municipal category is declared official.
-- Default interactive dataset: exactly 10 identities. Acceptance is generated from this template, never loaded by default.
create or replace function private.fixture_id(kind text,n integer) returns uuid language sql immutable set search_path='' as $$
 select md5('funes-demo-v1:'||kind||':'||n)::uuid
$$;
revoke all on function private.fixture_id(text,integer) from public,anon,authenticated,service_role;
do $$
declare i integer; aid uuid; cid uuid; oid uuid; pid uuid; stat public.participation_status; slot integer; opening_n integer;
 -- Generator replaces only this reviewed parameter block (EXTRA-017).
 administrators integer:=4; candidates integer:=500; companies integer:=50;
 openings integer:=100; participations integer:=1000; active_candidates integer:=400;
 published_openings integer:=80; vacancies integer:=2; fully_hired_openings integer:=20; partially_hired_openings integer:=10;
 t timestamptz:='2026-09-19 12:00:00+00'; admin_id uuid:=private.fixture_id('admin',1);
 cuit_base text; checksum integer; weights integer[]:=array[5,4,3,2,7,6,5,4,3,2]; j integer;
begin
 if exists(select 1 from public.accounts) then raise exception 'LOCAL_FIXTURE_REQUIRES_EMPTY_DATABASE'; end if;
 for i in 1..(administrators+candidates+companies) loop
   if i<=administrators then aid:=private.fixture_id('admin',i);
   elsif i<=administrators+candidates then aid:=private.fixture_id('candidate',i-administrators);
   else aid:=private.fixture_id('company',i-administrators-candidates); end if;
   insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_app_meta_data,raw_user_meta_data,confirmation_token,recovery_token,email_change_token_new,email_change)
   values(aid,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',
     case when i<=administrators then 'admin'||i when i<=administrators+candidates then 'candidate'||(i-administrators) else 'company'||(i-administrators-candidates) end||'@example.invalid',
     extensions.crypt('Fictitious-Local-Only-2026!',extensions.gen_salt('bf')),t,t,t,
     case when i<=administrators then '{"provider":"email","providers":["email"],"portal_role":"admin"}'::jsonb else '{"provider":"email","providers":["email"]}'::jsonb end,
     jsonb_build_object('role',case when i<=administrators then 'admin' when i<=administrators+candidates then 'candidate' else 'company' end),'','','','');
   insert into auth.identities(id,provider_id,user_id,identity_data,provider,last_sign_in_at,created_at,updated_at)
   values(gen_random_uuid(),aid::text,aid,jsonb_build_object('sub',aid::text,'email',case when i<=administrators then 'admin'||i when i<=administrators+candidates then 'candidate'||(i-administrators) else 'company'||(i-administrators-candidates) end||'@example.invalid','email_verified',true),'email',t,t,t);
 end loop;
 insert into public.job_categories(id,code,name,description,version) values
  (private.fixture_id('category',1),'DEMO-A','Categoría ficticia A','No es catálogo municipal',1),
  (private.fixture_id('category',2),'DEMO-B','Categoría ficticia B','No es catálogo municipal',1);
 for i in 1..candidates loop
   cid:=private.fixture_id('profile',i); aid:=private.fixture_id('candidate',i);
   insert into public.candidate_profiles(id,account_id,origin,display_name,locality,skills_experience_summary,availability,status,last_confirmed_at,refresh_due_at,activated_at,created_at)
   values(cid,aid,'self_service','Persona ficticia '||lpad(i::text,3,'0'),'Localidad de prueba','Habilidad ficticia común','available',
    case when i<=active_candidates then 'active'::public.candidate_status else 'needs_update'::public.candidate_status end,
    case when i<=active_candidates then t else t-interval '7 months' end,
    case when i<=active_candidates then t+interval '6 months' else t-interval '1 month' end,t,t);
   insert into public.candidate_private_data(candidate_id,dni_normalized,dni_display) values(cid,(90000000+i)::text,(90000000+i)::text);
   insert into public.candidate_contacts(id,candidate_id,kind,value,normalized_value,is_primary,verified_at)
   values(private.fixture_id('contact',i),cid,'email','candidate'||i||'@example.invalid','candidate'||i||'@example.invalid',true,t);
   insert into public.candidate_categories(candidate_id,category_id,kind,created_at) values(cid,private.fixture_id('category',1+(i%2)),'interest',t);
   insert into public.candidate_consents(id,candidate_id,policy_version,policy_hash,status,recorded_by,recorded_at,source)
   values(private.fixture_id('consent',i),cid,'demo-not-approved',repeat('0',64),'accepted',aid,t,'self_service');
   insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by,created_at)
   values(private.fixture_id('cv',i),cid,cid::text||'/'||private.fixture_id('cv',i)::text||'.pdf','cv-ficticio.pdf','application/pdf',1426,
    '1e6751c855dda6e8c69bfc5b4ba6d5efebffef6ea6cb7c3c10d697ed0d9ba397','valid','fictitious_fixture',aid,t);
   perform private.record_event('candidate_profiles',cid,'profile_created',null,case when i<=active_candidates then 'active' else 'needs_update' end,admin_id,'fictitious_fixture');
 end loop;
 for i in 1..companies loop
   cuit_base:='30'||lpad((90000000+i)::text,8,'0'); checksum:=0;
   for j in 1..10 loop checksum:=checksum+substring(cuit_base,j,1)::integer*weights[j]; end loop;
   checksum:=11-(checksum%11); if checksum=11 then checksum:=0; elsif checksum=10 then checksum:=9; end if;
   insert into public.company_profiles(id,account_id,legal_name,cuit_normalized,cuit_display,responsible_name,email,activity,locality,status,created_at)
   values(private.fixture_id('business',i),private.fixture_id('company',i),'Empresa ficticia '||lpad(i::text,2,'0'),cuit_base||checksum,cuit_base||checksum,'Responsable ficticio','company'||i||'@example.invalid','Actividad de prueba','Localidad de prueba','active',t);
 end loop;
 for i in 1..openings loop
   oid:=private.fixture_id('opening',i);
   insert into public.job_openings(id,company_id,title,tasks,requirements,vacancies,location,modality,schedule,contract_type,closing_date,status,published_at,closed_at,created_at)
   values(oid,private.fixture_id('business',1+((i-1)%companies)),'Oferta ficticia '||lpad(i::text,3,'0'),'Tareas ficticias','Requisitos ficticios',vacancies,'Localidad de prueba','onsite','Horario de prueba','fixed_term',
    case when i<=published_openings then '2026-12-31'::date else '2026-09-18'::date end,
    case when i<=published_openings then 'published'::public.opening_status else 'closed'::public.opening_status end,t-interval '10 days',case when i>published_openings then t-interval '1 day' end,t-interval '11 days');
   insert into public.opening_categories(opening_id,category_id,created_at) values(oid,private.fixture_id('category',1+(i%2)),t-interval '11 days');
 end loop;
 for i in 1..participations loop
   opening_n:=1+((i-1)/(participations/openings)); slot:=1+((i-1)%(participations/openings));
   cid:=private.fixture_id('profile',1+((i-1)%candidates));
   oid:=private.fixture_id('opening',opening_n); pid:=private.fixture_id('participation',i);
   stat:=case when (opening_n<=fully_hired_openings and slot<=vacancies)
     or (opening_n>fully_hired_openings and opening_n<=fully_hired_openings+partially_hired_openings and slot=1)
     then 'hired'::public.participation_status
     when slot=3 then 'not_selected'::public.participation_status when slot=4 then 'withdrawn'::public.participation_status
     else 'referred'::public.participation_status end;
   insert into public.participations(id,candidate_id,opening_id,origin,created_by,status,feedback_due_at,final_outcome_at,final_outcome_by,created_at)
   values(pid,cid,oid,'self_application',private.fixture_id('candidate',1+((i-1)%candidates)),stat,t+interval '29 days',case when stat in ('hired','not_selected','withdrawn') then t end,
     case when stat in ('hired','not_selected','withdrawn') then admin_id end,t-interval '5 days');
   insert into public.referrals(id,participation_id,candidate_id,referred_by,referred_at,access_status,consent_event_id,cv_document_id,feedback_due_at,post_hire_access_until,access_changed_actor_type,access_changed_by_account_id,access_change_reason)
   values(private.fixture_id('referral',i),pid,cid,admin_id,t-interval '1 day',
     case when stat in ('not_selected','withdrawn') then 'revoked'::public.referral_access_status else 'active'::public.referral_access_status end,
     private.fixture_id('consent',1+((i-1)%candidates)),private.fixture_id('cv',1+((i-1)%candidates)),t+interval '29 days',
     case when stat='hired' then t+interval '30 days' end,'account',admin_id,
     case when stat='not_selected' then 'not_selected' when stat='withdrawn' then 'application_withdrawn' else 'referral_created' end);
   perform private.record_event('participations',pid,'participation_created',null,'received',private.fixture_id('candidate',1+((i-1)%candidates)),'fictitious_fixture');
   perform private.record_event('participations',pid,'participation_advanced','received',stat::text,admin_id,'fictitious_fixture');
 end loop;
end; $$;
