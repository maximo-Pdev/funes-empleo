begin;
select no_plan();
select has_function('public','preview_candidate_import',array['text','text','jsonb','uuid'],'Preview protegida');
select has_function('public','confirm_candidate_import',array['uuid','integer','text','text'],'Confirmación atómica');
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee500000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee500000-0000-4000-8000-000000000002',private.fixture_id('candidate',1)),
 ('ee500000-0000-4000-8000-000000000003',private.fixture_id('company',1));
select set_config('test.import_row','{"name":"Persona CSV ficticia","dni":"96000001","email":"import@example.invalid","phone":"","locality":"Funes","categories":["DEMO-A"],"summary":"Prueba","availability":"available","reference":"DEMO_1"}',true);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee500000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.preview_candidate_import(repeat('a',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))$$,'P0001','FORBIDDEN','Candidato no importa');
select is((select count(*) from public.import_rows),0::bigint,'RLS candidato sin staging');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee500000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.preview_candidate_import(repeat('a',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))$$,'P0001','FORBIDDEN','Empresa no importa');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee500000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.preview_candidate_import(repeat('a',64),'historical-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))$$,'P0001','INVALID_INPUT','Mapeo histórico bloqueado');
select set_config('test.import_count',(select count(*)::text from public.candidate_profiles),true);
select set_config('test.batch',public.preview_candidate_import(repeat('a',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))::text,true);
select is((select count(*)::text from public.candidate_profiles),current_setting('test.import_count'),'Preview sin escrituras de negocio');
select is(public.import_batch_preview(current_setting('test.batch')::uuid)->>'status','preview_ready','Lista para confirmar');
select ok(position('96000001' in public.import_batch_preview(current_setting('test.batch')::uuid)::text)=0,'DNI enmascarado');
select ok(position('import@example.invalid' in public.import_batch_preview(current_setting('test.batch')::uuid)::text)=0,'Email enmascarado');
select throws_ok($$select public.confirm_candidate_import(current_setting('test.batch')::uuid,1,repeat('a',64),'demo-candidates-v1')$$,'P0001','CONFLICT_STALE_DATA','Versión obligatoria');
select throws_ok($$select public.confirm_candidate_import(current_setting('test.batch')::uuid,2,repeat('b',64),'demo-candidates-v1')$$,'P0001','INVALID_INPUT','Hash obligatorio');
select is(public.confirm_candidate_import(current_setting('test.batch')::uuid,2,repeat('a',64),'demo-candidates-v1'),'completed','Lote completo');
select is((select count(*) from public.candidate_profiles),current_setting('test.import_count')::bigint+1,'Solo una alta');
select is((select status::text from public.candidate_profiles where id=(select created_candidate_id from public.import_rows where batch_id=current_setting('test.batch')::uuid)),'draft','Sin activación inventada');
select is((select origin from public.candidate_profiles where id=(select created_candidate_id from public.import_rows where batch_id=current_setting('test.batch')::uuid)),'imported','Origen importado');
select throws_ok($$select public.confirm_candidate_import(current_setting('test.batch')::uuid,2,repeat('a',64),'demo-candidates-v1')$$,'P0001','CONFLICT_STALE_DATA','Doble confirmación denegada');
select throws_ok($$select public.preview_candidate_import(repeat('a',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))$$,'P0001','INVALID_TRANSITION','Hash completo no se reimporta');
select set_config('test.dup',public.preview_candidate_import(repeat('b',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))::text,true);
select is(public.import_batch_preview(current_setting('test.dup')::uuid)->>'status','blocked','Duplicado detectado');
select set_config('test.row',(select id::text from public.import_rows where batch_id=current_setting('test.dup')::uuid),true);
select set_config('test.target',(select created_candidate_id::text from public.import_rows where batch_id=current_setting('test.batch')::uuid),true);
select throws_ok($$select public.resolve_import_row(current_setting('test.dup')::uuid,2,current_setting('test.row')::uuid,'reject','',null,null,null,'{}')$$,'P0001','INVALID_INPUT','Decisión sin motivo rechazada');
select lives_ok($$select public.resolve_import_row(current_setting('test.dup')::uuid,2,current_setting('test.row')::uuid,'use_or_update_existing','Misma persona ficticia',null,current_setting('test.target')::uuid,3,'{}')$$,'Uso explícito sin sobrescritura');
select is(public.confirm_candidate_import(current_setting('test.dup')::uuid,3,repeat('b',64),'demo-candidates-v1'),'completed','Uso existente confirmado');
select is((select count(*) from public.candidate_profiles),current_setting('test.import_count')::bigint+1,'Uso existente no duplica');
select set_config('test.correct',public.preview_candidate_import(repeat('c',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))::text,true);
select lives_ok($$select public.resolve_import_row(current_setting('test.correct')::uuid,2,(select id from public.import_rows where batch_id=current_setting('test.correct')::uuid),'correct_and_create','Falso positivo ficticio',current_setting('test.import_row')::jsonb||'{"dni":"96000002","email":"other@example.invalid"}',null,null,'{}')$$,'Corregir falso positivo');
select is(public.confirm_candidate_import(current_setting('test.correct')::uuid,3,repeat('c',64),'demo-candidates-v1'),'completed','Separado tras revalidación');
select set_config('test.reject',public.preview_candidate_import(repeat('d',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb))::text,true);
select lives_ok($$select public.resolve_import_row(current_setting('test.reject')::uuid,2,(select id from public.import_rows where batch_id=current_setting('test.reject')::uuid),'reject','No incorporar',null,null,null,'{}')$$,'Rechazo explícito');
select is(public.import_batch_preview(current_setting('test.reject')::uuid)->>'status','blocked','Cero aceptadas bloquea');
select set_config('test.invalid',public.preview_candidate_import(repeat('e',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb||'{"dni":"96000003","email":"third@example.invalid","categories":["REAL-NOT-APPROVED"]}'))::text,true);
select is((select status::text from public.import_rows where batch_id=current_setting('test.invalid')::uuid),'unmapped_category','Categoría no aprobada bloquea');

-- Failure after a first insert proves business and per-profile audit roll back.
reset role;
create function pg_temp.fail_import_test() returns trigger language plpgsql as $$ begin
 if new.display_name='FAIL_IMPORT_TEST' then raise exception 'SIMULATED_PRIVATE_DETAIL'; end if; return new; end $$;
create trigger import_failure_test before insert on public.candidate_profiles for each row execute function pg_temp.fail_import_test();
set local role authenticated;
select set_config('test.fail',public.preview_candidate_import(repeat('f',64),'demo-candidates-v1',jsonb_build_array(
 current_setting('test.import_row')::jsonb||'{"dni":"96000004","email":"fourth@example.invalid"}',
 current_setting('test.import_row')::jsonb||'{"dni":"96000005","email":"fifth@example.invalid","name":"FAIL_IMPORT_TEST"}'))::text,true);
select set_config('test.before_fail',(select count(*)::text from public.candidate_profiles),true);
select is(public.confirm_candidate_import(current_setting('test.fail')::uuid,2,repeat('f',64),'demo-candidates-v1'),'failed','Error queda auditable');
select is((select count(*)::text from public.candidate_profiles),current_setting('test.before_fail'),'Rollback completo incluso primera fila');
select is(public.import_batch_preview(current_setting('test.fail')::uuid)->>'failure','IMPORT_FAILED','Error sanitizado');
select is((select count(*) from public.import_rows where batch_id=current_setting('test.fail')::uuid and status='imported'),0::bigint,'Sin filas parcialmente importadas');
select throws_ok($$select public.confirm_candidate_import(current_setting('test.fail')::uuid,5,repeat('f',64),'demo-candidates-v1')$$,'P0001','INVALID_TRANSITION','No reanudar lote fallido');
select set_config('test.retry',public.preview_candidate_import(repeat('1',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb||'{"dni":"96000006","email":"sixth@example.invalid"}'),current_setting('test.fail')::uuid)::text,true);
select is(public.import_batch_preview(current_setting('test.retry')::uuid)->>'retryOf',current_setting('test.fail'),'Nuevo intento vinculado');
select ok(not exists(select 1 from public.audit_events where entity_type='import_batches' and metadata_safe::text like '%example.invalid%'),'Auditoría sin PII');
select set_config('test.intra',public.preview_candidate_import(repeat('2',64),'demo-candidates-v1',jsonb_build_array(
 current_setting('test.import_row')::jsonb||'{"dni":"96000007","email":"seven@example.invalid"}',
 current_setting('test.import_row')::jsonb||'{"dni":"96000007","email":"seven@example.invalid"}'))::text,true);
select is((select count(*) from public.import_rows where batch_id=current_setting('test.intra')::uuid and 'INTRA_FILE_DUPLICATE'=any(error_codes)),2::bigint,'Ambas filas duplicadas identificadas');
select throws_ok($$update public.import_rows set status='valid' where batch_id=current_setting('test.intra')::uuid$$,'42501',null,'Sin UPDATE directo a staging');
select throws_ok($$delete from public.import_batches where id=current_setting('test.intra')::uuid$$,'42501',null,'Sin borrar historial');
select set_config('test.update',public.preview_candidate_import(repeat('3',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb||'{"name":"Nombre corregido ficticio"}'))::text,true);
select set_config('test.private_ver',(select version::text from public.candidate_private_data where candidate_id=current_setting('test.target')::uuid),true);
select set_config('test.category_time',(select created_at::text from public.candidate_categories where candidate_id=current_setting('test.target')::uuid limit 1),true);
select lives_ok($$select public.resolve_import_row(current_setting('test.update')::uuid,2,(select id from public.import_rows where batch_id=current_setting('test.update')::uuid),
 'use_or_update_existing','Solo nombre confirmado',null,current_setting('test.target')::uuid,3,array['name'])$$,'Actualización de un campo explícito');
select is(public.confirm_candidate_import(current_setting('test.update')::uuid,3,repeat('3',64),'demo-candidates-v1'),'completed','Parche confirmado');
select is((select display_name from public.candidate_profiles where id=current_setting('test.target')::uuid),'Nombre corregido ficticio','Nombre autorizado aplicado');
select is((select version::text from public.candidate_private_data where candidate_id=current_setting('test.target')::uuid),current_setting('test.private_ver'),'DNI no seleccionado ni tocado');
select is((select created_at::text from public.candidate_categories where candidate_id=current_setting('test.target')::uuid limit 1),current_setting('test.category_time'),'Categorías no seleccionadas intactas');
reset role;
update public.job_categories set active=false where code='DEMO-A';
set local role authenticated;
select set_config('test.inactive',public.preview_candidate_import(repeat('4',64),'demo-candidates-v1',jsonb_build_array(current_setting('test.import_row')::jsonb||'{"dni":"96000008","email":"eight@example.invalid"}'))::text,true);
select is((select status::text from public.import_rows where batch_id=current_setting('test.inactive')::uuid),'unmapped_category','Categoría desactivada bloqueada');
reset role;
update public.accounts set status='suspended',suspended_reason='Prueba',suspended_at=now(),suspended_by=private.fixture_id('admin',2) where id=private.fixture_id('admin',1);
set local role authenticated;
select throws_ok($$select public.import_batch_preview(current_setting('test.batch')::uuid)$$,'P0001','AUTH_REQUIRED','Sesión obsoleta de admin suspendido denegada');
select is((select count(*) from public.import_batches),0::bigint,'RLS niega lotes tras suspensión');
reset role;
set local role anon;
select throws_ok($$select public.import_batch_preview(current_setting('test.batch')::uuid)$$,'42501',null,'Anónimo sin RPC');
select * from finish();
rollback;
