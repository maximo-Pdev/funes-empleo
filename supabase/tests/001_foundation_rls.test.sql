begin;
select no_plan();
select has_table('public', 'accounts', 'T010: cuentas individuales');
select has_table('public', 'audit_events', 'T012: auditoría persistente');
select has_function('public', 'change_account_status', array['uuid','integer','text','text','boolean'], 'T016: transición atómica');
select ok((select relrowsecurity from pg_class where oid = 'public.accounts'::regclass), 'RLS en cuentas');
select ok(not has_table_privilege('authenticated','public.accounts','UPDATE'), 'No hay elevación directa de rol/estado');
select ok(not has_table_privilege('authenticated','public.audit_events','INSERT,UPDATE,DELETE'), 'Auditoría no es editable por API');
select ok(not has_table_privilege('anon','public.candidate_profiles','SELECT'), 'Sin padrón anónimo');
select ok(not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity), 'Todas las tablas públicas usan RLS');
select ok(not (select public from storage.buckets where id='candidate-cvs'), 'CV privado');
select is((select file_size_limit from storage.buckets where id='candidate-cvs'),5242880::bigint,'Límite demo 5 MiB');

-- Independent fictitious actors; no dependency on the acceptance seed.
insert into auth.users(id, email, raw_user_meta_data, raw_app_meta_data, email_confirmed_at)
values ('aa000000-0000-4000-8000-000000000001','tap-admin1@example.invalid','{}','{"portal_role":"admin"}',now()),
('aa000000-0000-4000-8000-000000000002','tap-admin2@example.invalid','{}','{"portal_role":"admin"}',now()),
('aa000000-0000-4000-8000-000000000003','tap-candidate@example.invalid','{"role":"candidate"}','{}',now()),
('aa000000-0000-4000-8000-000000000004','tap-company@example.invalid','{"role":"company"}','{}',now());
insert into auth.sessions(id,user_id) values
('cc000000-0000-4000-8000-000000000001','aa000000-0000-4000-8000-000000000001'),
('cc000000-0000-4000-8000-000000000002','aa000000-0000-4000-8000-000000000002'),
('cc000000-0000-4000-8000-000000000003','aa000000-0000-4000-8000-000000000003'),
('cc000000-0000-4000-8000-000000000004','aa000000-0000-4000-8000-000000000004'),
('cc000000-0000-4000-8000-000000000005',md5('funes-demo-v1:company:1')::uuid);
select throws_ok($$insert into auth.users(id,email,raw_user_meta_data) values(gen_random_uuid(),'escalation@example.invalid','{"role":"admin"}')$$,'P0001','INVALID_INPUT','Autorregistro admin rechazado');
insert into public.candidate_profiles(id,account_id,origin,display_name,status)
select 'bb000000-0000-4000-8000-000000000001',id,'self_service','Persona TAP ficticia','needs_update' from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000003';
insert into public.company_profiles(id,account_id,legal_name,cuit_normalized,responsible_name,email,activity,locality,status)
select 'bb000000-0000-4000-8000-000000000002',id,'Empresa TAP ficticia','30900000001','Responsable de prueba','company@example.invalid','Prueba','Funes','active'
from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000004';
insert into public.job_openings(id,company_id,title,tasks,requirements,vacancies,location,modality,schedule,contract_type,closing_date,status,published_at)
values('bb000000-0000-4000-8000-000000000003','bb000000-0000-4000-8000-000000000002','Oferta TAP','Tareas ficticias','Requisitos ficticios',1,'Funes','onsite','Horario','fixed_term',current_date+30,'published',now());
set local role authenticated;
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id=auth.uid()),1,'suspend','motivo',true)$$,'P0001','FORBIDDEN','No autosuspensión');
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000002'),1,'suspend','',true)$$,'P0001','INVALID_INPUT','Motivo obligatorio');
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000002'),1,'suspend','motivo',false)$$,'P0001','INVALID_INPUT','Confirmación obligatoria');
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000002'),1,'suspend','motivo ficticio',true)$$,'Un admin suspende a otro');
select is((select count(*) from public.accounts where role='admin' and status='active' and auth_user_id::text like 'aa000000-%'),1::bigint,'Permanece al menos un administrador TAP activo');
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id=auth.uid()),1,'suspend','motivo ficticio',true)$$,'P0001','FORBIDDEN','El último administrador no puede suspenderse');
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000002'),1,'reactivate','motivo',true)$$,'P0001','CONFLICT_STALE_DATA','Versión obsoleta no escribe');
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000002'),2,'reactivate','motivo',true)$$,'Reactivación conserva identidad');
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000002'),3,'archive','motivo',true)$$,'P0001','INVALID_TRANSITION','Admin no se archiva');
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000003'),1,'suspend','motivo',true)$$,'Suspender candidato');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000003","session_id":"cc000000-0000-4000-8000-000000000003"}',true);
select is((select count(*) from public.candidate_profiles),0::bigint,'Candidato suspendido no conserva acceso con JWT vivo');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000003'),2,'reactivate','motivo',true)$$,'Reactivar candidato');
select is((select status::text from public.candidate_profiles where id='bb000000-0000-4000-8000-000000000001'),'needs_update','Reactivación conserva estado del perfil');
select ok(exists(select 1 from public.audit_events where action='account_suspended' and actor_account_id=(select id from public.accounts where auth_user_id=auth.uid())),'Actor individual en auditoría');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000003","session_id":"cc000000-0000-4000-8000-000000000003"}',true);
select is((select count(*) from public.accounts),1::bigint,'Candidato solo ve su cuenta sin motivos');
select is((select count(*) from public.internal_notes),0::bigint,'Candidato no ve notas internas');
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id=auth.uid()),3,'archive',null,true)$$,'Archivo propio inmediato');
select is((select count(*) from public.candidate_profiles),0::bigint,'Archivado sin acceso privado aun con JWT');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000003'),4,'restore','motivo',true)$$,'Restauración municipal');
select is((select status::text from public.candidate_profiles where id='bb000000-0000-4000-8000-000000000001'),'draft','Restauración segura');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000004","session_id":"cc000000-0000-4000-8000-000000000004"}',true);
select throws_ok($$select public.change_account_status((select id from public.accounts where auth_user_id=auth.uid()),1,'suspend','motivo',true)$$,'P0001','FORBIDDEN','Empresa no puede suspender cuentas');
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id=auth.uid()),1,'archive',null,true)$$,'Empresa puede archivar su propia cuenta');
select is((select count(*) from public.company_profiles),0::bigint,'Empresa archivada pierde acceso a su perfil');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
reset role;
select is((select archive_reason from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000004'),'self_requested','Archivo propio conserva motivo codificado');
set local role authenticated;
select is((select status::text from public.job_openings where id='bb000000-0000-4000-8000-000000000003'),'published','Archivo no elimina oferta');
select ok((select archived_at is not null from public.job_openings where id='bb000000-0000-4000-8000-000000000003'),'Oferta queda archivada');
select lives_ok($$select public.change_account_status((select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000004'),2,'restore','Solicitud validada',true)$$,'Solo la Oficina restaura la empresa');
select is((select status::text from public.company_profiles where id='bb000000-0000-4000-8000-000000000002'),'incomplete','Empresa restaurada requiere completar perfil');
select is((select status::text from public.job_openings where id='bb000000-0000-4000-8000-000000000003'),'draft','La oferta no se republica automáticamente');
select ok((select archived_at is null from public.job_openings where id='bb000000-0000-4000-8000-000000000003'),'La oferta restaurada conserva acceso solo como borrador');
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000099"}',true);
select is((select count(*) from public.accounts),0::bigint,'Un JWT con sesión inexistente no conserva acceso RLS');
select throws_ok($$select public.change_account_status('aa000000-0000-4000-8000-000000000002',3,'suspend','motivo',true)$$,'P0001','AUTH_REQUIRED','Un JWT revocado no permite mutaciones');
select set_config('request.jwt.claim.sub',md5('funes-demo-v1:company:1')::uuid::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',md5('funes-demo-v1:company:1')::uuid::text,'session_id','cc000000-0000-4000-8000-000000000005')::text,true);
select ok(private.can_read_cv_path(md5('funes-demo-v1:profile:1')::uuid::text||'/'||md5('funes-demo-v1:cv:1')::uuid::text||'.pdf'),'Empresa con derivación accede al CV exacto');
select ok(not private.can_read_cv_path(md5('funes-demo-v1:profile:11')::uuid::text||'/'||md5('funes-demo-v1:cv:11')::uuid::text||'.pdf'),'Empresa no accede a CV no derivado');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
select lives_ok($$select public.change_account_status(md5('funes-demo-v1:company:1')::uuid,1,'suspend','motivo ficticio',true)$$,'Suspender empresa revoca accesos');
select is((select access_status::text from public.referrals where id=md5('funes-demo-v1:referral:1')::uuid),'revoked','Derivación queda revocada');
select set_config('request.jwt.claim.sub',md5('funes-demo-v1:company:1')::uuid::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',md5('funes-demo-v1:company:1')::uuid::text,'session_id','cc000000-0000-4000-8000-000000000005')::text,true);
select ok(not private.can_read_cv_path(md5('funes-demo-v1:profile:1')::uuid::text||'/'||md5('funes-demo-v1:cv:1')::uuid::text||'.pdf'),'Suspensión deniega CV inmediatamente');
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
select lives_ok($$select public.change_account_status(md5('funes-demo-v1:company:1')::uuid,2,'reactivate','motivo ficticio',true)$$,'Reactivar cuenta empresarial');
select is((select status::text from public.company_profiles where id=md5('funes-demo-v1:business:1')::uuid),'incomplete','Empresa reactivada vuelve a perfil incompleto');
select is((select status::text from public.job_openings where id=md5('funes-demo-v1:opening:1')::uuid),'suspended','Reactivación no republica oferta');
select is((select access_status::text from public.referrals where id=md5('funes-demo-v1:referral:1')::uuid),'revoked','Reactivación no restaura derivación');
reset role;
select throws_ok($$update public.audit_events set action='account_suspended'$$,'P0001','APPEND_ONLY','Historia inmutable incluso mediante acceso directo');
select throws_ok($$insert into public.job_categories(code,name,version) values('TAP','Prueba',1),('TAP','Otra',1)$$,'23505',null,'Catálogo no duplica versión/código');
insert into public.job_categories(code,name,version,active) values('INACTIVE-TAP','Categoría provisoria ficticia',1,false);
select ok((select not active from public.job_categories where code='INACTIVE-TAP'),'La categoría puede desactivarse sin borrarse');
select throws_ok($$insert into public.cv_documents(candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by)
values('bb000000-0000-4000-8000-000000000001','visible/cv.pdf','cv.pdf','application/pdf',100,repeat('0',64),'valid','test',(select id from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000001'))$$,'23514',null,'Ruta de CV debe usar dos UUID opacos');
select ok(not has_function_privilege('authenticated','public.reserve_administrator_invitation(text,uuid)','EXECUTE'),'Cliente público no reserva invitaciones administrativas');
select ok(has_function_privilege('service_role','public.reserve_administrator_invitation(text,uuid)','EXECUTE'),'Solo cliente secreto reserva invitaciones');
select lives_ok($$select public.reserve_administrator_invitation('admin-invitado@example.invalid',md5('funes-demo-v1:admin:1')::uuid)$$,'Reserva administrativa controlada');
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
values('aa000000-0000-4000-8000-000000000006','admin-invitado@example.invalid',
 jsonb_build_object('portal_invitation',(select token::text from private.admin_invitations where email_hash=encode(extensions.digest('admin-invitado@example.invalid','sha256'),'hex') limit 1)),'{}');
select is((select role::text from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000006'),'admin','Invitación válida crea identidad admin individual');
select is((select status::text from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000006'),'pending_verification','Invitación exige verificación antes de operar');
select ok(exists(select 1 from public.audit_events where entity_id='aa000000-0000-4000-8000-000000000006' and action='admin_provisioned'
 and actor_account_id=md5('funes-demo-v1:admin:1')::uuid),'Aprovisionamiento conserva actor administrador');
update auth.users set email_confirmed_at=now() where id='aa000000-0000-4000-8000-000000000006';
select is((select status::text from public.accounts where auth_user_id='aa000000-0000-4000-8000-000000000006'),'active','Verificación activa la nueva identidad individual');
insert into public.cv_documents(id,candidate_id,storage_path,original_name_safe,mime_type,byte_size,sha256,status,validation_result,uploaded_by)
values('dd000000-0000-4000-8000-000000000001','bb000000-0000-4000-8000-000000000001',
 'bb000000-0000-4000-8000-000000000001/dd000000-0000-4000-8000-000000000001.pdf',
 'cv-ficticio.pdf','application/pdf',608,repeat('0',64),'valid','fictitious_fixture','aa000000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000003","session_id":"cc000000-0000-4000-8000-000000000003"}',true);
select ok(has_table_privilege('authenticated','storage.objects','INSERT'),'Storage acepta insert mediante política RLS');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',
 'bb000000-0000-4000-8000-000000000001/dd000000-0000-4000-8000-000000000001.pdf',
 '{"size":0,"mimetype":"application/pdf"}')$$,'42501',null,'CV vacío rechazado aunque metadato de CV declare 608 bytes');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',
 'bb000000-0000-4000-8000-000000000001/dd000000-0000-4000-8000-000000000001.pdf',
 '{"size":608,"mimetype":"text/plain"}')$$,'42501',null,'MIME real de Storage debe ser PDF');
select throws_ok($$insert into storage.objects(bucket_id,name,metadata) values('candidate-cvs',
 'bb000000-0000-4000-8000-000000000001/dd000000-0000-4000-8000-000000000001.pdf',
 '{"size":100,"mimetype":"application/pdf"}')$$,'42501',null,'Tamaño real debe coincidir con metadato validado');
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','aa000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"aa000000-0000-4000-8000-000000000001","session_id":"cc000000-0000-4000-8000-000000000001"}',true);
select lives_ok($$select public.change_account_status('aa000000-0000-4000-8000-000000000002',3,'suspend','motivo ficticio',true)$$,'Reducir administradores activos: segundo TAP');
select lives_ok($$select public.change_account_status(md5('funes-demo-v1:admin:1')::uuid,1,'suspend','motivo ficticio',true)$$,'Reducir administradores activos: seed 1');
select lives_ok($$select public.change_account_status(md5('funes-demo-v1:admin:2')::uuid,1,'suspend','motivo ficticio',true)$$,'Reducir administradores activos: seed 2');
select lives_ok($$select public.change_account_status(md5('funes-demo-v1:admin:3')::uuid,1,'suspend','motivo ficticio',true)$$,'Reducir administradores activos: seed 3');
select lives_ok($$select public.change_account_status(md5('funes-demo-v1:admin:4')::uuid,1,'suspend','motivo ficticio',true)$$,'Reducir administradores activos: seed 4');
select lives_ok($$select public.change_account_status('aa000000-0000-4000-8000-000000000006',2,'suspend','motivo ficticio',true)$$,'Reducir administradores activos: invitado');
select is((select count(*) from public.accounts where role='admin' and status='active'),1::bigint,'Queda exactamente un administrador activo');
select throws_ok($$select public.change_account_status('aa000000-0000-4000-8000-000000000001',1,'suspend','motivo ficticio',true)$$,'P0001','FORBIDDEN','No se puede suspender al último administrador');
select is((select count(*) from public.accounts where role='admin' and status='active'),1::bigint,'El fallo no escribe un estado sin administradores');
reset role;
select * from finish();
rollback;
