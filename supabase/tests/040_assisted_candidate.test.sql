begin;
select no_plan();
select has_function('public','save_assisted_candidate',array['uuid','integer','jsonb','uuid','text','text','text[]'],'Alta asistida atómica');
select has_function('public','claim_assisted_profile',array['uuid','integer','uuid','text','boolean','text'],'Vinculación presencial');
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee400000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee400000-0000-4000-8000-000000000002',private.fixture_id('candidate',1)),
 ('ee400000-0000-4000-8000-000000000003',private.fixture_id('company',1));
select set_config('test.assisted_data',jsonb_build_object('name','Persona asistida ficticia','dni','98000001','phone','3410000000',
 'email','','locality','Funes','summary','Experiencia ficticia','availability','available','detail','','address','',
 'categories',jsonb_build_array(private.fixture_id('category',1)),'interests',jsonb_build_array(private.fixture_id('category',2)))::text,true);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee400000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb)$$,'P0001','FORBIDDEN','Candidato no crea perfiles asistidos');
select throws_ok($$select public.screen_assisted_duplicates('98000001','')$$,'P0001','FORBIDDEN','Candidato no consulta duplicados');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee400000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb)$$,'P0001','FORBIDDEN','Empresa no crea perfiles asistidos');
select throws_ok($$select public.assisted_claim_requests(private.fixture_id('profile',1))$$,'P0001','FORBIDDEN','Empresa no ve solicitudes de cuenta');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee400000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb||'{"phone":""}')$$,'P0001','INVALID_INPUT','Alta exige contacto');
select set_config('test.assisted_id',(public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb)->>'candidateId'),true);
select is((select account_id from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),null::uuid,'Sin cuenta pública');
select is((select managed_by_admin_id from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),private.fixture_id('admin',1),'Responsable real de sesión');
select is((select origin from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'assisted','Origen asistido');
select is((select count(*) from public.cv_documents where candidate_id=current_setting('test.assisted_id')::uuid),0::bigint,'Alta sin CV');
select is((select count(*) from public.candidate_categories where candidate_id=current_setting('test.assisted_id')::uuid),2::bigint,'Categoría e interés preservados');
select throws_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,2,'activate')$$,'P0001','CONSENT_REQUIRED','Activación exige consentimiento');
select throws_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,1,'activate')$$,'P0001','CONFLICT_STALE_DATA','Conflicto de versión');
select lives_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,2,'accept_consent',
 (select version from public.candidate_consent_policy()),(select policy_hash from public.candidate_consent_policy()))$$,'Consentimiento presencial');
select is((select source from public.candidate_consents where candidate_id=current_setting('test.assisted_id')::uuid),'assisted','Consentimiento atribuido como asistido');
select lives_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,3,'activate')$$,'Activo sin PDF para atención interna');
select is((select status::text from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'active','Perfil activo sin CV');
select set_config('test.assisted_part',public.create_participation(current_setting('test.assisted_id')::uuid,4,private.fixture_id('opening',1),1,'admin_nomination')::text,true);
select throws_ok($$select public.transition_participation(current_setting('test.assisted_part')::uuid,1,'refer','Omisión justificada ficticia')$$,'P0001','VALID_CV_REQUIRED','Sin CV no hay derivación');
select is((select count(*) from public.referrals where candidate_id=current_setting('test.assisted_id')::uuid),0::bigint,'Derivación fallida no crea permiso');
select lives_ok($$select public.record_internal_note(current_setting('test.assisted_id')::uuid,4,null,'training_guidance','Orientación ficticia')$$,'Nota de capacitación libre e interna');
select is((select note_kind from public.internal_notes where candidate_id=current_setting('test.assisted_id')::uuid),'training_guidance','No crea catálogo de cursos');

select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee400000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.reserve_candidate_cv(current_setting('test.assisted_id')::uuid,5,'ee400000-0000-4000-8000-000000000077',
 current_setting('test.assisted_id')||'/ee400000-0000-4000-8000-000000000077.pdf','ficticio.pdf',100,repeat('a',64))$$,'P0001','NOT_FOUND','Candidato ajeno no reserva CV de un perfil sin cuenta');
select throws_ok($$select public.commit_candidate_cv(current_setting('test.assisted_id')::uuid,5,'ee400000-0000-4000-8000-000000000077',
 current_setting('test.assisted_id')||'/ee400000-0000-4000-8000-000000000077.pdf','ficticio.pdf',100,repeat('a',64))$$,'P0001','NOT_FOUND','Candidato ajeno no confirma CV de un perfil sin cuenta');
select throws_ok($$select public.create_participation(current_setting('test.assisted_id')::uuid,5,private.fixture_id('opening',2),1,'self_application')$$,
 'P0001','NOT_FOUND','Candidato ajeno no postula un perfil sin cuenta');
select throws_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,5,'activate')$$,'P0001','FORBIDDEN','Mantenimiento asistido exclusivo de administración');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee400000-0000-4000-8000-000000000001')::text,true);

-- Duplicate resolutions must be explicit and never mutate unspecified fields.
select set_config('test.matches',public.screen_assisted_duplicates('98.000.001','')::text,true);
select is((current_setting('test.matches')::jsonb->0->>'basis'),'dni','Coincidencia por DNI normalizado');
select set_config('test.review',current_setting('test.matches')::jsonb->0->>'reviewId',true);
select is(public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb)->>'status','duplicates','Alta duplicada bloqueada sin fusión');
select throws_ok($$select public.save_assisted_candidate(null,5,current_setting('test.assisted_data')::jsonb,current_setting('test.review')::uuid,'use_or_update_existing','',array[]::text[])$$,'P0001','INVALID_INPUT','Decisión exige motivo');
select set_config('test.private_version',(select version::text from public.candidate_private_data where candidate_id=current_setting('test.assisted_id')::uuid),true);
select is(public.save_assisted_candidate(null,5,current_setting('test.assisted_data')::jsonb||'{"name":"No sobrescribir"}',current_setting('test.review')::uuid,'use_or_update_existing','Misma persona ficticia',array[]::text[])->>'candidateId',current_setting('test.assisted_id'),'Usar mantiene ID');
select is((select display_name from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'Persona asistida ficticia','No sobrescribe nombre sin selección');
select is((select version::text from public.candidate_private_data where candidate_id=current_setting('test.assisted_id')::uuid),current_setting('test.private_version'),'No toca datos privados sin confirmación');
select ok((select status='resolved' and resolved_by=private.fixture_id('admin',1) and resolved_at is not null and reason='Misma persona ficticia' from public.duplicate_reviews where id=current_setting('test.review')::uuid),'Decisión conserva actor fecha y motivo');
select set_config('test.review',public.screen_assisted_duplicates('98000001','')->0->>'reviewId',true);
select set_config('test.category_history',(select jsonb_agg(jsonb_build_object('id',category_id,'at',created_at) order by category_id)::text from public.candidate_categories where candidate_id=current_setting('test.assisted_id')::uuid),true);
select is(public.save_assisted_candidate(null,5,current_setting('test.assisted_data')::jsonb||'{"name":"Nombre corregido ficticio","summary":"No autorizado"}',current_setting('test.review')::uuid,'use_or_update_existing','Solo corregir nombre',array['name'])->>'status','saved','Actualiza solo campo confirmado');
select is((select jsonb_agg(jsonb_build_object('id',category_id,'at',created_at) order by category_id)::text from public.candidate_categories where candidate_id=current_setting('test.assisted_id')::uuid),current_setting('test.category_history'),'Conserva categorías y fechas no seleccionadas');
select is((select display_name from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'Nombre corregido ficticio','Nombre confirmado actualizado');
select is((select skills_experience_summary from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'Experiencia ficticia','Resumen no confirmado preservado');
select set_config('test.review',public.screen_assisted_duplicates('98000001','')->0->>'reviewId',true);
select is(public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb,current_setting('test.review')::uuid,'correct_and_create','Falso positivo sin corregir',array[]::text[])->>'status','duplicates','Falso positivo exige corregir y revalidar');
select is((select status from public.duplicate_reviews where id=current_setting('test.review')::uuid),'pending','Revisión sigue pendiente si no se corrige');
select is(public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb||'{"dni":"98000002","email":"assisted-duplicate@example.invalid"}',current_setting('test.review')::uuid,'correct_and_create','Se corrigió identificador ficticio',array[]::text[])->>'status','saved','Falso positivo corregido crea separado');
select set_config('test.email_matches',public.screen_assisted_duplicates('98000003','ASSISTED-DUPLICATE@example.invalid')::text,true);
select is(current_setting('test.email_matches')::jsonb->0->>'basis','email','Email normalizado también detecta duplicado');
select is(public.save_assisted_candidate(null,null,current_setting('test.assisted_data')::jsonb,(current_setting('test.email_matches')::jsonb->0->>'reviewId')::uuid,'reject','Alta rechazada explícitamente',array[]::text[])->>'status','rejected','Rechazo explícito sin nuevo perfil');

-- Verified candidate with a pending claim. Only fictional identity information.
reset role;
insert into auth.users(id,instance_id,aud,role,email,email_confirmed_at,raw_user_meta_data,raw_app_meta_data,created_at,updated_at)
 values('ee400000-0000-4000-8000-000000000099','00000000-0000-0000-0000-000000000000','authenticated','authenticated',
 'assisted-claim@example.invalid',clock_timestamp(),'{"role":"candidate","candidate_name":"Persona ficticia","candidate_dni":"98000001"}','{}',clock_timestamp(),clock_timestamp());
select set_config('test.claim_account',(select id::text from public.accounts where auth_user_id='ee400000-0000-4000-8000-000000000099'),true);
insert into auth.sessions(id,user_id) values('ee400000-0000-4000-8000-000000000098','ee400000-0000-4000-8000-000000000099');
set local role authenticated;
select set_config('request.jwt.claim.sub','ee400000-0000-4000-8000-000000000099',true);
select set_config('request.jwt.claims','{"sub":"ee400000-0000-4000-8000-000000000099","session_id":"ee400000-0000-4000-8000-000000000098"}',true);
select is(public.bootstrap_candidate('Persona ficticia','98000001'),'pending_in_person_claim','Registro no vincula remotamente');
select is((select count(*) from public.candidate_profiles where account_id=current_setting('test.claim_account')::uuid),0::bigint,'Registro no duplica perfil');
select throws_ok($$select public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000001',true,'Verificación presencial ficticia')$$,'P0001','FORBIDDEN','Candidato no puede vincularse');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee400000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000001',false,'Verificación presencial ficticia')$$,'P0001','INVALID_INPUT','Exige DNI exhibido sin copia');
select is(public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000009',true,'Verificación presencial ficticia'),'duplicate_review_required','DNI incompatible genera revisión');
select ok(exists(select 1 from public.duplicate_reviews where source_type='account_link' and source_id=current_setting('test.claim_account')::uuid and status='pending'),'Conflicto persistido');
reset role;
update auth.users set email_confirmed_at=null where id='ee400000-0000-4000-8000-000000000099';
set local role authenticated;
select throws_ok($$select public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000001',true,'Verificación presencial ficticia')$$,'P0001','INVALID_TRANSITION','Email sin verificar bloqueado');
reset role;
update auth.users set email_confirmed_at=clock_timestamp() where id='ee400000-0000-4000-8000-000000000099';
set local role authenticated;
select is(public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,private.fixture_id('candidate',1),'98000001',true,'Verificación presencial ficticia'),'duplicate_review_required','Cuenta con otro perfil bloqueada');
reset role;
insert into public.candidate_contacts(candidate_id,kind,value,normalized_value) values(private.fixture_id('profile',2),'email','assisted-claim@example.invalid','assisted-claim@example.invalid');
set local role authenticated;
select is(public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000001',true,'Verificación presencial ficticia'),'duplicate_review_required','Correo en otro perfil bloquea vinculación');
reset role;
update public.candidate_contacts set archived_at=clock_timestamp(),archived_by=private.fixture_id('admin',1) where candidate_id=private.fixture_id('profile',2) and value='assisted-claim@example.invalid';
set local role authenticated;
select throws_ok($$select public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000001',true,'')$$,'P0001','INVALID_INPUT','Resolver conflicto requiere motivo explícito');
select is(public.claim_assisted_profile(current_setting('test.assisted_id')::uuid,6,current_setting('test.claim_account')::uuid,'98000001',true,'Verificación presencial ficticia'),'linked','Vinculación presencial válida');
select is((select account_id from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),current_setting('test.claim_account')::uuid,'Mismo perfil vinculado');
select is((select origin from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'assisted','Conserva origen');
select is((select status::text from public.candidate_profiles where id=current_setting('test.assisted_id')::uuid),'active','Conserva estado');
select is((select count(*) from public.candidate_consents where candidate_id=current_setting('test.assisted_id')::uuid),1::bigint,'Conserva consentimiento');
select is((select count(*) from public.participations where candidate_id=current_setting('test.assisted_id')::uuid),1::bigint,'Conserva participaciones');
select is((select count(*) from public.internal_notes where candidate_id=current_setting('test.assisted_id')::uuid),1::bigint,'Conserva notas');
select ok(exists(select 1 from public.audit_events where entity_id=current_setting('test.assisted_id')::uuid and action='profile_linked' and actor_account_id=private.fixture_id('admin',1)),'Vinculación auditada por administrador');
select ok(not exists(select 1 from public.audit_events where metadata_safe::text like '%98000001%' or metadata_safe::text like '%assisted-claim%'),'Auditoría sin DNI ni correo');
select throws_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,7,null,
 (select version from public.candidate_consent_policy()),(select policy_hash from public.candidate_consent_policy()))$$,'P0001','INVALID_INPUT','Comando nulo nunca retira consentimiento');
select lives_ok($$select public.assisted_candidate_command(current_setting('test.assisted_id')::uuid,7,'withdraw_consent',
 (select version from public.candidate_consent_policy()),(select policy_hash from public.candidate_consent_policy()))$$,'Retiro asistido');
select is((select status::text from public.participations where id=current_setting('test.assisted_part')::uuid),'withdrawn','Retiro cierra nominación');
select ok(not has_table_privilege('authenticated','public.duplicate_reviews','UPDATE'),'No se reescriben decisiones directamente');
select * from finish();
rollback;
