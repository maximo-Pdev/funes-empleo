begin;
select no_plan();
select has_function('public','preview_opening_candidate',array['uuid','uuid'],'Preview administrativo disponible');
select ok(not has_function_privilege('anon','public.preview_opening_candidate(uuid,uuid)','EXECUTE'),'Anónimo sin preview');
select ok(not has_function_privilege('authenticated','private.opening_candidate_pool(uuid)','EXECUTE'),'Pool privado no invocable por clientes');
select ok((select not prosecdef from pg_proc where oid='private.opening_candidate_pool(uuid)'::regprocedure),'Pool invocador, sin privilegios propios');
select set_config('test.preview_opening',(select opening.id::text from private.public_offer_rows opening
where exists(select 1 from private.opening_candidate_pool(opening.id)) order by opening.id limit 1),true);
select set_config('test.preview_candidate',(select id::text from private.opening_candidate_pool(current_setting('test.preview_opening')::uuid)
order by id limit 1),true);
select set_config('test.preview_total',(select count(*)::text from private.opening_candidate_pool(current_setting('test.preview_opening')::uuid)),true);
select set_config('test.referrals_before',(select count(*)::text from public.referrals),true);
grant execute on function private.fixture_id(text,integer) to authenticated;
insert into auth.sessions(id,user_id) values
('ee810000-0000-4000-8000-000000000001',private.fixture_id('admin',1)),
('ee810000-0000-4000-8000-000000000002',private.fixture_id('company',1)),
('ee810000-0000-4000-8000-000000000003',private.fixture_id('candidate',1));
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee810000-0000-4000-8000-000000000001')::text,true);
select is(public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)->>'id',current_setting('test.preview_candidate'),'Preview corresponde al candidato');
select ok(public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)
?& array['skills','categories','cvId','candidateVersion','openingVersion','openingTitle'],'Perfil y versiones suficientes para nominar');
select ok(not (public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)
?| array['dni','address','contacts','notes','email','phone']),'No serializa PII ni notas internas');
select throws_ok($$select public.preview_opening_candidate(null,null)$$,'P0001','INVALID_INPUT','Entrada nula rechazada');
select throws_ok($$select public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,'00000000-0000-4000-8000-ffffffffffff')$$,'P0001','NOT_FOUND','No expone persona fuera del pool');
select throws_ok($$select public.create_participation(current_setting('test.preview_candidate')::uuid,0,current_setting('test.preview_opening')::uuid,0,'admin_nomination')$$,
'P0001','CONFLICT_STALE_DATA','Versiones obsoletas no nominan');
select lives_ok($$select public.create_participation(current_setting('test.preview_candidate')::uuid,
(select version from public.candidate_profiles where id=current_setting('test.preview_candidate')::uuid),
current_setting('test.preview_opening')::uuid,(select version from public.job_openings where id=current_setting('test.preview_opening')::uuid),'admin_nomination')$$,'Nominar con versiones vigentes');
select throws_ok($$select public.create_participation(current_setting('test.preview_candidate')::uuid,
(select version from public.candidate_profiles where id=current_setting('test.preview_candidate')::uuid),
current_setting('test.preview_opening')::uuid,(select version from public.job_openings where id=current_setting('test.preview_opening')::uuid),'admin_nomination')$$,'P0001','INVALID_TRANSITION','Doble nominación rechazada');
select throws_ok($$select public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)$$,'P0001','NOT_FOUND','Nominado ya no tiene preview en este pool');
select is((public.match_opening_candidates(current_setting('test.preview_opening')::uuid)->>'total')::integer,current_setting('test.preview_total')::integer-1,'Total disminuye antes de paginar');
select ok(not exists(select 1 from jsonb_array_elements(public.match_opening_candidates(current_setting('test.preview_opening')::uuid,1,50)->'items') item
where item->>'id'=current_setting('test.preview_candidate')),'Nominado no reaparece en lista');
select is((select count(*) from public.participations where candidate_id=current_setting('test.preview_candidate')::uuid
and opening_id=current_setting('test.preview_opening')::uuid and archived_at is null),1::bigint,'Una sola participación');
select ok(exists(select 1 from public.audit_events event join public.participations participation on participation.id=event.entity_id
where participation.candidate_id=current_setting('test.preview_candidate')::uuid and participation.opening_id=current_setting('test.preview_opening')::uuid
and event.action='participation_created' and event.actor_account_id=private.fixture_id('admin',1)),'Auditoría municipal conservada');
select set_config('request.jwt.claim.sub',private.fixture_id('company',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('company',1),'session_id','ee810000-0000-4000-8000-000000000002')::text,true);
select throws_ok($$select public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)$$,'P0001','FORBIDDEN','Empresa sin preview incluso con IDs conocidos');
select set_config('request.jwt.claim.sub',private.fixture_id('candidate',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('candidate',1),'session_id','ee810000-0000-4000-8000-000000000003')::text,true);
select throws_ok($$select public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)$$,'P0001','FORBIDDEN','Candidato sin preview administrativo');
reset role;
delete from auth.sessions where id='ee810000-0000-4000-8000-000000000001';
set local role authenticated;
select set_config('request.jwt.claim.sub',private.fixture_id('admin',1)::text,true);
select set_config('request.jwt.claims',jsonb_build_object('sub',private.fixture_id('admin',1),'session_id','ee810000-0000-4000-8000-000000000001')::text,true);
select throws_ok($$select public.preview_opening_candidate(current_setting('test.preview_opening')::uuid,current_setting('test.preview_candidate')::uuid)$$,'P0001','AUTH_REQUIRED','Sesión revocada no lee perfil');
reset role;
select is((select count(*)::text from public.referrals),current_setting('test.referrals_before'),'Nominar no deriva ni comparte perfil');
select * from finish();
rollback;
