-- EXTRA-079: explicit authorization for this hosted demo only: kyjycjojzhwggjuqjnki.
-- Do not run against municipal production or as a reset. New rows only.
-- Must pass independent review and a ROLLBACK rehearsal before COMMIT.
begin;
set local lock_timeout='5s';
set local statement_timeout='25s';
select pg_advisory_xact_lock(hashtext('extra079_public_metrics_demo'));
DO $guard$ begin
  if to_regprocedure('public.public_portal_counts()') is not null or
    exists(select 1 from supabase_migrations.schema_migrations where version='20261025210000') then
    raise exception 'PUBLIC_COUNTS_ALREADY_PRESENT';
  end if;
end $guard$;
-- Public totals approved in EXTRA-079. No table or private-view access is granted.
-- Recovery: retire the consumer, then DROP FUNCTION public.public_portal_counts();
-- this additive migration changes no business records.
create function public.public_portal_counts() returns jsonb
language sql stable security definer set search_path='' as $$
  select pg_catalog.jsonb_build_object(
    'candidates', (select count(*) from public.candidate_profiles
      where archived_at is null and status <> 'archived'),
    'companies', (select count(*) from public.company_profiles
      where archived_at is null and status <> 'archived'),
    'offers', (select count(*) from private.public_offer_rows)
  )
$$;
revoke all on function public.public_portal_counts() from public,anon,authenticated,service_role;
grant execute on function public.public_portal_counts() to anon,authenticated;
comment on function public.public_portal_counts() is
  'Nonarchived candidate/company profiles, including incomplete/assisted/suspended registrations; currently public openings. Aggregate only.';
notify pgrst, 'reload schema';

create temporary table demo_offers on commit drop as
select * from jsonb_to_recordset($fixture$[{"id": "b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3", "company_id": "da04d554-f0a7-505e-95bc-74b8fcb1011f", "company_actor": "5f47ad8a-369f-56fb-9e15-80cb2e350273", "category_id": "9b5d95d7-cb00-41bd-9dca-dfcbbde81e0f", "title": "Auxiliar administrativo (prueba)", "tasks": "OFERTA FICTICIA: no corresponde a una búsqueda laboral real. Organización de archivos y carga de datos ficticios.", "requirements": "Manejo básico de planillas y organización.", "vacancies": 1, "modality": "onsite", "schedule": "Lunes a viernes, 8 a 16 h", "contract_type": "permanent", "days": 30}, {"id": "40d890ba-0efb-4b51-99b4-c70b235ad1bd", "company_id": "da04d554-f0a7-505e-95bc-74b8fcb1011f", "company_actor": "5f47ad8a-369f-56fb-9e15-80cb2e350273", "category_id": "b37ac6ba-307a-4787-9bd5-97dabae07cf4", "title": "Atención al cliente (prueba)", "tasks": "OFERTA FICTICIA: no corresponde a una búsqueda laboral real. Atención de consultas simuladas y seguimiento de pedidos ficticios.", "requirements": "Comunicación clara y disposición para aprender.", "vacancies": 2, "modality": "onsite", "schedule": "Lunes a viernes, 9 a 17 h", "contract_type": "fixed_term", "days": 45}, {"id": "e6646768-a7b8-49f7-92c8-09a3da316735", "company_id": "da04d554-f0a7-505e-95bc-74b8fcb1011f", "company_actor": "5f47ad8a-369f-56fb-9e15-80cb2e350273", "category_id": "819f36b0-c2f3-4432-ab42-c4d1994b8c19", "title": "Asistente de ventas (prueba)", "tasks": "OFERTA FICTICIA: no corresponde a una búsqueda laboral real. Apoyo comercial y registro de ventas de demostración.", "requirements": "Organización y conocimientos básicos de atención comercial.", "vacancies": 1, "modality": "hybrid", "schedule": "Lunes a viernes, 10 a 18 h", "contract_type": "permanent", "days": 60}, {"id": "919ed65d-1a46-4594-b1b1-8fec8f0f55a4", "company_id": "c1ca52fa-119c-5d9e-bacf-53c303ece3d6", "company_actor": "738baaf8-f402-595b-9c49-0db661e589c9", "category_id": "09169869-c750-49a9-98b2-6a8ddefefd05", "title": "Operario de depósito (prueba)", "tasks": "OFERTA FICTICIA: no corresponde a una búsqueda laboral real. Preparación de pedidos y control de inventario ficticio.", "requirements": "Trabajo en equipo y atención al detalle.", "vacancies": 3, "modality": "onsite", "schedule": "Lunes a viernes, 7 a 15 h", "contract_type": "fixed_term", "days": 30}, {"id": "810ffdc7-6ee0-4cc2-9863-8174db9b78c3", "company_id": "c1ca52fa-119c-5d9e-bacf-53c303ece3d6", "company_actor": "738baaf8-f402-595b-9c49-0db661e589c9", "category_id": "09169869-c750-49a9-98b2-6a8ddefefd05", "title": "Auxiliar de logística (prueba)", "tasks": "OFERTA FICTICIA: no corresponde a una búsqueda laboral real. Coordinación de entregas y documentación de práctica.", "requirements": "Manejo básico de herramientas digitales y planificación.", "vacancies": 2, "modality": "hybrid", "schedule": "Lunes a viernes, 8 a 16 h", "contract_type": "permanent", "days": 45}, {"id": "d500459e-3a53-4887-9788-e4049953cd11", "company_id": "c1ca52fa-119c-5d9e-bacf-53c303ece3d6", "company_actor": "738baaf8-f402-595b-9c49-0db661e589c9", "category_id": "a28df241-79e3-419c-a6b6-54b88c8a59ec", "title": "Soporte informático (prueba)", "tasks": "OFERTA FICTICIA: no corresponde a una búsqueda laboral real. Resolución de consultas técnicas simuladas y documentación de prueba.", "requirements": "Conocimientos básicos de sistemas operativos y redes.", "vacancies": 1, "modality": "remote", "schedule": "Lunes a viernes, 9 a 17 h", "contract_type": "fixed_term", "days": 60}]$fixture$::jsonb) as x(
 id uuid, company_id uuid, company_actor uuid, category_id uuid, title text, tasks text,
 requirements text, vacancies integer, modality text, schedule text, contract_type text, days integer);
DO $seed$
declare item record; before_fingerprint jsonb; after_fingerprint jsonb;
  administrator uuid := '369eb658-cc1e-5647-8925-8080aab7dd1f';
begin
  if (select count(*) from demo_offers) <> 6 or
     exists(select 1 from public.job_openings where id in (select id from demo_offers)) then
    raise exception 'DEMO_MANIFEST_CONFLICT';
  end if;
  if not exists(select 1 from public.accounts a join auth.users u on u.id=a.auth_user_id
    where a.id=administrator and a.role='admin' and a.status='active' and u.email='admin1@prueba.com') then
    raise exception 'DEMO_ADMIN_PRECONDITION';
  end if;
  if exists(select 1 from demo_offers d left join public.company_profiles c on c.id=d.company_id
    left join public.accounts a on a.id=c.account_id left join auth.users u on u.id=a.auth_user_id
    left join public.job_categories j on j.id=d.category_id
    where c.id is null or c.account_id<>d.company_actor or c.status<>'active' or c.archived_at is not null
      or a.status<>'active' or a.role<>'company' or u.email not in ('empresa1@prueba.com','empresa2@prueba.com')
      or j.id is null or not j.active) then raise exception 'DEMO_COMPANY_CATEGORY_PRECONDITION'; end if;
  select jsonb_build_object('auth.users',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from auth.users t where true),'public.accounts',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.accounts t where true),'public.candidate_profiles',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.candidate_profiles t where true),'public.company_profiles',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.company_profiles t where true),'public.job_openings',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.job_openings t where id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'public.opening_categories',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by opening_id,category_id)::text,'[]')) from public.opening_categories t where opening_id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'public.opening_moderation_events',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.opening_moderation_events t where opening_id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'public.audit_events',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.audit_events t where entity_id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'storage.objects',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from storage.objects t where true)) into before_fingerprint;
  for item in select * from demo_offers order by id loop
    insert into public.job_openings(id,company_id,title,tasks,requirements,vacancies,location,
      modality,schedule,contract_type,closing_date,status)
    values(item.id,item.company_id,item.title,item.tasks,item.requirements,item.vacancies,'Funes',
      item.modality,item.schedule,item.contract_type,
      (clock_timestamp() at time zone 'America/Buenos_Aires')::date+item.days,'draft');
    insert into public.opening_categories(opening_id,category_id) values(item.id,item.category_id);
    perform private.record_event('job_openings',item.id,'opening_created',null,'draft',item.company_actor,'demo_fixture');
    update public.job_openings set status='pending_review' where id=item.id;
    insert into public.opening_moderation_events(opening_id,decision,previous_status,new_status,
      internal_reason,actor_type,actor_account_id)
    values(item.id,'submitted','draft','pending_review',
      'Carga de datos ficticios autorizada mediante Supabase CLI; no es una búsqueda laboral real.','account',item.company_actor);
    perform private.record_event('job_openings',item.id,'opening_submitted','draft','pending_review',item.company_actor,'demo_fixture');
    update public.job_openings set status='published',published_at=clock_timestamp() where id=item.id;
    insert into public.opening_moderation_events(opening_id,decision,previous_status,new_status,
      internal_reason,actor_type,actor_account_id)
    values(item.id,'approved','pending_review','published',
      'Aprobación ficticia del escenario de demostración autorizada por Maxi; no representa una aprobación municipal real.','account',administrator);
    perform private.record_event('job_openings',item.id,'opening_approved','pending_review','published',administrator,'demo_fixture');
  end loop;
  select jsonb_build_object('auth.users',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from auth.users t where true),'public.accounts',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.accounts t where true),'public.candidate_profiles',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.candidate_profiles t where true),'public.company_profiles',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.company_profiles t where true),'public.job_openings',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.job_openings t where id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'public.opening_categories',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by opening_id,category_id)::text,'[]')) from public.opening_categories t where opening_id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'public.opening_moderation_events',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.opening_moderation_events t where opening_id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'public.audit_events',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from public.audit_events t where entity_id not in ('b6c2d9fd-1caa-4ade-9f8f-b109f5463bc3'::uuid,'40d890ba-0efb-4b51-99b4-c70b235ad1bd'::uuid,'e6646768-a7b8-49f7-92c8-09a3da316735'::uuid,'919ed65d-1a46-4594-b1b1-8fec8f0f55a4'::uuid,'810ffdc7-6ee0-4cc2-9863-8174db9b78c3'::uuid,'d500459e-3a53-4887-9788-e4049953cd11'::uuid)),'storage.objects',(select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'[]')) from storage.objects t where true)) into after_fingerprint;
  if before_fingerprint is distinct from after_fingerprint then raise exception 'EXISTING_ROWS_CHANGED'; end if;
  if (select count(*) from private.public_offer_rows where id in (select id from demo_offers))<>6
    or (select count(*) from public.opening_categories where opening_id in (select id from demo_offers))<>6
    or (select count(*) from public.opening_moderation_events where opening_id in (select id from demo_offers))<>12
    or (select count(*) from public.audit_events where entity_id in (select id from demo_offers)
      and reason_code='demo_fixture')<>18 then raise exception 'DEMO_READBACK_FAILED'; end if;
end $seed$;

insert into supabase_migrations.schema_migrations(version,name,statements) values
('20261025210000','public_portal_counts',ARRAY[$migration$-- Public totals approved in EXTRA-079. No table or private-view access is granted.
-- Recovery: retire the consumer, then DROP FUNCTION public.public_portal_counts();
-- this additive migration changes no business records.
create function public.public_portal_counts() returns jsonb
language sql stable security definer set search_path='' as $$
  select pg_catalog.jsonb_build_object(
    'candidates', (select count(*) from public.candidate_profiles
      where archived_at is null and status <> 'archived'),
    'companies', (select count(*) from public.company_profiles
      where archived_at is null and status <> 'archived'),
    'offers', (select count(*) from private.public_offer_rows)
  )
$$;
revoke all on function public.public_portal_counts() from public,anon,authenticated,service_role;
grant execute on function public.public_portal_counts() to anon,authenticated;
comment on function public.public_portal_counts() is
  'Nonarchived candidate/company profiles, including incomplete/assisted/suspended registrations; currently public openings. Aggregate only.';
notify pgrst, 'reload schema';
$migration$]);
commit;
