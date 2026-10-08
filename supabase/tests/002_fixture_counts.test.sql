-- Strict TEST-ONLY acceptance contract, selected explicitly by npm run test:db
-- and test:e2e:full. The default interactive seed is intentionally a different dataset.
begin;
select no_plan();
select is((select count(*) from public.accounts where role='admin'),4::bigint,'Cuatro administradores ficticios');
select is((select count(*) from public.candidate_profiles),500::bigint,'500 candidatos');
select is((select count(*) from public.candidate_profiles where status='active'),400::bigint,'400 candidatos activos');
select is((select count(*) from public.company_profiles),50::bigint,'50 empresas');
select is((select count(*) from public.job_openings),100::bigint,'100 ofertas');
select is((select count(*) from public.participations),1000::bigint,'1000 participaciones');
select is((select count(*) from public.participations where status='hired'),50::bigint,'50 contrataciones confirmadas ficticias');
select is((select count(*) from public.job_openings o where
 (select count(*) from public.participations p where p.opening_id=o.id and p.status='hired')>=o.vacancies),20::bigint,'20 ofertas con cobertura total');
select is((select count(*) from public.candidate_profiles p join public.candidate_categories cc on cc.candidate_id=p.id
 join public.job_categories jc on jc.id=cc.category_id
 where p.display_name ilike '%Persona ficticia 001%' and jc.code='DEMO-B' and p.availability='available'),1::bigint,'SC-008A candidato: término/categoría/disponibilidad');
select is((select count(*) from public.job_openings where status='published'),80::bigint,'SC-008A ofertas publicadas');
select is((select count(*) from (select id from public.job_openings where status='published' order by title,id limit 10 offset 10) q),10::bigint,'SC-008A ofertas: página 2 de 10');
select is((select count(*) from public.company_profiles where status='active'),50::bigint,'SC-008A empresas activas');
select is((select count(*) from (select id from public.company_profiles where status='active' order by legal_name,id limit 10 offset 10) q),10::bigint,'SC-008A empresas: página 2 de 10');
select * from finish();
rollback;
