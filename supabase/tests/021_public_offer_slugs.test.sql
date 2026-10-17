begin;
select no_plan();
select has_column('public','job_openings','public_slug','Ofertas tienen referencia pública');
select col_not_null('public','job_openings','public_slug','Slug obligatorio');
select col_is_unique('public','job_openings','public_slug','Slug único');
select has_function('public','published_offer_by_slug',array['text'],'Proyección por slug');
select ok(has_function_privilege('anon','public.published_offer_by_slug(text)','EXECUTE'),'Anónimo consulta proyección');
select ok(has_function_privilege('authenticated','public.published_offer_by_slug(text)','EXECUTE'),'Autenticado consulta proyección');
select ok(not has_table_privilege('anon','public.job_openings','SELECT'),'No concede SELECT público');
select ok(not has_function_privilege('anon','private.generate_opening_public_slug(text)','EXECUTE'),'Generación no expuesta');
select ok(not has_function_privilege('authenticated','private.assign_opening_public_slug()','EXECUTE'),'Trigger no expuesto');
select ok((select bool_and(public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*-[a-f0-9]{16}$' and length(public_slug)<=81) from public.job_openings),'Backfill válido');
select is((select count(distinct public_slug) from public.job_openings),(select count(*) from public.job_openings),'Backfill sin colisiones');
select is((select tgenabled::text from pg_trigger where tgrelid='public.job_openings'::regclass and tgname='version_row'),'O','Trigger de versión habilitado');

create temporary table slug_examples as
select id,public_slug,version from public.job_openings where id=(public.published_offers(1,1,null)->'items'->0->>'id')::uuid;
select set_config('test.public_slug',(select public_slug from slug_examples),true);
select set_config('test.public_opening',(select id::text from slug_examples),true);
select set_config('test.company',(select company_id::text from public.job_openings where id=current_setting('test.public_opening')::uuid),true);

insert into public.job_openings(company_id,title,public_slug) values
  (current_setting('test.company')::uuid,'  Atención y logística / Ñandú!  ','elegido-por-cliente-0123456789abcdef'),
  (current_setting('test.company')::uuid,'  Atención y logística / Ñandú!  ',null);
select is((select count(distinct public_slug) from public.job_openings where title='  Atención y logística / Ñandú!  '),2::bigint,'Títulos iguales reciben referencias diferentes');
select ok((select bool_and(public_slug ~ '^atencion-y-logistica-nandu-[a-f0-9]{16}$') from public.job_openings where title='  Atención y logística / Ñandú!  '),'Normaliza acentos y no acepta slug elegido por cliente');
insert into public.job_openings(company_id,title) values (current_setting('test.company')::uuid,null),
  (current_setting('test.company')::uuid,repeat('palabra ',20));
select ok((select public_slug ~ '^oferta-[a-f0-9]{16}$' from public.job_openings where company_id=current_setting('test.company')::uuid and title is null order by created_at desc limit 1),'Borrador sin título tiene fallback');
select ok((select length(public_slug)<=81 from public.job_openings where title=repeat('palabra ',20)),'Limita tamaño del prefijo');
update public.job_openings set title=title || ' corregida' where id=current_setting('test.public_opening')::uuid;
select is((select public_slug from public.job_openings where id=current_setting('test.public_opening')::uuid),current_setting('test.public_slug'),'Editar título conserva slug');
select is((select version from public.job_openings where id=current_setting('test.public_opening')::uuid),(select version+1 from slug_examples),'Ediciones posteriores conservan control de versión');
select throws_ok($$update public.job_openings set public_slug='otro-0123456789abcdef' where id=current_setting('test.public_opening')::uuid$$,'23514','PUBLIC_SLUG_IMMUTABLE','Slug no es editable');

set local role anon;
select is(public.published_offer_by_slug(current_setting('test.public_slug'))->'items'->0->>'id',current_setting('test.public_opening'),'Slug resuelve la oferta correcta');
select is(public.published_offer_by_slug(current_setting('test.public_slug'))->'items'->0->>'slug',current_setting('test.public_slug'),'Proyección incluye slug canónico');
select ok(not ((public.published_offer_by_slug(current_setting('test.public_slug'))->'items'->0) ?| array['email','phone','dni','moderation_message_public','version']),'No revela datos privados');
select is(public.published_offer_by_slug(null)->>'total','0','Nulo no lista ofertas');
select is(public.published_offer_by_slug('')->>'total','0','Vacío no lista ofertas');
select is(public.published_offer_by_slug('../oferta-0123456789abcdef')->>'total','0','Entrada inválida sin resultado');
select is(public.published_offer_by_slug('inexistente-0123456789abcdef')->>'total','0','Inexistente sin resultado');
reset role;

update public.job_openings set status='draft' where id=current_setting('test.public_opening')::uuid;
set local role anon;
select is(public.published_offer_by_slug(current_setting('test.public_slug'))->>'total','0','Borrador no se revela por slug');
reset role;
update public.job_openings set status='published',published_at='2019-01-01',closing_date='2020-01-01' where id=current_setting('test.public_opening')::uuid;
set local role anon;
select is(public.published_offer_by_slug(current_setting('test.public_slug'))->>'total','0','Vencida no se revela por slug');
reset role;
update public.job_openings set closing_date='2099-12-31' where id=current_setting('test.public_opening')::uuid;
update public.accounts set status='suspended',suspended_reason='Prueba ficticia',suspended_at=clock_timestamp(),
  suspended_by=(select id from public.accounts where role='admin' and status='active' limit 1)
  where id=(select account_id from public.company_profiles where id=current_setting('test.company')::uuid);
set local role anon;
select is(public.published_offer_by_slug(current_setting('test.public_slug'))->>'total','0','Cuenta suspendida no se revela por slug');
reset role;

select * from finish();
rollback;
