-- Executable commands, not source inspection. Everything, including helpers,
-- fault trigger and synthetic preparation, is rolled back at the end.
begin;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee720000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee720000-0000-4000-8000-000000000002',private.fixture_id('candidate',1)),
 ('ee720000-0000-4000-8000-000000000003',private.fixture_id('company',1));

create function pg_temp.audit_snapshot() returns jsonb language plpgsql security definer as $$
declare t record; rows jsonb; result jsonb:='{}';
begin
 for t in select schemaname,tablename from pg_tables where schemaname in ('public','private')
   or (schemaname='auth' and tablename in ('users','identities','sessions')) order by 1,2 loop
   execute format('select coalesce(jsonb_agg(to_jsonb(r) order by to_jsonb(r)::text),''[]''::jsonb) from %I.%I r',t.schemaname,t.tablename) into rows;
   result:=result||jsonb_build_object(t.schemaname||'.'||t.tablename,rows);
 end loop;
 return result;
end $$;
create function pg_temp.audit_rows() returns jsonb language sql security definer as $$
 select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.audit_events a
$$;
create function pg_temp.audit_fault() returns trigger language plpgsql as $$
begin
 if current_setting('test.inject_audit',true)='yes' and new.action=current_setting('test.audit_action',true)
 then raise exception 'INJECTED_AUDIT_FAILURE'; end if;
 return new;
end $$;
create trigger test_audit_failure before insert on public.audit_events for each row execute function pg_temp.audit_fault();

create function pg_temp.audit_case(label text, command text, expected_action text, expected_actor uuid,
 expected_before text default null, expected_after text default null) returns setof text language plpgsql as $$
declare before_data jsonb; before_events jsonb; added jsonb; error_text text; passed boolean:=false;
begin
 before_data:=pg_temp.audit_snapshot(); before_events:=pg_temp.audit_rows();
 -- Successful command is observed then intentionally rolled back, so the fault
 -- run begins from exactly the same state and expected versions.
 begin
   execute command;
   select coalesce(jsonb_agg(e),'[]') into added from jsonb_array_elements(pg_temp.audit_rows()) e
   where not exists(select 1 from jsonb_array_elements(before_events) b where b->>'id'=e->>'id');
   passed:=true;
   raise exception using errcode='Z0720',message='ROLLBACK_SUCCESS_PROBE';
 exception when sqlstate 'Z0720' then null;
 when others then error_text:=sqlerrm;
 end;
 return next ok(passed,label||': comando real válido ('||coalesce(error_text,'OK')||')');
 return next ok(exists(select 1 from jsonb_array_elements(coalesce(added,'[]')) e
   where e->>'action'=expected_action and (e->>'actor_account_id')::uuid is not distinct from expected_actor
   and e->>'request_id' is not null and e->>'occurred_at' is not null
   and (expected_before is null or e->>'previous_state'=expected_before)
   and (expected_after is null or e->>'new_state'=expected_after)),label||': evento con actor, fecha, correlación y estados');
 return next ok(jsonb_array_length(coalesce(added,'[]'))>0 and not exists(
   select 1 from jsonb_array_elements(coalesce(added,'[]')) e where e->>'request_id' is null
   or e->>'occurred_at' is null or e->>'reason_text' is not null
   or ((e->'metadata_safe') - array['decision_id','version','count'])<>'{}'::jsonb
   or (e->>'actor_type'='system' and e->>'action' not in ('opening_auto_closed','no_company_response','post_hire_window_ended'))
 ),label||': todos los eventos conservan campos seguros y actor permitido');
 return next is(pg_temp.audit_snapshot(),before_data,label||': probe positivo restablecido');
 perform set_config('test.inject_audit','yes',true);
 perform set_config('test.audit_action',expected_action,true);
 error_text:=null;
 begin execute command; exception when others then error_text:=sqlerrm; end;
 perform set_config('test.inject_audit','no',true);
 return next is(error_text,'INJECTED_AUDIT_FAILURE',label||': alcanza la auditoría con falla inyectada');
 return next is(pg_temp.audit_snapshot(),before_data,label||': rollback integral negocio/permisos/historia');
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee720000-0000-4000-8000-000000000001')::text,true);
select * from pg_temp.audit_case('Suspensión', $$select public.change_account_status(private.fixture_id('candidate',10),1,'suspend','Motivo ficticio',true)$$,'account_suspended',private.fixture_id('admin',1),'active','suspended');
select * from pg_temp.audit_case('Archivo empresarial', $$select public.change_account_status(private.fixture_id('company',10),1,'archive','Motivo ficticio',true)$$,'account_archived',private.fixture_id('admin',1),'active','archived');
select * from pg_temp.audit_case('Moderación pausa', $$select public.transition_opening(private.fixture_id('opening',3),1,'pause','Motivo ficticio')$$,'opening_paused',private.fixture_id('admin',1),'published','paused');
select * from pg_temp.audit_case('Cancelación oferta', $$select public.transition_opening(private.fixture_id('opening',3),1,'cancel','Motivo ficticio')$$,'opening_cancelled',private.fixture_id('admin',1),'published','cancelled');
select * from pg_temp.audit_case('Cancelación participación', $$select public.transition_participation(private.fixture_id('participation',9),1,'cancel','Motivo ficticio')$$,'outcome_confirmed',private.fixture_id('admin',1),'referred','cancelled');
select * from pg_temp.audit_case('Nominación', $$select public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('opening',1),1,'admin_nomination')$$,'participation_created',private.fixture_id('admin',1));
select * from pg_temp.audit_case('Nota interna', $$select public.record_internal_note(private.fixture_id('profile',200),1,null,'training_guidance','Orientación ficticia')$$,'note_recorded',private.fixture_id('admin',1));
select * from pg_temp.audit_case('CSV filtrado', $$select public.export_admin_metrics('2026-09-01','2026-09-20',private.fixture_id('category',1))$$,'metrics_exported',private.fixture_id('admin',1));
select * from pg_temp.audit_case('Alta asistida', $$select public.save_assisted_candidate(null,null,'{"name":"Persona prueba auditoría","dni":"98999991","phone":"3410000000","email":"","locality":"Funes","summary":"Prueba ficticia","availability":"available","detail":"","address":"","categories":[],"interests":[]}'::jsonb)$$,'profile_created',private.fixture_id('admin',1));

select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee720000-0000-4000-8000-000000000002')::text,true);
select * from pg_temp.audit_case('Corrección perfil', $$select public.save_candidate_profile(1,'Persona ficticia 001','90000001','Funes','Prueba ficticia','available','','',array[private.fixture_id('category',1)])$$,'profile_updated',private.fixture_id('candidate',1));
select * from pg_temp.audit_case('Contacto candidato', $$select public.set_candidate_phone(1,'3410000000')$$,'profile_updated',private.fixture_id('candidate',1));
select * from pg_temp.audit_case('Retiro consentimiento', $$select public.change_candidate_consent(1,'withdrawn','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'consent_withdrawn',private.fixture_id('candidate',1));
select * from pg_temp.audit_case('Archivo propio', $$select public.change_account_status(private.fixture_id('candidate',1),1,'archive',null,true)$$,'account_archived',private.fixture_id('candidate',1),'active','archived');
select * from pg_temp.audit_case('Retiro postulación', $$select public.transition_participation(private.fixture_id('participation',501),1,'withdraw')$$,'outcome_confirmed',private.fixture_id('candidate',1),'referred','withdrawn');
select public.change_candidate_consent(1,'withdrawn','demo-not-approved',(select policy_hash from public.candidate_consent_policy()));
select * from pg_temp.audit_case('Aceptación consentimiento', $$select public.change_candidate_consent(2,'accepted','demo-not-approved',(select policy_hash from public.candidate_consent_policy()))$$,'consent_accepted',private.fixture_id('candidate',1));

reset role;
-- Auth-provider boundary: SQL trigger, real reserved invitation, no email sent.
select public.reserve_administrator_invitation('audit-admin@example.invalid',private.fixture_id('admin',1));
select * from pg_temp.audit_case('Aprovisionamiento individual', $$insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 values('ee720000-0000-4000-8000-000000000010','audit-admin@example.invalid',
 jsonb_build_object('portal_invitation',(select token::text from private.admin_invitations where email_hash=encode(extensions.digest('audit-admin@example.invalid','sha256'),'hex'))),'{}')$$,
 'admin_provisioned',private.fixture_id('admin',1),null,'pending_verification');
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values('ee720000-0000-4000-8000-000000000011','audit-verify@example.invalid','{"role":"candidate"}','{}');
select * from pg_temp.audit_case('Verificación cuenta', $$update auth.users set email_confirmed_at=clock_timestamp() where id='ee720000-0000-4000-8000-000000000011'$$,
 'account_verified','ee720000-0000-4000-8000-000000000011','pending_verification','active');

select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee720000-0000-4000-8000-000000000001')::text,true);
set local role authenticated;
select public.change_account_status(private.fixture_id('candidate',10),1,'suspend','Motivo ficticio',true);
select * from pg_temp.audit_case('Reactivación', $$select public.change_account_status(private.fixture_id('candidate',10),2,'reactivate','Motivo ficticio',true)$$,'account_reactivated',private.fixture_id('admin',1),'suspended','active');
select public.change_account_status(private.fixture_id('company',10),1,'archive','Motivo ficticio',true);
select * from pg_temp.audit_case('Restauración empresa', $$select public.change_account_status(private.fixture_id('company',10),2,'restore','Motivo ficticio',true)$$,'account_restored',private.fixture_id('admin',1),'archived','active');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee720000-0000-4000-8000-000000000002')::text,true);
select public.change_account_status(private.fixture_id('candidate',1),1,'archive',null,true);
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee720000-0000-4000-8000-000000000001')::text,true);
select * from pg_temp.audit_case('Restauración candidato', $$select public.change_account_status(private.fixture_id('candidate',1),2,'restore','Motivo ficticio',true)$$,'account_restored',private.fixture_id('admin',1),'archived','active');
select * from pg_temp.audit_case('Contacto municipal', $$select public.record_contact(private.fixture_id('participation',9),1,'phone','outbound',clock_timestamp(),'Contacto ficticio')$$,'contact_recorded',private.fixture_id('admin',1));
select * from pg_temp.audit_case('Cierre oferta', $$select public.transition_opening(private.fixture_id('opening',3),1,'close','Motivo ficticio')$$,'opening_closed',private.fixture_id('admin',1),'published','closed');
select * from pg_temp.audit_case('Suspensión oferta', $$select public.transition_opening(private.fixture_id('opening',3),1,'suspend','Motivo ficticio')$$,'opening_suspended',private.fixture_id('admin',1),'published','suspended');
select public.transition_opening(private.fixture_id('opening',3),1,'suspend','Motivo ficticio');
select * from pg_temp.audit_case('Restauración oferta', $$select public.transition_opening(private.fixture_id('opening',3),2,'restore_to_draft','Motivo ficticio')$$,'opening_restored',private.fixture_id('admin',1),'suspended','draft');
select public.transition_opening(private.fixture_id('opening',4),1,'pause','Motivo ficticio');
select * from pg_temp.audit_case('Reanudación oferta', $$select public.transition_opening(private.fixture_id('opening',4),2,'resume')$$,'opening_resumed',private.fixture_id('admin',1),'paused','published');
reset role;
update public.job_openings set status='pending_review' where id=private.fixture_id('opening',80);
set local role authenticated;
select * from pg_temp.audit_case('Aprobación oferta', $$select public.transition_opening(private.fixture_id('opening',80),2,'approve')$$,'opening_approved',private.fixture_id('admin',1),'pending_review','published');
select * from pg_temp.audit_case('Corrección oferta', $$select public.transition_opening(private.fixture_id('opening',80),2,'request_changes',null,'Corregir datos ficticios')$$,'opening_changes_requested',private.fixture_id('admin',1),'pending_review','changes_requested');
select * from pg_temp.audit_case('Rechazo oferta', $$select public.transition_opening(private.fixture_id('opening',80),2,'reject','Motivo interno ficticio','Respuesta pública ficticia')$$,'opening_rejected',private.fixture_id('admin',1),'pending_review','rejected');
select set_config('test.audit_part',public.create_participation(private.fixture_id('profile',200),1,private.fixture_id('opening',1),1,'admin_nomination')::text,true);
select * from pg_temp.audit_case('Avance de revisión', $$select public.transition_participation(current_setting('test.audit_part')::uuid,1,'preinterview')$$,'participation_advanced',private.fixture_id('admin',1),'under_review','preinterview');
select * from pg_temp.audit_case('Salto justificado', $$select public.transition_participation(current_setting('test.audit_part')::uuid,1,'preselect','Motivo ficticio del salto')$$,'stage_skipped',private.fixture_id('admin',1),'under_review','preselected');
select * from pg_temp.audit_case('Preentrevista', $$select public.record_preinterview(current_setting('test.audit_part')::uuid,1,'in_person',null,clock_timestamp(),'Resumen ficticio','preselect','Motivo ficticio del salto')$$,'preinterview_recorded',private.fixture_id('admin',1),null,'preselect');
select * from pg_temp.audit_case('Derivación y permiso', $$select public.transition_participation(current_setting('test.audit_part')::uuid,1,'refer','Motivo ficticio del salto')$$,'referral_created',private.fixture_id('admin',1),null,'active');
select public.record_contact(private.fixture_id('participation',9),1,'phone','outbound',clock_timestamp(),'Resultado ficticio');
select * from pg_temp.audit_case('Contratación', $$select public.transition_participation(private.fixture_id('participation',9),2,'hire',null,null,null,(select id from public.contact_events where participation_id=private.fixture_id('participation',9) limit 1))$$,'outcome_confirmed',private.fixture_id('admin',1),'referred','hired');
select * from pg_temp.audit_case('No seleccionado', $$select public.transition_participation(private.fixture_id('participation',9),2,'not_select',null,null,null,(select id from public.contact_events where participation_id=private.fixture_id('participation',9) limit 1))$$,'outcome_confirmed',private.fixture_id('admin',1),'referred','not_selected');

-- Three duplicate decisions use the same pending review; each probe rolls back.
select set_config('test.audit_data','{"name":"Persona ficticia","dni":"90000200","email":"candidate200@example.invalid","phone":"","locality":"Funes","summary":"Ficticio","availability":"available","detail":"","address":"","categories":[],"interests":[]}',true);
select set_config('test.audit_review',(public.screen_assisted_duplicates('90000200','candidate200@example.invalid')->0->>'reviewId'),true);
select * from pg_temp.audit_case('Duplicado usar existente', $$select public.save_assisted_candidate(null,1,current_setting('test.audit_data')::jsonb,current_setting('test.audit_review')::uuid,'use_or_update_existing','Misma persona ficticia',array[]::text[])$$,'duplicate_resolved',private.fixture_id('admin',1),'pending','resolved');
select * from pg_temp.audit_case('Duplicado corregir y crear', $$select public.save_assisted_candidate(null,null,current_setting('test.audit_data')::jsonb||'{"dni":"98777771","email":"audit-new@example.invalid"}',current_setting('test.audit_review')::uuid,'correct_and_create','Falso positivo ficticio',array[]::text[])$$,'duplicate_resolved',private.fixture_id('admin',1),'pending','resolved');
select * from pg_temp.audit_case('Duplicado rechazar', $$select public.save_assisted_candidate(null,null,current_setting('test.audit_data')::jsonb,current_setting('test.audit_review')::uuid,'reject','Rechazo ficticio',array[]::text[])$$,'duplicate_resolved',private.fixture_id('admin',1),'pending','resolved');

select public.reserve_candidate_cv(private.fixture_id('profile',200),1,'ee720000-0000-4000-8000-000000000020',private.fixture_id('profile',200)::text||'/ee720000-0000-4000-8000-000000000020.pdf','cv.pdf',1426,repeat('1',64));
reset role;
-- Transactional Storage metadata fixture only; HTTP tests validate actual bytes.
insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',private.fixture_id('profile',200)::text||'/ee720000-0000-4000-8000-000000000020.pdf','{"size":1426,"mimetype":"application/pdf"}');
set local role authenticated;
select * from pg_temp.audit_case('CV nueva versión', $$select public.commit_candidate_cv(private.fixture_id('profile',200),1,'ee720000-0000-4000-8000-000000000020',private.fixture_id('profile',200)::text||'/ee720000-0000-4000-8000-000000000020.pdf','cv.pdf',1426,repeat('1',64))$$,'cv_uploaded',private.fixture_id('admin',1),null,'valid');
select * from pg_temp.audit_case('CV reemplazo anterior', $$select public.commit_candidate_cv(private.fixture_id('profile',200),1,'ee720000-0000-4000-8000-000000000020',private.fixture_id('profile',200)::text||'/ee720000-0000-4000-8000-000000000020.pdf','cv.pdf',1426,repeat('1',64))$$,'cv_replaced',private.fixture_id('admin',1),'valid','superseded');

select set_config('test.audit_import',public.preview_candidate_import(repeat('7',64),'demo-candidates-v1','[{"name":"Persona CSV ficticia","dni":"96777771","email":"audit-import@example.invalid","phone":"","locality":"Funes","categories":["DEMO-A"],"summary":"Prueba","availability":"available","reference":"DEMO_1"}]')::text,true);
select * from pg_temp.audit_case('Importación confirmada', $$select public.confirm_candidate_import(current_setting('test.audit_import')::uuid,2,repeat('7',64),'demo-candidates-v1')$$,'import_confirmed',private.fixture_id('admin',1),'preview_ready','confirming');
-- Import completion failures intentionally retain a failed batch, never business rows.
select set_config('test.audit_candidates',(select count(*)::text from public.candidate_profiles),true);
select set_config('test.inject_audit','yes',true);
select set_config('test.audit_action','import_completed',true);
select is(public.confirm_candidate_import(current_setting('test.audit_import')::uuid,2,repeat('7',64),'demo-candidates-v1'),'failed','Falla del evento final conserva lote fallido');
select set_config('test.inject_audit','no',true);
select is((select count(*)::text from public.candidate_profiles),current_setting('test.audit_candidates'),'Falla de import_completed revierte todas las altas');
select is((select count(*) from public.import_rows where batch_id=current_setting('test.audit_import')::uuid and status='imported'),0::bigint,'Falla de import_completed no conserva filas importadas');
select ok(exists(select 1 from public.audit_events where entity_id=current_setting('test.audit_import')::uuid and action='import_failed' and actor_account_id=private.fixture_id('admin',1) and request_id is not null and occurred_at is not null and previous_state='confirming' and new_state='failed'),'Lote fallido conserva actor/fecha/estados/request ID');

select set_config('test.audit_assisted',(public.save_assisted_candidate(null,null,current_setting('test.audit_data')::jsonb||'{"dni":"98777772","email":"audit-claim@example.invalid"}')->>'candidateId'),true);
reset role;
insert into auth.users(id,email,email_confirmed_at,raw_app_meta_data,raw_user_meta_data) values(
 'ee720000-0000-4000-8000-000000000030','audit-claim@example.invalid',clock_timestamp(),'{}','{"role":"candidate","candidate_dni":"98777772"}');
insert into private.candidate_claim_requests(account_id,candidate_id) values('ee720000-0000-4000-8000-000000000030',current_setting('test.audit_assisted')::uuid);
set local role authenticated;
select * from pg_temp.audit_case('Vinculación presencial', $$select public.claim_assisted_profile(current_setting('test.audit_assisted')::uuid,2,'ee720000-0000-4000-8000-000000000030','98777772',true,'Verificación presencial ficticia')$$,'profile_linked',private.fixture_id('admin',1),'draft','draft');
reset role;
update public.participations set status='no_company_response' where id=private.fixture_id('participation',9);
update public.referrals set access_status='revoked',access_change_reason='no_company_response' where id=private.fixture_id('referral',9);
set local role authenticated;
select * from pg_temp.audit_case('Corrección tardía', $$select public.transition_participation(private.fixture_id('participation',9),3,'late_hire','Respuesta tardía ficticia',null,null,(select id from public.contact_events where participation_id=private.fixture_id('participation',9) limit 1))$$,'outcome_corrected',private.fixture_id('admin',1),'no_company_response','hired');
-- Restore this synthetic preparation for the independent company interview cases.
reset role;
update public.participations set status='referred' where id=private.fixture_id('participation',8);
insert into auth.sessions(id,user_id) values('ee720000-0000-4000-8000-000000000040',private.fixture_id('candidate',200));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',200)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',200),'session_id','ee720000-0000-4000-8000-000000000040')::text,true);
select * from pg_temp.audit_case('Postulación propia', $$select public.apply_to_opening(private.fixture_id('opening',2),1)$$,'participation_created',private.fixture_id('candidate',200),null,'received');
select * from pg_temp.audit_case('Disponibilidad', $$select public.save_candidate_profile(1,'Persona ficticia 200','90000200','Funes','Resumen ficticio','unavailable','No disponible','','{}')$$,'availability_changed',private.fixture_id('candidate',200),'active','unavailable');
reset role;
update public.candidate_profiles set status='draft' where id=private.fixture_id('profile',200);
set local role authenticated;
select * from pg_temp.audit_case('Activación perfil', $$select public.activate_candidate(2)$$,'profile_activated',private.fixture_id('candidate',200),'draft','active');
reset role;
update public.job_openings set status='draft' where id=private.fixture_id('opening',51);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee720000-0000-4000-8000-000000000003')::text,true);
select * from pg_temp.audit_case('Envío empresarial', $$select public.transition_opening(private.fixture_id('opening',51),2,'submit')$$,'opening_submitted',private.fixture_id('company',1),'draft','pending_review');
select * from pg_temp.audit_case('Feedback empresarial', $$select public.submit_company_feedback(private.fixture_id('referral',9),'hired','Resultado ficticio')$$,'feedback_recorded',private.fixture_id('company',1),null,'pending_admin');
select * from pg_temp.audit_case('Entrevista empresarial', $$select public.submit_company_interview(private.fixture_id('referral',8),2,'scheduled',clock_timestamp()+interval '1 day',null,'Entrevista ficticia')$$,'interview_recorded',private.fixture_id('company',1),null,'scheduled');
reset role;
-- Each automation event is the failure target, including after preceding events.
select * from pg_temp.audit_case('Cron cierre oferta', $$select private.run_daily_employment_maintenance('2027-02-01')$$,'opening_auto_closed',null,'published','closed');
select * from pg_temp.audit_case('Cron sin respuesta', $$select private.run_daily_employment_maintenance('2027-02-01')$$,'no_company_response',null,'referred','no_company_response');
select * from pg_temp.audit_case('Cron 720 horas', $$select private.run_daily_employment_maintenance('2027-02-01')$$,'post_hire_window_ended',null,'active','revoked');
select * from finish();
rollback;
