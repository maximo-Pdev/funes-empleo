-- Same psql session as categories-before-migration.sql and the migration.
begin;
set local search_path=public,extensions;
select no_plan();
select cmp_ok((select count(*) from category_interests_before),'>',0::bigint,'Prueba contiene relaciones previas reales ficticias');
select results_eq('select candidate_id,category_id from public.candidate_categories order by 1,2','select candidate_id,category_id from category_pairs_before order by 1,2','Unión exacta conservada, sin duplicados ni pérdida');
select results_eq('select candidate_id,category_id,interest_created_at,interest_updated_at from private.legacy_candidate_interests order by 1,2','select candidate_id,category_id,created_at,updated_at from category_interests_before order by 1,2','Origen y ambos timestamps conservados en privado');
select ok(not exists(select 1 from public.candidate_categories where kind<>'occupation'),'Solo categorías operativas');
select ok(not exists(select 1 from category_interests_before b join public.candidate_categories a using(candidate_id,category_id) where b.created_at<>a.created_at or b.updated_at<>a.updated_at),'Reclasificación preserva timestamps en filas activas');
select results_eq('select to_jsonb(p) from public.candidate_profiles p order by id','select to_jsonb(p) from category_profiles_before p order by id','Perfiles, versiones y archivo intactos');
select results_eq('select to_jsonb(c) from public.candidate_consents c order by id','select to_jsonb(c) from category_consents_before c order by id','Consentimientos intactos');
select results_eq('select to_jsonb(p) from public.participations p order by id','select to_jsonb(p) from category_parts_before p order by id','Participaciones intactas');
select results_eq('select to_jsonb(a) from public.audit_events a order by id','select to_jsonb(a) from category_audit_before a order by id','Auditoría previa intacta');
select results_eq('select to_jsonb(j) from public.job_categories j order by id','select to_jsonb(j) from category_catalog_before j order by id','Catálogo e inactivas intactos');
select cmp_ok((select (response->>'total')::integer from category_rpc_before where page=1),'>',0,'Matching previo no vacío');
set local role authenticated;
select is(public.match_opening_candidates(private.fixture_id('opening',1),b.page,1),b.response,'Matching exacto, total, orden y página '||b.page)
from category_rpc_before b;
reset role;
select * from finish();
rollback;
