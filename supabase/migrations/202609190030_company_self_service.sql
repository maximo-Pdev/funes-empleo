-- US3. All company writes are session-bound commands. Recovery is forward-only;
-- a fictitious local database may be rebuilt from migrations and seed.
alter table public.audit_events drop constraint audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check(action in
 ('account_created','account_verified','admin_provisioned','account_suspended','account_reactivated','account_archived','account_restored',
  'profile_created','profile_updated','profile_activated','profile_archived','profile_restored','profile_linked','availability_changed',
  'consent_accepted','consent_withdrawn','cv_uploaded','cv_replaced','cv_archived','duplicate_resolved',
  'opening_created','opening_updated','opening_submitted','opening_approved','opening_changes_requested','opening_rejected',
  'opening_paused','opening_resumed','opening_closed','opening_auto_closed','opening_suspended','opening_archived','opening_restored','opening_cancelled',
  'participation_created','participation_advanced','stage_skipped','preinterview_recorded','preselection_recorded','referral_created','referral_revoked',
  'interview_recorded','feedback_recorded','outcome_confirmed','outcome_corrected','no_company_response','post_hire_window_ended',
  'contact_recorded','note_recorded','import_confirmed','import_completed','import_failed','metrics_exported','freshness_due'));

create function public.bootstrap_company(p_name text,p_cuit text,p_responsible text,p_email text,p_phone text,
 p_activity text,p_locality text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.accounts; current_profile public.company_profiles; normalized text; contact_email text;
  contact_phone text; verified_email text; new_id uuid;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'company' then raise exception 'FORBIDDEN'; end if;
 select * into current_profile from public.company_profiles where account_id=actor.id for update;
 if current_profile.id is not null then return current_profile.id; end if;
 select lower(email) into verified_email from auth.users where id=actor.auth_user_id and email_confirmed_at is not null;
 if verified_email is null then raise exception 'AUTH_REQUIRED'; end if;
 normalized:=regexp_replace(coalesce(p_cuit,''),'[^0-9]','','g');
 contact_email:=nullif(lower(trim(coalesce(p_email,''))),'');
 contact_phone:=nullif(trim(coalesce(p_phone,'')),'');
 if p_name is null or length(trim(p_name)) not between 2 and 200 or normalized !~ '^[0-9]{11}$'
  or p_responsible is null or length(trim(p_responsible)) not between 2 and 200
  or (contact_email is null and contact_phone is null)
  or length(coalesce(contact_email,''))>320 or (contact_email is not null and contact_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$')
  or length(coalesce(contact_phone,''))>50 or p_activity is null or length(trim(p_activity)) not between 2 and 500
  or p_locality is null or length(trim(p_locality)) not between 2 and 150 then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from public.company_profiles where cuit_normalized=normalized) then raise exception 'DUPLICATE_PROFILE'; end if;
 insert into public.company_profiles(account_id,legal_name,cuit_normalized,cuit_display,responsible_name,email,phone,activity,locality,status)
 values(actor.id,trim(p_name),normalized,normalized,trim(p_responsible),contact_email,contact_phone,trim(p_activity),trim(p_locality),'active')
 returning id into new_id;
 perform private.record_event('company_profiles',new_id,'profile_created',null,'active',actor.id);
 return new_id;
end $$;

create function public.save_company_profile(p_version integer,p_name text,p_cuit text,p_responsible text,
 p_email text,p_phone text,p_activity text,p_locality text) returns integer
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; company public.company_profiles; normalized text; contact_email text; contact_phone text;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'company' then raise exception 'FORBIDDEN'; end if;
 select * into company from public.company_profiles where account_id=actor.id and archived_at is null for update;
 if company.id is null then raise exception 'NOT_FOUND'; end if;
 if company.version is distinct from p_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 if company.status not in ('active','incomplete') then raise exception 'INVALID_TRANSITION'; end if;
 normalized:=regexp_replace(coalesce(p_cuit,''),'[^0-9]','','g');
 contact_email:=nullif(lower(trim(coalesce(p_email,''))),'');
 contact_phone:=nullif(trim(coalesce(p_phone,'')),'');
 if p_name is null or length(trim(p_name)) not between 2 and 200 or normalized !~ '^[0-9]{11}$'
  or p_responsible is null or length(trim(p_responsible)) not between 2 and 200
  or (contact_email is null and contact_phone is null)
  or length(coalesce(contact_email,''))>320 or (contact_email is not null and contact_email !~ '^[^@ ]+@[^@ ]+\.[^@ ]+$')
  or length(coalesce(contact_phone,''))>50 or p_activity is null or length(trim(p_activity)) not between 2 and 500
  or p_locality is null or length(trim(p_locality)) not between 2 and 150 then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from public.company_profiles where cuit_normalized=normalized and id<>company.id) then raise exception 'DUPLICATE_PROFILE'; end if;
 update public.company_profiles set legal_name=trim(p_name),cuit_normalized=normalized,cuit_display=normalized,
  responsible_name=trim(p_responsible),email=contact_email,phone=contact_phone,activity=trim(p_activity),
  locality=trim(p_locality),status='active' where id=company.id;
 perform private.record_event('company_profiles',company.id,'profile_updated',company.status::text,'active',actor.id);
 return (select version from public.company_profiles where id=company.id);
end $$;

create function public.save_company_opening(p_id uuid,p_version integer,p_title text,p_tasks text,p_requirements text,
 p_vacancies integer,p_location text,p_modality text,p_schedule text,p_contract_type text,p_closing_date date,
 p_salary text,p_benefits text,p_categories uuid[]) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; company public.company_profiles; opening public.job_openings; new_id uuid;
  previous public.opening_status;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'company' then raise exception 'FORBIDDEN'; end if;
 select * into company from public.company_profiles where account_id=actor.id and archived_at is null for share;
 if company.id is null or company.status<>'active' then raise exception 'INVALID_TRANSITION'; end if;
 if p_id is not null then
   select * into opening from public.job_openings where id=p_id for update;
   if opening.id is null or opening.company_id<>company.id or opening.archived_at is not null then raise exception 'NOT_FOUND'; end if;
   if opening.version is distinct from p_version then raise exception 'CONFLICT_STALE_DATA'; end if;
   if opening.status not in ('draft','changes_requested') then raise exception 'INVALID_TRANSITION'; end if;
 else
   if p_version is not null then raise exception 'INVALID_INPUT'; end if;
 end if;
 if length(coalesce(p_title,''))>200 or length(coalesce(p_tasks,''))>5000 or length(coalesce(p_requirements,''))>5000
  or p_vacancies<=0 or length(coalesce(p_location,''))>200 or length(coalesce(p_modality,''))>100
  or length(coalesce(p_schedule,''))>500 or length(coalesce(p_contract_type,''))>100
  or length(coalesce(p_salary,''))>500 or length(coalesce(p_benefits,''))>2000
  or (p_closing_date is not null and p_closing_date < (clock_timestamp() at time zone 'America/Buenos_Aires')::date)
  or coalesce(array_length(p_categories,1),0)>20
  or coalesce(array_length(p_categories,1),0)<>coalesce((select count(distinct x) from unnest(p_categories) x),0)
  or exists(select 1 from unnest(p_categories) x left join public.job_categories c on c.id=x and c.active where c.id is null)
  then raise exception 'INVALID_INPUT'; end if;
 if p_id is null then
  insert into public.job_openings(company_id,title,tasks,requirements,vacancies,location,modality,schedule,contract_type,
   closing_date,salary,benefits,status)
  values(company.id,nullif(trim(p_title),''),nullif(trim(p_tasks),''),nullif(trim(p_requirements),''),p_vacancies,
   nullif(trim(p_location),''),nullif(trim(p_modality),''),nullif(trim(p_schedule),''),nullif(trim(p_contract_type),''),
   p_closing_date,nullif(trim(p_salary),''),nullif(trim(p_benefits),''),'draft') returning id into new_id;
  previous:=null;
 else
  new_id:=opening.id; previous:=opening.status;
  update public.job_openings set title=nullif(trim(p_title),''),tasks=nullif(trim(p_tasks),''),
   requirements=nullif(trim(p_requirements),''),vacancies=p_vacancies,location=nullif(trim(p_location),''),
   modality=nullif(trim(p_modality),''),schedule=nullif(trim(p_schedule),''),contract_type=nullif(trim(p_contract_type),''),
   closing_date=p_closing_date,salary=nullif(trim(p_salary),''),benefits=nullif(trim(p_benefits),'') where id=new_id;
 end if;
 delete from public.opening_categories where opening_id=new_id;
 insert into public.opening_categories(opening_id,category_id) select new_id,x from unnest(p_categories) x;
 perform private.record_event('job_openings',new_id,case when p_id is null then 'opening_created' else 'opening_updated' end,
  previous::text,(case when p_id is null then 'draft'::public.opening_status else previous end)::text,actor.id);
 return jsonb_build_object('id',new_id,'version',(select version from public.job_openings where id=new_id));
end $$;

create function public.my_company_profile() returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'company' then raise exception 'FORBIDDEN'; end if;
 select jsonb_build_object('id',c.id,'legalName',c.legal_name,'cuit',c.cuit_display,'responsibleName',c.responsible_name,
  'email',c.email,'phone',c.phone,'activity',c.activity,'locality',c.locality,'status',c.status,'version',c.version)
 into result from public.company_profiles c where c.account_id=actor.id and c.archived_at is null;
 return result;
end $$;

create function public.my_company_offers(p_page integer default 1,p_page_size integer default 10,p_id uuid default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; company public.company_profiles; safe_page integer; safe_size integer; result jsonb;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'company' then raise exception 'FORBIDDEN'; end if;
 select * into company from public.company_profiles where account_id=actor.id and archived_at is null;
 if company.id is null then raise exception 'NOT_FOUND'; end if;
 safe_page:=greatest(1,least(coalesce(p_page,1),10000)); safe_size:=greatest(1,least(coalesce(p_page_size,10),30));
 select jsonb_build_object('total',count(*),'page',safe_page,'pageSize',safe_size,
  'items',coalesce((select jsonb_agg(to_jsonb(x)) from (
    select o.id,o.title,o.tasks,o.requirements,o.vacancies,o.location,o.modality,o.schedule,o.contract_type,
      o.closing_date as "closingDate",o.salary,o.benefits,o.status,o.version,o.created_at as "createdAt",
      coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name',c.name) order by c.name)
       from public.opening_categories oc join public.job_categories c on c.id=oc.category_id where oc.opening_id=o.id),'[]'::jsonb) as categories,
      coalesce((select jsonb_agg(jsonb_build_object('decision',e.decision,'previousStatus',e.previous_status,
        'newStatus',e.new_status,'message',e.company_message,'at',e.created_at) order by e.created_at,e.id)
       from public.opening_moderation_events e where e.opening_id=o.id),'[]'::jsonb) as history
    from public.job_openings o where o.company_id=company.id and o.archived_at is null and (p_id is null or o.id=p_id)
    order by o.created_at desc,o.id desc limit safe_size offset (safe_page-1)*safe_size
  ) x),'[]'::jsonb)) into result
 from public.job_openings o where o.company_id=company.id and o.archived_at is null and (p_id is null or o.id=p_id);
 return result;
end $$;

revoke all on function public.bootstrap_company(text,text,text,text,text,text,text),
 public.save_company_profile(integer,text,text,text,text,text,text,text),
 public.save_company_opening(uuid,integer,text,text,text,integer,text,text,text,text,date,text,text,uuid[]),
 public.my_company_profile(),public.my_company_offers(integer,integer,uuid) from public,anon,authenticated,service_role;
grant execute on function public.bootstrap_company(text,text,text,text,text,text,text),
 public.save_company_profile(integer,text,text,text,text,text,text,text),
 public.save_company_opening(uuid,integer,text,text,text,integer,text,text,text,text,date,text,text,uuid[]),
 public.my_company_profile(),public.my_company_offers(integer,integer,uuid) to authenticated;
