begin;
select no_plan();
select has_function('public','admin_metrics',array['date','date','uuid'],'Métricas protegidas');
select has_function('public','export_admin_metrics',array['date','date','uuid'],'Exportación auditada');
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee600000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
 ('ee600000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
 ('ee600000-0000-4000-8000-000000000003',private.fixture_id('candidate',1));
create function pg_temp.metric(payload jsonb,code text) returns numeric language sql as $$
 select (r->>'value')::numeric from jsonb_array_elements(payload->'rows') r where r->>'indicator'=code limit 1
$$;
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee600000-0000-4000-8000-000000000001')::text,true);
select set_config('test.metrics',public.admin_metrics('2026-09-01','2026-09-20',null)::text,true);
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'active_candidates'),400::numeric,'400 activos en foto histórica');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'companies'),50::numeric,'50 empresas');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'openings_published'),80::numeric,'80 ofertas publicadas');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'openings_closed'),20::numeric,'20 cerradas');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'applications'),1000::numeric,'1000 participaciones por evento');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'referrals'),1000::numeric,'1000 derivaciones');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'hired'),50::numeric,'50 contrataciones confirmadas');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'not_selected'),100::numeric,'100 no seleccionados');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'withdrawn'),100::numeric,'100 retiros');
select is(pg_temp.metric(current_setting('test.metrics')::jsonb,'preinterviews'),0::numeric,'Cero no es pendiente');
select is((select count(*) from jsonb_array_elements(current_setting('test.metrics')::jsonb->'rows') r where r->>'indicator'='coverage_days' and r->>'state'='calculated'),20::bigint,'20 coberturas completas');
select is((select count(*) from jsonb_array_elements(current_setting('test.metrics')::jsonb->'rows') r where r->>'indicator'='coverage_days' and r->>'state'='pending'),80::bigint,'80 coberturas pendientes');
select is((select (r->>'value')::numeric from jsonb_array_elements(current_setting('test.metrics')::jsonb->'rows') r where r->>'indicator'='first_hire_days' and r->>'opening_id'=private.fixture_id('opening',21)::text),10::numeric,'Primera contratación calculada aun sin cobertura');
select ok((select r->'value'='null'::jsonb from jsonb_array_elements(current_setting('test.metrics')::jsonb->'rows') r where r->>'indicator'='coverage_days' and r->>'opening_id'=private.fixture_id('opening',21)::text),'Cobertura incompleta sin valor');
select set_config('test.category',public.admin_metrics('2026-09-01','2026-09-20',private.fixture_id('category',1))::text,true);
select is(pg_temp.metric(current_setting('test.category')::jsonb,'active_candidates'),200::numeric,'Categoría de candidato');
select is(pg_temp.metric(current_setting('test.category')::jsonb,'applications'),500::numeric,'Categoría de oferta para casos');
select is(pg_temp.metric(current_setting('test.category')::jsonb,'companies'),50::numeric,'Empresas no se filtran por categoría');
select is(pg_temp.metric(current_setting('test.category')::jsonb,'hired'),25::numeric,'Contrataciones por categoría de oferta');
select is(pg_temp.metric(public.admin_metrics('2026-09-19','2026-09-20'),'applications'),0::numeric,'Eventos fuera del intervalo excluidos');
select is(pg_temp.metric(public.admin_metrics('2026-09-19','2026-09-20'),'active_candidates'),400::numeric,'Foto no cuenta solo altas en período');
select is((select (r->>'value')::numeric from jsonb_array_elements(public.admin_metrics('2026-09-09','2026-09-09')->'rows') r where r->>'indicator'='first_hire_days' and r->>'opening_id'=private.fixture_id('opening',1)::text),10::numeric,'Cohorte publicada incluye contratación posterior al período');
select is(pg_temp.metric(public.admin_metrics('2026-09-09','2026-09-09'),'hired'),0::numeric,'Contrataciones posteriores no son eventos del período');
select throws_ok($$select public.admin_metrics('2026-09-20','2026-09-01')$$,'P0001','INVALID_INPUT','Período invertido rechazado');
select throws_ok($$select public.admin_metrics(null,'2026-09-01')$$,'P0001','INVALID_INPUT','Fecha obligatoria');
select throws_ok($$select public.admin_metrics('2026-09-01','2099-09-01')$$,'P0001','INVALID_INPUT','Sin métricas futuras inventadas');
select throws_ok($$select public.admin_metrics('2026-09-01','2026-09-20','00000000-0000-0000-0000-000000000001')$$,'P0001','INVALID_INPUT','Categoría inexistente rechazada');

-- Subsequent mutable changes must not rewrite the old snapshot.
reset role;
update public.candidate_profiles set availability='unavailable',status='unavailable' where id=private.fixture_id('profile',1);
delete from public.candidate_categories where candidate_id=private.fixture_id('profile',2);
update public.company_profiles set status='incomplete' where id=private.fixture_id('business',1);
update public.job_openings set status='paused' where id=private.fixture_id('opening',1);
update public.cv_documents set status='superseded' where candidate_id=private.fixture_id('profile',2);
insert into public.candidate_consents(candidate_id,policy_version,policy_hash,status,recorded_by,source)
 values(private.fixture_id('profile',3),'demo-not-approved',repeat('0',64),'withdrawn',private.fixture_id('admin',1),'assisted');
set local role authenticated;
select is(pg_temp.metric(public.admin_metrics('2026-09-01','2026-09-20'),'active_candidates'),400::numeric,'Disponibilidad/consentimiento actuales no alteran foto pasada');
select is(pg_temp.metric(public.admin_metrics('2026-09-01','2026-09-20',private.fixture_id('category',1)),'active_candidates'),200::numeric,'Categoría eliminada se conserva históricamente');
select is(pg_temp.metric(public.admin_metrics('2026-09-01','2026-09-20'),'companies_active'),50::numeric,'Estado histórico de empresas');
select is(pg_temp.metric(public.admin_metrics('2026-09-01','2026-09-20'),'openings_published'),80::numeric,'Estado histórico de ofertas');
select is(pg_temp.metric(public.admin_metrics('2026-09-01',(now() at time zone 'America/Buenos_Aires')::date),'active_candidates'),398::numeric,'Foto actual: sin disponibilidad ni consentimiento, pero no exige CV');
select is(pg_temp.metric(public.admin_metrics('2026-09-01',(now() at time zone 'America/Buenos_Aires')::date,private.fixture_id('category',1)),'active_candidates'),199::numeric,'Foto actual refleja categoría eliminada');
select throws_ok($$update private.metrics_history set status='active'$$,'42501',null,'Historial no editable por admin');
select throws_ok($$delete from private.metrics_outcomes$$,'42501',null,'Resultados históricos no borrables');

select lives_ok($$select public.export_admin_metrics('2026-09-01','2026-09-20',private.fixture_id('category',1))$$,'Exportación autorizada');
select is((select count(*) from private.metrics_exports where period_from='2026-09-01' and period_to='2026-09-20' and category_id=private.fixture_id('category',1)),1::bigint,'Filtros persistidos');
select ok(exists(select 1 from public.audit_events e join private.metrics_exports x on x.id=e.entity_id where e.action='metrics_exported' and e.actor_account_id=x.actor_id and e.request_id=x.request_id and e.metadata_safe=jsonb_build_object('decision_id',x.id)),'Auditoría actor/fecha/correlación sin contenido');
select ok(not exists(select 1 from private.metrics_history where availability like '%@%'),'Historial mínimo sin contactos');
select is((select prosecdef from pg_proc where oid='public.admin_metrics(date,date,uuid)'::regprocedure),false,'Consulta usa invocador y RLS');

-- Rollback of export history and audit is atomic.
reset role;
create function pg_temp.fail_metric_audit() returns trigger language plpgsql as $$ begin
  if new.action='metrics_exported' then raise exception 'FORCED_METRIC_AUDIT_FAILURE'; end if;
  return new;
end $$;
create trigger test_metric_failure before insert on public.audit_events for each row execute function pg_temp.fail_metric_audit();
set local role authenticated;
select throws_ok($$select public.export_admin_metrics('2026-09-01','2026-09-20')$$,'P0001','FORCED_METRIC_AUDIT_FAILURE','Fallo de auditoría bloquea descarga');
select is((select count(*) from private.metrics_exports),1::bigint,'Sin registro de descarga parcial');
reset role;
drop trigger test_metric_failure on public.audit_events;
update public.candidate_profiles set last_confirmed_at=now()-interval '7 months' where id=private.fixture_id('profile',4);
update public.candidate_profiles set status='draft' where id=private.fixture_id('profile',5);
update public.candidate_profiles set availability='unavailable' where id=private.fixture_id('profile',6);
update public.participations set status='no_company_response',final_outcome_at='2026-09-21 12:00+00',final_outcome_by=null where id=private.fixture_id('participation',5);
update public.participations set status='hired',final_outcome_at='2026-09-22 12:00+00',final_outcome_by=private.fixture_id('admin',1) where id=private.fixture_id('participation',5);
set local role authenticated;
select is(pg_temp.metric(public.admin_metrics('2026-09-01',(now() at time zone 'America/Buenos_Aires')::date),'active_candidates'),395::numeric,'Seis meses, estado y disponibilidad son condiciones independientes');
select is(pg_temp.metric(public.admin_metrics('2026-09-21','2026-09-22'),'no_company_response'),1::numeric,'Cierre automático no desaparece por corrección');
select is(pg_temp.metric(public.admin_metrics('2026-09-21','2026-09-22'),'hired'),1::numeric,'Contratación tardía cuenta en su propio evento');
reset role;
-- Simulate an existing installation without inventing pre-migration evidence.
alter table private.metrics_coverage disable trigger append_only;
update private.metrics_coverage set reliable_from='2026-09-21 00:00+00';
alter table private.metrics_coverage enable trigger append_only;
set local role authenticated;
select throws_ok($$select public.admin_metrics('2026-09-01','2026-09-20')$$,'P0001','METRICS_HISTORY_UNAVAILABLE','Período no reconstruible se informa, no se inventa');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee600000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.admin_metrics('2026-09-01','2026-09-20')$$,'P0001','FORBIDDEN','Empresa sin métricas');
select throws_ok($$select public.export_admin_metrics('2026-09-01','2026-09-20')$$,'P0001','FORBIDDEN','Empresa sin exportación');
select is((select count(*) from private.metrics_history),0::bigint,'RLS no filtra historia a empresa');
select is((select count(*) from private.metrics_exports),0::bigint,'RLS no filtra descargas');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee600000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.admin_metrics('2026-09-01','2026-09-20')$$,'P0001','FORBIDDEN','Candidato sin métricas');
set local role anon;
select throws_ok($$select public.admin_metrics('2026-09-01','2026-09-20')$$,'42501',null,'Anónimo sin métricas');
reset role;
update public.accounts set status='suspended',suspended_reason='Prueba ficticia',suspended_at=now(),suspended_by=private.fixture_id('admin',2) where id=private.fixture_id('admin',1);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee600000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.admin_metrics('2026-09-01','2026-09-20')$$,'P0001','AUTH_REQUIRED','Admin suspendido con sesión vieja denegado');
select * from finish();
rollback;
