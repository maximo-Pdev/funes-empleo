-- US3: company mutations remain RPC-only and private reasons never cross to company.
begin;
select no_plan();
select has_function('public','bootstrap_company',array['text','text','text','text','text','text','text'],'Alta empresarial verificada');
select has_function('public','save_company_profile',array['integer','text','text','text','text','text','text','text'],'Perfil empresarial protegido');
select has_function('public','save_company_opening',array['uuid','integer','text','text','text','integer','text','text','text','text','date','text','text','uuid[]'],'Borrador protegido');
select has_function('public','my_company_offers',array['integer','integer','uuid'],'Proyección propia sin motivos internos');
select ok(not has_table_privilege('authenticated','public.company_profiles','INSERT,UPDATE,DELETE'),'No hay escritura directa del perfil');
select ok(not has_table_privilege('authenticated','public.job_openings','INSERT,UPDATE,DELETE'),'No hay escritura directa de ofertas');
select ok(not has_table_privilege('anon','public.company_profiles','SELECT'),'Padrón empresarial privado');

grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee300000-0000-4000-8000-000000000001',private.fixture_id('company',1)),
 ('ee300000-0000-4000-8000-000000000002',private.fixture_id('company',2)),
 ('ee300000-0000-4000-8000-000000000003',private.fixture_id('admin',1));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,
 'session_id','ee300000-0000-4000-8000-000000000001')::text,true);
select is((public.my_company_offers(1,10,null)->>'total')::integer,2,'Empresa consulta solo sus dos ofertas del fixture');
select is((public.my_company_profile()->>'legalName'),'Empresa ficticia 01','Perfil propio disponible');
select is((select count(*) from public.company_profiles),0::bigint,'Sin lectura directa de perfiles por RLS');
select is((select count(*) from public.job_openings),0::bigint,'Sin lectura directa de ofertas por RLS');
select set_config('test.new_opening',(public.save_company_opening(null,null,'Oferta nueva ficticia','Tareas ficticias',
 'Requisitos ficticios',2,'Funes','Presencial','Jornada completa','Plazo fijo',
 (current_date+30)::date,null,null,array[private.fixture_id('category',1),private.fixture_id('category',2)])->>'id'),true);
select is((public.my_company_offers(1,10,current_setting('test.new_opening')::uuid)->'items'->0->>'status'),
 'draft','Borrador privado todavía no publicado');
select throws_ok($$select public.transition_opening(current_setting('test.new_opening')::uuid,1,'approve',null,null)$$,
 'P0001','FORBIDDEN','Empresa no aprueba su propia oferta');
select lives_ok($$select public.transition_opening(current_setting('test.new_opening')::uuid,1,'submit',null,null)$$,
 'Empresa envía borrador completo a revisión');
select is((public.my_company_offers(1,10,current_setting('test.new_opening')::uuid)->'items'->0->>'status'),
 'pending_review','Enviar no publica directamente');
select throws_ok($$select public.save_company_opening(current_setting('test.new_opening')::uuid,2,
 'Cambio indebido','Tareas','Requisitos',1,'Funes','Presencial','Horario','Plazo',current_date+30,null,null,array[]::uuid[])$$,
 'P0001','INVALID_TRANSITION','Pendiente de revisión no admite edición empresarial');
select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2)::text,
 'session_id','ee300000-0000-4000-8000-000000000002')::text,true);
select is((public.my_company_offers(1,10,current_setting('test.new_opening')::uuid)->>'total')::integer,
 0,'Otra empresa no ve la oferta');
select throws_ok($$select public.save_company_opening(current_setting('test.new_opening')::uuid,2,
 'Cambio indebido','Tareas','Requisitos',1,'Funes','Presencial','Horario','Plazo',current_date+30,null,null,array[]::uuid[])$$,
 'P0001','NOT_FOUND','Otra empresa no edita la oferta');

select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,
 'session_id','ee300000-0000-4000-8000-000000000003')::text,true);
select lives_ok($$select public.transition_opening(current_setting('test.new_opening')::uuid,2,
 'request_changes',null,'Aclarar horario ficticio')$$,'Administración solicita correcciones');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,
 'session_id','ee300000-0000-4000-8000-000000000001')::text,true);
select ok(exists(select 1 from jsonb_array_elements(public.my_company_offers(1,10,
 current_setting('test.new_opening')::uuid)->'items'->0->'history') event
 where event->>'message'='Aclarar horario ficticio'),'Empresa ve mensaje accionable');
select ok(not ((public.my_company_offers(1,10,current_setting('test.new_opening')::uuid))::text like '%internal_reason%'),
 'Proyección nunca copia columna de motivo interno');

select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,
 'session_id','ee300000-0000-4000-8000-000000000003')::text,true);
select lives_ok($$select public.change_account_status(private.fixture_id('company',1),1,'suspend',
 'Motivo ficticio de suspensión',true)$$,'Suspensión empresarial administrada');
select is((select status::text from public.company_profiles where id=private.fixture_id('business',1)),
 'suspended','Perfil suspendido');
select is((select count(*) from public.referrals r join public.participations p on p.id=r.participation_id
 join public.job_openings o on o.id=p.opening_id where o.company_id=private.fixture_id('business',1)
 and r.access_status='active'),0::bigint,'Suspensión revoca permisos existentes');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,
 'session_id','ee300000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.my_company_offers(1,10,null)$$,'P0001','AUTH_REQUIRED',
 'Sesión previa suspendida no consulta ofertas');
select throws_ok($$select public.change_account_status(private.fixture_id('company',1),2,'restore',null,true)$$,
 'P0001','AUTH_REQUIRED','Empresa suspendida no se restaura');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,
 'session_id','ee300000-0000-4000-8000-000000000003')::text,true);
select lives_ok($$select public.change_account_status(private.fixture_id('company',1),2,'reactivate',
 'Motivo ficticio de reactivación',true)$$,'Reactivación administrada');
select is((select status::text from public.company_profiles where id=private.fixture_id('business',1)),
 'incomplete','Reactivar exige completar de nuevo el perfil');
select is((select count(*) from public.referrals r join public.participations p on p.id=r.participation_id
 join public.job_openings o on o.id=p.opening_id where o.company_id=private.fixture_id('business',1)
 and r.access_status='active'),0::bigint,'Reactivar no reabre permisos');
select lives_ok($$select public.change_account_status(private.fixture_id('company',1),3,'archive',
 'Motivo ficticio de archivo',true)$$,'Administración también puede archivar empresa');
select is((select count(*) from public.job_openings where company_id=private.fixture_id('business',1)
 and status not in ('closed','rejected','cancelled') and archived_at is null),0::bigint,
 'Archivo marca ofertas no finales sin cambiar su estado');
select lives_ok($$select public.change_account_status(private.fixture_id('company',1),4,'restore',
 'Motivo ficticio de restauración',true)$$,'Solo administración restaura con motivo');
select is((select status::text from public.company_profiles where id=private.fixture_id('business',1)),
 'incomplete','Restauración deja perfil incompleto');
select is((select count(*) from public.job_openings where company_id=private.fixture_id('business',1)
 and archived_at is null and status='draft'),3::bigint,'Ofertas archivadas regresan a borrador');
select is((select count(*) from public.referrals r join public.participations p on p.id=r.participation_id
 join public.job_openings o on o.id=p.opening_id where o.company_id=private.fixture_id('business',1)
 and r.access_status='active'),0::bigint,'Restauración no recupera acceso anterior');
reset role;
select ok((private.run_daily_employment_maintenance('2027-01-01 03:00:00+00')->>'closedOpenings')::integer>0,
 'Proceso diario cierra ofertas publicadas tras su fecha límite');
select is(private.run_daily_employment_maintenance('2027-01-01 03:00:00+00')->>'closedOpenings','0',
 'Repetición no vuelve a cerrar ni auditar ofertas');
select ok(exists(select 1 from public.audit_events where action='opening_auto_closed' and actor_type='system'),
 'Cierre automático tiene actor de sistema');
select * from finish();
rollback;
