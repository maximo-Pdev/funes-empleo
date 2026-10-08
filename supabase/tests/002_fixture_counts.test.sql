begin;
select no_plan();
select is((select count(*) from public.accounts where role='admin'),2::bigint,'Dos administradores ficticios');
select is((select count(*) from public.candidate_profiles),4::bigint,'Cuatro candidatos');
select is((select count(*) from public.candidate_profiles where status='active'),4::bigint,'Cuatro candidatos activos');
select is((select count(*) from public.company_profiles),4::bigint,'Cuatro empresas');
select is((select count(*) from public.job_openings),8::bigint,'Ocho ofertas');
select is((select count(*) from public.participations),8::bigint,'Ocho participaciones');
select is((select count(*) from public.participations where status='hired'),4::bigint,'Cuatro contrataciones confirmadas ficticias');
select is((select count(*) from public.job_openings o where
 (select count(*) from public.participations p where p.opening_id=o.id and p.status='hired')>=o.vacancies),4::bigint,'Cuatro ofertas con cobertura total');
select is((select count(*) from public.candidate_profiles p join public.candidate_categories cc on cc.candidate_id=p.id
 join public.job_categories jc on jc.id=cc.category_id
 where p.display_name ilike '%Persona ficticia 001%' and jc.code='DEMO-B' and p.availability='available'),1::bigint,'SC-008A candidato: término/categoría/disponibilidad');
select is((select count(*) from public.job_openings where status='published'),4::bigint,'SC-008A ofertas publicadas');
select is((select count(*) from (select id from public.job_openings where status='published' order by title,id limit 2 offset 2) q),2::bigint,'SC-008A ofertas: página 2 de 2');
select is((select count(*) from public.company_profiles where status='active'),4::bigint,'SC-008A empresas activas');
select is((select count(*) from (select id from public.company_profiles where status='active' order by legal_name,id limit 2 offset 2) q),2::bigint,'SC-008A empresas: página 2 de 2');
select * from finish();
rollback;
