begin;
select no_plan();
select has_function('public','match_opening_candidates',array['uuid','integer','integer'],'Matching administrativo disponible');
select is((select count(*) from public.job_categories where version=2),15::bigint,'Quince rubros amplios v2');
select is((select array_agg(name order by name) from public.job_categories where version=2 and active),
  (select array_agg(name order by name) from unnest(array['Administración','Atención al cliente y ventas','Comercio',
  'Gastronomía y hotelería','Limpieza','Construcción y oficios','Mantenimiento','Producción e industria',
  'Logística y depósito','Transporte y reparto','Salud y cuidados','Educación','Tecnología','Seguridad','Agro']) name),
  'Catálogo exacto aprobado, sin omisiones');
select is((select count(*) from public.job_categories where code in ('DEMO-A','DEMO-B') and version=1 and active),2::bigint,'Categorías anteriores conservadas');
select ok(not has_function_privilege('anon','public.match_opening_candidates(uuid,integer,integer)','EXECUTE'),'Anónimo sin acceso');

select set_config('test.match_opening',(select id::text from private.public_offer_rows order by id limit 1),true);
create temporary table match_candidates as
select candidate.id from public.candidate_profiles candidate where candidate.status='active' and candidate.archived_at is null
and private.current_consent(candidate.id)
and exists(select 1 from public.cv_documents cv where cv.candidate_id=candidate.id and cv.status='valid' and cv.archived_at is null)
and (candidate.account_id is null or exists(select 1 from public.accounts account where account.id=candidate.account_id and account.status='active'))
and not exists(select 1 from public.participations participation where participation.candidate_id=candidate.id
and participation.opening_id=current_setting('test.match_opening')::uuid and participation.archived_at is null)
order by candidate.id limit 12;
update public.candidate_profiles set availability='available',refresh_due_at=clock_timestamp()+interval '1 month'
where id in (select id from match_candidates);
insert into public.candidate_categories(candidate_id,category_id,kind)
select m.id,j.id,'occupation' from match_candidates m cross join public.job_categories j
where j.version=2 and j.code='ADMINISTRACION';
insert into public.candidate_categories(candidate_id,category_id,kind)
select m.id,j.id,'occupation' from match_candidates m cross join public.job_categories j
where j.version=2 and j.code='COMERCIO';
select set_config('test.match_opening',(select id::text from public.job_openings where status='published' and archived_at is null order by id limit 1),true);
select set_config('test.match_candidate',(select id::text from match_candidates order by id limit 1),true);
insert into public.opening_categories(opening_id,category_id)
select current_setting('test.match_opening')::uuid,id from public.job_categories
where version=2 and code in ('ADMINISTRACION','COMERCIO');
delete from public.opening_categories where opening_id=current_setting('test.match_opening')::uuid
and category_id not in (select id from public.job_categories where version=2);

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
('ee800000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
('ee800000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
('ee800000-0000-4000-8000-000000000003',private.fixture_id('candidate',1));
set local role authenticated;
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee800000-0000-4000-8000-000000000001')::text,true);
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','12','OR de rubros deduplica personas y clases');
select is(jsonb_array_length(public.match_opening_candidates(current_setting('test.match_opening')::uuid,3,5)->'items'),2,'Paginar después de filtrar');
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid,3,5)->>'total','12','Total independiente de página');
select is(jsonb_array_length(public.match_opening_candidates(current_setting('test.match_opening')::uuid,99,5)->'items'),0,'Página fuera de rango vacía');
select is(jsonb_array_length(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->'items'->0->'matchedCategories'),2,'Rubros compartidos sin duplicación por clase');
select ok(not ((public.match_opening_candidates(current_setting('test.match_opening')::uuid)->'items'->0) ?| array['dni','contacts','cvDocumentId','email','notes','score']),'Sin datos privados adicionales ni ranking');
select throws_ok($$select public.match_opening_candidates(null)$$,'P0001','INVALID_INPUT','UUID nulo rechazado');
select throws_ok($$select public.match_opening_candidates(current_setting('test.match_opening')::uuid,0)$$,'P0001','INVALID_INPUT','Página cero rechazada');
select throws_ok($$select public.match_opening_candidates(current_setting('test.match_opening')::uuid,1,51)$$,'P0001','INVALID_INPUT','Tamaño limitado');
select throws_ok($$select public.match_opening_candidates('00000000-0000-4000-8000-ffffffffffff')$$,'P0001','NOT_FOUND','Oferta inexistente');
reset role;

delete from public.candidate_categories where candidate_id=current_setting('test.match_candidate')::uuid
and category_id=(select id from public.job_categories where version=2 and code='ADMINISTRACION');
select set_config('test.baseline_participations',(select count(*)::text from public.participations),true);
select set_config('test.baseline_referrals',(select count(*)::text from public.referrals),true);
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','12','Basta uno de los dos rubros');
reset role;
update public.cv_documents set status='superseded',superseded_at=clock_timestamp()
where candidate_id=current_setting('test.match_candidate')::uuid and status='valid' and archived_at is null;
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','11','Sin CV válido excluido');
reset role;
update public.cv_documents set status='valid',superseded_at=null
where candidate_id=current_setting('test.match_candidate')::uuid and status='superseded' and archived_at is null;
update public.accounts set status='suspended',suspended_reason='Prueba ficticia A08',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1)
where id=(select account_id from public.candidate_profiles where id=current_setting('test.match_candidate')::uuid);
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','11','Cuenta candidata suspendida excluida');
reset role;
update public.accounts set status='active',suspended_reason=null,suspended_at=null,suspended_by=null
where id=(select account_id from public.candidate_profiles where id=current_setting('test.match_candidate')::uuid);
update public.candidate_profiles set availability='unavailable' where id=current_setting('test.match_candidate')::uuid;
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','11','No disponible excluido');
reset role;
update public.candidate_profiles set availability='available',refresh_due_at=clock_timestamp()-interval '1 second' where id=current_setting('test.match_candidate')::uuid;
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','11','Perfil vencido excluido sin mutación');
reset role;
update public.candidate_profiles set refresh_due_at=clock_timestamp()+interval '1 month' where id=current_setting('test.match_candidate')::uuid;
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
select id,'test-a08',repeat('0',64),'withdrawn',private.fixture_id('admin',1),'assisted' from match_candidates where id=current_setting('test.match_candidate')::uuid;
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','11','Último consentimiento retirado excluye');
reset role;
update public.job_openings set status='paused' where id=current_setting('test.match_opening')::uuid;
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'available','true','Pausada permite evaluación municipal');
reset role;
update public.job_categories set active=false where version=2 and code='COMERCIO';
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','11','Rubro desactivado no habilita coincidencia');
reset role;
update public.job_categories set active=true where version=2 and code='COMERCIO';
select set_config('test.existing_candidate',(select id::text from match_candidates
where id<>current_setting('test.match_candidate')::uuid order by id limit 1),true);
insert into public.participations(candidate_id,opening_id,origin,created_by,status)
select current_setting('test.existing_candidate')::uuid,current_setting('test.match_opening')::uuid,
'admin_nomination',private.fixture_id('admin',1),'under_review'
where not exists(select 1 from public.participations where candidate_id=current_setting('test.existing_candidate')::uuid
and opening_id=current_setting('test.match_opening')::uuid and archived_at is null);
select set_config('test.baseline_participations',(select count(*)::text from public.participations),true);
insert into public.candidate_categories(candidate_id,category_id,kind)
select private.fixture_id('profile',499),id,'occupation' from public.job_categories where version=2 and code='COMERCIO';
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','10','Participación existente se excluye antes del total');
select ok(not exists(select 1 from jsonb_array_elements(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->'items') item
where item->>'id'=current_setting('test.existing_candidate')),'Persona nominada no aparece en ninguna ficha');
reset role;
select set_config('test.assisted_candidate',(select id::text from match_candidates
where id not in (current_setting('test.match_candidate')::uuid,current_setting('test.existing_candidate')::uuid) order by id limit 1),true);
update public.candidate_profiles set account_id=null,managed_by_admin_id=private.fixture_id('admin',1),origin='assisted'
where id=current_setting('test.assisted_candidate')::uuid;
set local role authenticated;
select ok(exists(select 1 from jsonb_array_elements(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->'items') item
where item->>'id'=current_setting('test.assisted_candidate')),'Perfil asistido sin cuenta conserva elegibilidad');
reset role;
update public.company_profiles set status='suspended' where id=(select company_id from public.job_openings where id=current_setting('test.match_opening')::uuid);
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'available','false','Empresa suspendida inhabilita matching');
reset role;
update public.company_profiles set status='active' where id=(select company_id from public.job_openings where id=current_setting('test.match_opening')::uuid);
update public.job_openings set status='closed',closed_at=clock_timestamp() where id=current_setting('test.match_opening')::uuid;
set local role authenticated;
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'total','0','Cerrada sin candidatos');
select is(public.match_opening_candidates(current_setting('test.match_opening')::uuid)->>'available','false','Estado no habilitado explícito');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee800000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.match_opening_candidates(current_setting('test.match_opening')::uuid)$$,'P0001','FORBIDDEN','Empresa no consulta matching');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee800000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.match_opening_candidates(current_setting('test.match_opening')::uuid)$$,'P0001','FORBIDDEN','Candidato no consulta matching');
reset role;
update public.accounts set status='suspended',suspended_reason='Prueba ficticia A08',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1)
where id=private.fixture_id('admin',1);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee800000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.match_opening_candidates(current_setting('test.match_opening')::uuid)$$,'P0001','AUTH_REQUIRED','Administrador suspendido denegado');
reset role;
update public.accounts set status='active',suspended_reason=null,suspended_at=null,suspended_by=null where id=private.fixture_id('admin',1);
delete from auth.sessions where id='ee800000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee800000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.match_opening_candidates(current_setting('test.match_opening')::uuid)$$,'P0001','AUTH_REQUIRED','Sesión revocada denegada');
reset role;
select is((select count(*)::text from public.participations),current_setting('test.baseline_participations'),'Consulta no nomina');
select is((select count(*)::text from public.referrals),current_setting('test.baseline_referrals'),'Consulta no deriva');
select * from finish();
rollback;
