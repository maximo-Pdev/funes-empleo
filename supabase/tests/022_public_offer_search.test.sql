begin;
select no_plan();
select has_function('public','search_published_offers',array['integer','integer','text','text','text','text','uuid'],'RPC de búsqueda sin sobrecargas');
select has_function('public','public_offer_filter_options',array[]::text[],'Opciones públicas');
select ok(not has_table_privilege('anon','private.public_offer_rows','SELECT'),'Vista interna sin SELECT anónimo');
select ok(not has_table_privilege('authenticated','private.public_offer_rows','SELECT'),'Vista interna sin SELECT autenticado');
select ok((select reloptions @> array['security_invoker=true','security_barrier=true'] from pg_class where oid='private.public_offer_rows'::regclass),'Vista invocadora y barrera de seguridad');
select ok(not has_table_privilege('anon','public.job_openings','SELECT'),'No concede SELECT sobre negocio');
select ok(has_function_privilege('anon','public.search_published_offers(integer,integer,text,text,text,text,uuid)','EXECUTE'),'Anónimo busca');
select ok(has_function_privilege('authenticated','public.public_offer_filter_options()','EXECUTE'),'Autenticado consulta opciones');

create temporary table search_sample as select id from private.public_offer_rows order by id limit 12;
select is((select count(*) from search_sample),12::bigint,'Fixture suficiente para paginar');
update public.job_openings set title='A07 Pública',tasks='Herramienta-a07',requirements='Requisito-a07',
  location='Villa A07',modality='A07 Remota' where id in (select id from search_sample);
select set_config('test.search_id',(select id::text from search_sample order by id limit 1),true);
select set_config('test.search_slug',(select slug from public.job_openings where id=current_setting('test.search_id')::uuid),true);
insert into public.job_categories(code,name,version) values ('A07-PUBLICO','Rubro ficticio A07 público',991),('A07-OCULTO','Rubro ficticio A07 oculto',991);
insert into public.opening_categories(opening_id,category_id)
select s.id,j.id from search_sample s cross join public.job_categories j where j.code='A07-PUBLICO' and j.version=991;
insert into public.job_openings(company_id,title,location,modality)
select company_id,'A07 Oculta','A07 Secreta','A07 Secreta' from public.job_openings where id=current_setting('test.search_id')::uuid;
insert into public.opening_categories(opening_id,category_id)
select o.id,j.id from public.job_openings o cross join public.job_categories j where o.title='A07 Oculta' and j.code='A07-OCULTO' and j.version=991;

set local role anon;
select is(public.search_published_offers(p_q=>'a07 pública')->>'total','12','Texto insensible a mayúsculas');
select is(public.search_published_offers(p_q=>'Herramienta-a07')->>'total','12','Busca en tareas');
select is(public.search_published_offers(p_q=>'Requisito-a07')->>'total','12','Busca en requisitos');
select is(public.search_published_offers(p_q=>'a07 publica')->>'total','0','Tildes se conservan');
select is(public.search_published_offers(p_localidad=>' VILLA A07 ',p_modalidad=>' a07 REMOTA ',p_rubro=>'A07-PUBLICO',p_q=>'Pública')->>'total','12','Combina los cuatro filtros antes del conteo');
select is(public.search_published_offers(p_localidad=>'Villa')->>'total','0','Localidad completa, no parcial');
select is(public.search_published_offers(p_modalidad=>'Remota')->>'total','0','Modalidad completa, no parcial');
select is(public.search_published_offers(p_rubro=>'A07-OCULTO')->>'total','0','No amplía filtro sin coincidencia pública');
select is(public.search_published_offers(p_q=>'%_')->>'total','0','Comodines son texto literal');
select is(public.search_published_offers(p_q=>$$' OR 1=1 --$$)->>'total','0','Sintaxis SQL no se ejecuta');
select is(public.search_published_offers(3,5,p_q=>'A07 Pública')->>'total','12','Total filtrado independiente de página');
select is(jsonb_array_length(public.search_published_offers(3,5,p_q=>'A07 Pública')->'items'),2,'Última página filtrada correcta');
select is(jsonb_array_length(public.search_published_offers(9,5,p_q=>'A07 Pública')->'items'),0,'Página fuera de rango vacía');
select is((public.search_published_offers(1,5,p_q=>'A07 Pública')->'items') || (public.search_published_offers(2,5,p_q=>'A07 Pública')->'items'),public.search_published_offers(1,10,p_q=>'A07 Pública')->'items','Orden y páginas sin pérdidas ni duplicados');
select is(public.search_published_offers(2,10),public.published_offers(2,10,null),'Contrato sin filtros conservado');
select is(public.search_published_offers(p_page_size=>1,p_id=>current_setting('test.search_id')::uuid),public.published_offers(1,1,current_setting('test.search_id')::uuid),'Lookup por ID conserva proyección');
select is(public.published_offer_by_slug(current_setting('test.search_slug')),public.published_offers(1,1,current_setting('test.search_id')::uuid),'Lookup por slug conservado');
select ok(not ((public.search_published_offers(1,1)->'items'->0) ?| array['published_at','account_id','email','phone','dni','moderation_message_public','version']),'No agrega campos internos');
select ok(public.public_offer_filter_options()->'categories' @> '[{"value":"A07-PUBLICO","label":"Rubro ficticio A07 público"}]'::jsonb,'Rubro visible presente');
select ok(not (public.public_offer_filter_options()->'categories' @> '[{"value":"A07-OCULTO"}]'::jsonb),'Rubro exclusivo de borrador oculto');
select ok(public.public_offer_filter_options()->'localities' @> '[{"value":"villa a07","label":"Villa A07"}]'::jsonb,'Localidad normalizada');
select ok(not (public.public_offer_filter_options()->'localities' @> '[{"value":"a07 secreta"}]'::jsonb),'Localidad de borrador oculta');
select ok(not (public.public_offer_filter_options()->'modalities' @> '[{"value":"a07 secreta"}]'::jsonb),'Modalidad de borrador oculta');
select throws_ok($$select public.search_published_offers(p_q=>repeat('x',121))$$,'P0001','VALIDATION_ERROR','RPC también limita entrada');
reset role;

update public.job_categories set active=false where code='A07-PUBLICO' and version=991;
set local role anon;
select is(public.search_published_offers(p_rubro=>'A07-PUBLICO')->>'total','0','Rubro inactivo no habilita coincidencias');
select ok(not (public.public_offer_filter_options()->'categories' @> '[{"value":"A07-PUBLICO"}]'::jsonb),'Rubro inactivo no se ofrece');
reset role;
update public.job_openings set status='closed',closed_at=clock_timestamp() where id in (select id from search_sample);
set local role anon;
select is(public.search_published_offers(p_q=>'A07 Pública')->>'total','0','Cerradas dejan de aparecer en búsqueda');
select ok(not (public.public_offer_filter_options()->'localities' @> '[{"value":"villa a07"}]'::jsonb),'Opciones desaparecen al cerrar todas sus ofertas');
select is(public.published_offer_by_slug(current_setting('test.search_slug'))->>'total','0','Slug no elude cierre después del refactor');
reset role;
select * from finish();
rollback;
