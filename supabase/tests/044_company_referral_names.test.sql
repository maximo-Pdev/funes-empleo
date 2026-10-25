begin;
select no_plan();
select has_function('public','company_referral_summaries',array['uuid'],'Listado mínimo disponible');
select is((select provolatile::text from pg_proc where oid='public.company_referral_summaries(uuid)'::regprocedure),'v','RPC admite el bloqueo del guard de sesión también vía PostgREST');
select ok(not has_function_privilege('anon','public.company_referral_summaries(uuid)','EXECUTE'),'Anónimo sin nombres');
select ok(not has_function_privilege('service_role','public.company_referral_summaries(uuid)','EXECUTE'),'Sin nuevo privilegio service_role');
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
 ('ee440000-0000-4000-8000-000000000001',private.fixture_id('company',1)),
 ('ee440000-0000-4000-8000-000000000002',private.fixture_id('company',2)),
 ('ee440000-0000-4000-8000-000000000003',private.fixture_id('candidate',1)),
 ('ee440000-0000-4000-8000-000000000004',private.fixture_id('admin',1));
select set_config('names.referral',private.fixture_id('referral',8)::text,true);
select set_config('names.opening',(select p.opening_id::text from public.referrals r join public.participations p on p.id=r.participation_id where r.id=current_setting('names.referral')::uuid),true);
select set_config('names.candidate',(select candidate_id::text from public.referrals where id=current_setting('names.referral')::uuid),true);
select set_config('names.display',(select display_name from public.candidate_profiles where id=current_setting('names.candidate')::uuid),true);
create function pg_temp.names_snapshot() returns jsonb language sql security definer set search_path='' as $$
 select jsonb_build_object('profiles',(select jsonb_agg(to_jsonb(p) order by id) from public.candidate_profiles p),
 'consents',(select jsonb_agg(to_jsonb(c) order by id) from public.candidate_consents c),
 'participations',(select jsonb_agg(to_jsonb(p) order by id) from public.participations p),
 'referrals',(select jsonb_agg(to_jsonb(r) order by id) from public.referrals r),
 'audit',(select count(*) from public.audit_events))
$$;
select set_config('names.before',pg_temp.names_snapshot()::text,true);
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee440000-0000-4000-8000-000000000001')::text,true);
select is(public.company_referral(current_setting('names.referral')::uuid)->>'candidateName',current_setting('names.display'),'Detalle activo identifica a la persona');
select is((select candidate_name from public.company_referral_summaries(current_setting('names.opening')::uuid) where referral_id=current_setting('names.referral')::uuid),current_setting('names.display'),'Lista identifica a la misma persona');
select ok((select count(*) from public.company_referral_summaries(current_setting('names.opening')::uuid))>0,'Hay derivaciones autorizadas');
select is((select count(*) from jsonb_object_keys((select to_jsonb(s) from public.company_referral_summaries(current_setting('names.opening')::uuid) s limit 1))),5::bigint,'Lista solo entrega cuatro referencias y nombre');
select is((select count(*) from public.candidate_profiles where id=current_setting('names.candidate')::uuid),0::bigint,'Nombre no permite leer tabla de perfiles');
reset role;
select is(pg_temp.names_snapshot(),current_setting('names.before')::jsonb,'Consultar nombres no cambia perfiles/casos/consentimientos/permisos/historial');
update public.referrals set access_status='revoked' where cv_document_id=(select cv_document_id from public.referrals where id=current_setting('names.referral')::uuid);
set local role authenticated;
select is(public.company_referral(current_setting('names.referral')::uuid)->>'candidateName',current_setting('names.display'),'Revocación conserva solo identificación mínima');
select ok(not(public.company_referral(current_setting('names.referral')::uuid) ?| array['candidate','contacts','cvDocumentId','interviews','feedback','participationVersion','photo']),'Revocada no entrega perfil/contactos/CV/foto/entrevistas/versión');
select is((select count(*) from jsonb_object_keys(public.company_referral(current_setting('names.referral')::uuid))),5::bigint,'Revocada no contratada tiene exactamente cinco campos');
select ok(not private.can_company_read_referral(current_setting('names.referral')::uuid),'Nombre no repone permiso completo');
select is((select candidate_name from public.company_referral_summaries(current_setting('names.opening')::uuid) where referral_id=current_setting('names.referral')::uuid),current_setting('names.display'),'Lista revocada conserva nombre');
reset role;
do $$declare state text; begin
 foreach state in array array['withdrawn','not_selected','cancelled','no_company_response','hired'] loop
  update public.participations set status=state::public.participation_status where id=(select participation_id from public.referrals where id=current_setting('names.referral')::uuid);
  perform set_config('names.state.'||state,public.company_referral(current_setting('names.referral')::uuid)::text,true);
 end loop;
end $$;
set local role authenticated;
select is(current_setting('names.state.'||state)::jsonb->>'candidateName',current_setting('names.display'),'Nombre mínimo en '||state)
from unnest(array['withdrawn','not_selected','cancelled','no_company_response','hired']) state;
select ok(not(current_setting('names.state.'||state)::jsonb ? 'candidate'),'Sin perfil completo en '||state)
from unnest(array['withdrawn','not_selected','cancelled','no_company_response','hired']) state;
select is(public.company_referral(current_setting('names.referral')::uuid)->>'candidateName',current_setting('names.display'),'Contratado conserva nombre sin permiso completo');
select ok(public.company_referral(current_setting('names.referral')::uuid) ? 'hiredCandidate','Contratación conserva marcador de resultado confirmado');
reset role;
update public.participations set status='no_company_response' where id=(select participation_id from public.referrals where id=current_setting('names.referral')::uuid);
set local role authenticated;
select lives_ok($$select public.submit_company_feedback(current_setting('names.referral')::uuid,'hired','Informe ficticio tardío identificado por nombre')$$,'Empresa puede informar tarde sin recuperar perfil');
select ok(not private.can_company_read_referral(current_setting('names.referral')::uuid),'Informar no reactiva permiso');
select is(public.company_referral(current_setting('names.referral')::uuid)->>'candidateName',current_setting('names.display'),'Informe conserva identificación mínima');
select throws_ok($$select public.authorized_cv_path(private.fixture_id('cv',8))$$,'P0001','NOT_FOUND','Sin otra derivación válida tampoco se descarga ese CV');
select set_config('request.jwt.claim.sub',private.fixture_id('company',2)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',2),'session_id','ee440000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.company_referral(current_setting('names.referral')::uuid)$$,'P0001','NOT_FOUND','Empresa ajena no lee nombre');
select throws_ok($$select * from public.company_referral_summaries(current_setting('names.opening')::uuid)$$,'P0001','NOT_FOUND','Empresa ajena no lista nombres');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee440000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select * from public.company_referral_summaries(current_setting('names.opening')::uuid)$$,'P0001','NOT_FOUND','Candidato no usa proyección empresarial');
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee440000-0000-4000-8000-000000000004')::text,true);
select throws_ok($$select * from public.company_referral_summaries(current_setting('names.opening')::uuid)$$,'P0001','NOT_FOUND','Admin mantiene su flujo y no usa proyección empresarial');
reset role;
update public.referrals set archived_at=clock_timestamp(),archived_by=private.fixture_id('admin',1) where id=current_setting('names.referral')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee440000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.company_referral(current_setting('names.referral')::uuid)$$,'P0001','NOT_FOUND','Derivación archivada no entrega nombre');
select is((select count(*) from public.company_referral_summaries(current_setting('names.opening')::uuid) where referral_id=current_setting('names.referral')::uuid),0::bigint,'Derivación archivada no aparece');
reset role;
update public.referrals set archived_at=null,archived_by=null where id=current_setting('names.referral')::uuid;
update public.accounts set status='suspended',suspended_at=clock_timestamp(),suspended_by=private.fixture_id('admin',1),suspended_reason='Motivo ficticio' where id=private.fixture_id('company',1);
set local role authenticated;
select throws_ok($$select * from public.company_referral_summaries(current_setting('names.opening')::uuid)$$,'P0001','AUTH_REQUIRED','Empresa suspendida no lista nombres');
select throws_ok($$select public.company_referral(current_setting('names.referral')::uuid)$$,'P0001','NOT_FOUND','Empresa suspendida no lee nombre');
reset role;
update public.accounts set status='active',suspended_at=null,suspended_by=null,suspended_reason=null where id=private.fixture_id('company',1);
delete from auth.sessions where id='ee440000-0000-4000-8000-000000000001';
set local role authenticated;
select throws_ok($$select * from public.company_referral_summaries(current_setting('names.opening')::uuid)$$,'P0001','AUTH_REQUIRED','Sesión revocada no lista nombres');
select throws_ok($$select public.company_referral(current_setting('names.referral')::uuid)$$,'P0001','NOT_FOUND','Sesión revocada no lee nombre');
reset role;
select * from finish();
rollback;
