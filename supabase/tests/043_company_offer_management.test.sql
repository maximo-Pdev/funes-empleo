begin;
select no_plan();
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee430000-0000-4000-8000-000000000001',private.fixture_id('company',1)),
 ('ee430000-0000-4000-8000-000000000002',private.fixture_id('company',2)),
 ('ee430000-0000-4000-8000-000000000003',private.fixture_id('admin',1));

insert into public.job_openings
select (jsonb_populate_record(null::public.job_openings,to_jsonb(template)||jsonb_build_object(
 'id',private.fixture_id('cm-opening',number),'slug',null,'title','Oferta ficticia gestión '||number,
 'status','published','version',1,'closing_date',current_date+30))).*
from public.job_openings template cross join generate_series(1,3) number where template.id=private.fixture_id('opening',1);
insert into public.opening_categories(opening_id,category_id)
select private.fixture_id('cm-opening',number),private.fixture_id('category',1) from generate_series(1,3) number;
insert into public.participations
select (jsonb_populate_record(null::public.participations,to_jsonb(template)||jsonb_build_object(
 'id',private.fixture_id('cm-part',number),'opening_id',private.fixture_id('cm-opening',1),
 'candidate_id',private.fixture_id('profile',number),'status',case number when 1 then 'referred' when 2 then 'hired' else 'not_selected' end))).*
from public.participations template cross join generate_series(1,3) number where template.id=private.fixture_id('participation',1);
insert into public.referrals
select (jsonb_populate_record(null::public.referrals,to_jsonb(template)||jsonb_build_object(
 'id',private.fixture_id('cm-referral',1),'participation_id',private.fixture_id('cm-part',1)))).*
from public.referrals template where template.id=private.fixture_id('referral',1);

create temporary table original_final_parts as select * from public.participations
where id in(private.fixture_id('cm-part',2),private.fixture_id('cm-part',3));
create temporary table original_sibling as select * from public.job_openings where id=private.fixture_id('opening',1);
create function pg_temp.management_snapshot() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object(
 'openings',(select jsonb_agg(to_jsonb(o) order by id) from public.job_openings o where id in
   (private.fixture_id('cm-opening',1),private.fixture_id('cm-opening',2),private.fixture_id('cm-opening',3))),
 'categories',(select jsonb_agg(to_jsonb(c) order by opening_id,category_id) from public.opening_categories c where opening_id in
   (private.fixture_id('cm-opening',1),private.fixture_id('cm-opening',2),private.fixture_id('cm-opening',3))),
 'parts',(select jsonb_agg(to_jsonb(p) order by id) from public.participations p where opening_id=private.fixture_id('cm-opening',1)),
 'refs',(select to_jsonb(r) from public.referrals r where id=private.fixture_id('cm-referral',1)),
 'audit',(select count(*) from public.audit_events),'moderation',(select count(*) from public.opening_moderation_events),
 'decisions',(select count(*) from private.workflow_decisions))
$$;
create function pg_temp.fail_management_audit() returns trigger language plpgsql as $$
begin
 if current_setting('cm.fail_action',true)=new.action then raise exception 'MANAGEMENT_AUDIT_FAILURE'; end if;
 return new;
end $$;
create trigger test_management_audit before insert on public.audit_events for each row execute function pg_temp.fail_management_audit();

set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee430000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),1,'cancel')$$,
 'P0001','INVALID_INPUT','Cancelar exige motivo');
select throws_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),2,'cancel','Motivo ficticio')$$,
 'P0001','CONFLICT_STALE_DATA','Cancelar exige versión vigente');
select throws_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),1,'approve')$$,
 'P0001','FORBIDDEN','La ampliación no permite aprobar a la empresa');
select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2)::text,'session_id','ee430000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),1,'cancel','Motivo ficticio')$$,
 'P0001','NOT_FOUND','Otra empresa no cancela');
select throws_ok($$select public.save_company_opening(private.fixture_id('cm-opening',1),1,'Título editado','Tareas','Requisitos',
 1,'Funes','Presencial','Completo','Plazo',current_date+30,null,null,array[private.fixture_id('category',1)])$$,
 'P0001','NOT_FOUND','Otra empresa no edita publicada');
reset role;
select set_config('cm.before',pg_temp.management_snapshot()::text,true);
select set_config('cm.fail_action','opening_submitted',true);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee430000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.save_company_opening(private.fixture_id('cm-opening',1),1,'Título editado','Tareas','Requisitos',
 1,'Funes','Presencial','Completo','Plazo',current_date+30,null,null,array[private.fixture_id('category',2)])$$,
 'P0001','MANAGEMENT_AUDIT_FAILURE','Fallo de reenvío revierte también los datos editados');
reset role;
select is(pg_temp.management_snapshot(),current_setting('cm.before')::jsonb,'Edición y reenvío atómicos, incluyendo categorías/auditoría/participaciones');
select set_config('cm.fail_action','',true);
set local role authenticated;
select throws_ok($$select public.save_company_opening(private.fixture_id('cm-opening',1),1,'Título editado','Tareas','Requisitos',
 1,'Funes','Presencial','Completo','Plazo',current_date+30,null,null,array[]::uuid[])$$,
 'P0001','INVALID_TRANSITION','Publicada incompleta no se guarda ni reenvía');
reset role;
select is(pg_temp.management_snapshot(),current_setting('cm.before')::jsonb,'Validación fallida conserva íntegramente la oferta publicada');
select set_config('cm.slug',(select slug from public.job_openings where id=private.fixture_id('cm-opening',1)),true);
set local role authenticated;
select is(public.save_company_opening(private.fixture_id('cm-opening',1),1,'Título editado','Tareas','Requisitos',
 1,'Funes','Presencial','Completo','Plazo',current_date+30,null,null,array[private.fixture_id('category',2)])->>'status',
 'pending_review','Guardar publicada exige nueva revisión municipal');
select is((public.my_company_offers(1,10,private.fixture_id('cm-opening',1))->'items'->0->>'version')::integer,3,'Guardado y envío incrementan dos versiones');
select throws_ok($$select public.save_company_opening(private.fixture_id('cm-opening',1),3,'Otro cambio','Tareas','Requisitos',
 1,'Funes','Presencial','Completo','Plazo',current_date+30,null,null,array[private.fixture_id('category',2)])$$,
 'P0001','INVALID_TRANSITION','Pendiente no admite sobrescrituras');
reset role;
select is((select slug from public.job_openings where id=private.fixture_id('cm-opening',1)),current_setting('cm.slug'),'Edición conserva URL pública');
select is((select count(*) from private.public_offer_rows where id=private.fixture_id('cm-opening',1)),0::bigint,'Pendiente no aparece en búsqueda pública');
select is((select status::text from public.participations where id=private.fixture_id('cm-part',1)),'referred','Edición conserva la derivación abierta');
select is((select access_status::text from public.referrals where id=private.fixture_id('cm-referral',1)),'active','Edición no revoca ni renueva el permiso');
select ok(not exists(select 1 from original_final_parts a join public.participations b using(id) where to_jsonb(a)<>to_jsonb(b)),'Edición conserva todos los resultados finales');
select is((select count(*) from public.opening_moderation_events where opening_id=private.fixture_id('cm-opening',1) and decision='submitted'),1::bigint,'Reenvío conserva decisión y actor');
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1)::text,'session_id','ee430000-0000-4000-8000-000000000003')::text,true);
select lives_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),3,'approve')$$,'Solo administración vuelve a publicar');
reset role;
select is((select count(*) from private.public_offer_rows where id=private.fixture_id('cm-opening',1)),1::bigint,'Aprobada vuelve al público');
select set_config('cm.before_cancel',pg_temp.management_snapshot()::text,true);
select set_config('cm.fail_action','outcome_confirmed',true);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1)::text,'session_id','ee430000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),4,'cancel','Motivo ficticio')$$,
 'P0001','MANAGEMENT_AUDIT_FAILURE','Fallo al cerrar caso revierte cancelación y permisos');
reset role;
select is(pg_temp.management_snapshot(),current_setting('cm.before_cancel')::jsonb,'Cancelación completamente atómica');
select set_config('cm.fail_action','',true);
set local role authenticated;
select lives_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),4,'cancel','Motivo ficticio de cancelación')$$,'Propietaria cancela su oferta publicada');
select is(public.my_company_offers(1,10,private.fixture_id('cm-opening',1))->'items'->0->>'status','cancelled','Cancelada sigue en listado propio');
select throws_ok($$select public.transition_opening(private.fixture_id('cm-opening',1),5,'cancel','Repetición ficticia')$$,
 'P0001','INVALID_TRANSITION','Estado final impide duplicar cancelación');
reset role;
select is((select status::text from public.participations where id=private.fixture_id('cm-part',1)),'cancelled','Cierra el caso abierto de la oferta');
select is((select access_status::text from public.referrals where id=private.fixture_id('cm-referral',1)),'revoked','Revoca el acceso del caso cerrado');
select ok(not exists(select 1 from original_final_parts a join public.participations b using(id) where to_jsonb(a)<>to_jsonb(b)),'Cancelación conserva resultados finales completos');
select ok(not exists(select 1 from original_sibling a join public.job_openings b using(id) where to_jsonb(a)<>to_jsonb(b)),'No altera otra oferta');
select ok(exists(select 1 from public.opening_moderation_events where opening_id=private.fixture_id('cm-opening',1)
 and decision='cancelled' and actor_account_id=private.fixture_id('company',1) and internal_reason='Motivo ficticio de cancelación'),'Auditoría conserva actor y motivo empresarial');
select ok(not has_table_privilege('authenticated','public.job_openings','UPDATE,DELETE'),'No habilita escritura directa ni borrado');
select ok(not has_function_privilege('anon','public.save_company_opening(uuid,integer,text,text,text,integer,text,text,text,text,date,text,text,uuid[])','EXECUTE'),'Anónimo no edita');
select * from finish();
rollback;
