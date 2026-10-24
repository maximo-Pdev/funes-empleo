-- EXTRA062. Existing signatures/grants; no data backfill or permission revival.
-- Recovery: restore these three previous function definitions after rolling back
-- application code. Keep all rows, decisions, consents, slugs and final outcomes.
begin;

create or replace function public.transition_opening(p_opening uuid, p_expected_version integer, p_command text,
  p_reason text default null, p_company_message text default null) returns integer
language plpgsql security definer set search_path = '' as $$
declare actor public.accounts; opening public.job_openings; company public.company_profiles;
  company_account public.accounts; next_state public.opening_status; decision text; action text;
  decision_id uuid; previous public.opening_status; item public.participations;
  complete boolean; deadline timestamptz; must_reason boolean;
begin
  actor := private.require_workflow_actor();
  select * into opening from public.job_openings where id = p_opening for update;
  if opening.id is null or opening.archived_at is not null then raise exception 'NOT_FOUND'; end if;
  select * into company from public.company_profiles where id = opening.company_id for share;
  select * into company_account from public.accounts where id = company.account_id for share;
  if actor.role <> 'admin' and (actor.role <> 'company' or actor.id <> company.account_id) then raise exception 'NOT_FOUND'; end if;
  if opening.version is distinct from p_expected_version then raise exception 'CONFLICT_STALE_DATA'; end if;
  if p_command = 'submit' then
    if actor.role <> 'company' then raise exception 'FORBIDDEN'; end if;
  elsif p_command = 'cancel' and actor.role = 'company' then
    if company.status <> 'active' or company.archived_at is not null or company_account.status <> 'active' then raise exception 'INVALID_TRANSITION'; end if;
  elsif actor.role <> 'admin' then raise exception 'FORBIDDEN'; end if;
  if p_command not in ('submit','approve','request_changes','reject','pause','resume','close','suspend','restore_to_draft','cancel') then raise exception 'INVALID_INPUT'; end if;
  must_reason := p_command in ('reject','pause','close','suspend','restore_to_draft','cancel');
  if must_reason and (p_reason is null or length(trim(p_reason)) not between 1 and 1000) then raise exception 'INVALID_INPUT'; end if;
  if p_command in ('request_changes','reject') and (p_company_message is null or length(trim(p_company_message)) not between 1 and 2000) then raise exception 'INVALID_INPUT'; end if;
  if p_command not in ('request_changes','reject') and nullif(trim(coalesce(p_company_message,'')),'') is not null then raise exception 'INVALID_INPUT'; end if;
  complete := opening.title is not null and opening.tasks is not null and opening.requirements is not null
    and opening.vacancies is not null and opening.location is not null and opening.modality is not null
    and opening.schedule is not null and opening.contract_type is not null and opening.closing_date is not null
    and exists (select 1 from public.opening_categories oc join public.job_categories jc on jc.id = oc.category_id
      where oc.opening_id = opening.id and jc.active);
  deadline := ((opening.closing_date + 1)::timestamp at time zone 'America/Buenos_Aires');
  previous := opening.status;
  case p_command
    when 'submit' then
      if opening.status not in ('draft','changes_requested','published') then raise exception 'INVALID_TRANSITION'; end if;
      if company.status <> 'active' or company_account.status <> 'active' or not complete or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'pending_review'; decision := 'submitted'; action := 'opening_submitted';
    when 'approve' then
      if opening.status <> 'pending_review' or company.status <> 'active' or company_account.status <> 'active' or not complete or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'published'; decision := 'approved'; action := 'opening_approved';
    when 'request_changes' then
      if opening.status <> 'pending_review' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'changes_requested'; decision := 'changes_requested'; action := 'opening_changes_requested';
    when 'reject' then
      if opening.status <> 'pending_review' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'rejected'; decision := 'rejected'; action := 'opening_rejected';
    when 'pause' then
      if opening.status <> 'published' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'paused'; decision := 'paused'; action := 'opening_paused';
    when 'resume' then
      if opening.status <> 'paused' or company.status <> 'active' or company_account.status <> 'active' or not complete or deadline <= clock_timestamp() then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'published'; decision := 'resumed'; action := 'opening_resumed';
    when 'close' then
      if opening.status not in ('published','paused') then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'closed'; decision := 'closed'; action := 'opening_closed';
    when 'suspend' then
      if opening.status in ('closed','rejected','cancelled','suspended') then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'suspended'; decision := 'suspended'; action := 'opening_suspended';
    when 'restore_to_draft' then
      if opening.status <> 'suspended' then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'draft'; decision := 'restored_to_draft'; action := 'opening_restored';
    when 'cancel' then
      if opening.status in ('closed','rejected','cancelled') then raise exception 'INVALID_TRANSITION'; end if;
      next_state := 'cancelled'; decision := 'cancelled'; action := 'opening_cancelled';
  end case;
  if nullif(trim(coalesce(p_reason,'')),'') is not null then
    decision_id := private.workflow_reason('job_openings', opening.id, p_command, p_reason, actor.id);
  end if;
  update public.job_openings set status = next_state,
    moderation_message_public = case when p_command in ('request_changes','reject') then trim(p_company_message) end,
    published_at = case when p_command = 'approve' then clock_timestamp() else published_at end,
    closed_at = case when p_command in ('close','cancel') then clock_timestamp() else closed_at end
  where id = opening.id;
  insert into public.opening_moderation_events(opening_id,decision,previous_status,new_status,
    company_message,internal_reason,actor_type,actor_account_id)
  values (opening.id,decision,previous,next_state,
    case when p_command in ('request_changes','reject') then trim(p_company_message) end,
    nullif(trim(coalesce(p_reason,'')),''),'account',actor.id);
  perform private.workflow_event('job_openings',opening.id,action,previous::text,next_state::text,
    actor.id,case when decision_id is not null then 'decision_recorded' end,decision_id);
  if p_command = 'cancel' then
    for item in select * from public.participations where opening_id = opening.id
      and archived_at is null and status not in ('hired','not_selected','withdrawn','cancelled','no_company_response') for update
    loop
      update public.participations set status = 'cancelled', final_outcome_at = clock_timestamp(),
        final_outcome_by = actor.id where id = item.id;
      perform private.revoke_workflow_referral(item.id,actor.id,'process_cancelled',decision_id);
      perform private.workflow_event('participations',item.id,'outcome_confirmed',item.status::text,'cancelled',actor.id,'opening_cancelled',decision_id);
    end loop;
  end if;
  return opening.version + 1;
end $$;

create or replace function public.save_company_opening(p_id uuid,p_version integer,p_title text,p_tasks text,p_requirements text,
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
   if opening.status not in ('draft','changes_requested','published') then raise exception 'INVALID_TRANSITION'; end if;
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
 if previous = 'published' then
  perform public.transition_opening(new_id,(select version from public.job_openings where id=new_id),'submit');
 end if;
 return jsonb_build_object('id',new_id,'version',(select version from public.job_openings where id=new_id),
  'status',(select status from public.job_openings where id=new_id));
end $$;

create or replace function public.company_referral(p_referral uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare actor uuid; r public.referrals; p public.participations;
  o public.job_openings; cp public.candidate_profiles; company public.company_profiles;
  result jsonb;
begin
  actor := private.current_account_id();
  select * into r from public.referrals where id = p_referral;
  if actor is null or r.id is null then raise exception 'NOT_FOUND'; end if;
  select * into p from public.participations where id = r.participation_id;
  select * into o from public.job_openings where id = p.opening_id;
  select * into company from public.company_profiles where id = o.company_id;
  if company.id is null or company.account_id <> actor or company.status <> 'active' or company.archived_at is not null
    or not exists(select 1 from public.accounts a where a.id=actor and a.role='company' and a.status='active')
    or o.archived_at is not null or p.archived_at is not null or r.archived_at is not null
  then raise exception 'NOT_FOUND'; end if;
  result := jsonb_build_object('referralId', r.id, 'openingId', o.id,
    'openingTitle', o.title, 'referredAt', r.referred_at);
  select * into cp from public.candidate_profiles where id = p.candidate_id;
  if p.status = 'hired' and cp.id is not null then
    result := result || jsonb_build_object('hiredCandidate',jsonb_build_object('displayName',cp.display_name,'outcome','hired'));
  end if;
  if not private.can_company_read_referral(r.id) then return result; end if;
  return result || jsonb_build_object(
    'participationVersion', p.version,
    'candidate', jsonb_build_object(
      'displayName', cp.display_name,
      'locality', cp.locality,
      'skillsExperienceSummary', cp.skills_experience_summary,
      'availability', cp.availability,
      'categories', coalesce((select jsonb_agg(jsonb_build_object('name',jc.name,'kind',cc.kind) order by jc.name)
        from public.candidate_categories cc join public.job_categories jc on jc.id = cc.category_id
        where cc.candidate_id = cp.id), '[]'::jsonb),
      'contacts', coalesce((select jsonb_agg(jsonb_build_object('kind',ct.kind,'value',ct.value) order by ct.kind,ct.id)
        from public.candidate_contacts ct where ct.candidate_id = cp.id and ct.archived_at is null), '[]'::jsonb),
      'cvDocumentId', r.cv_document_id),
    'interviews', coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'scheduledAt',i.scheduled_at,
        'heldAt',i.held_at,'status',i.status,'companyMessage',i.company_message) order by i.created_at,i.id)
      from public.company_interviews i where i.referral_id = r.id and i.archived_at is null), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(jsonb_build_object('id',f.id,'reportedOutcome',f.reported_outcome,
        'message',f.message,'reportedAt',f.reported_at,'reviewStatus',f.review_status) order by f.reported_at,f.id)
      from public.company_feedback f where f.referral_id = r.id), '[]'::jsonb)
  );
end $$;

revoke all on function public.transition_opening(uuid,integer,text,text,text),
 public.save_company_opening(uuid,integer,text,text,text,integer,text,text,text,text,date,text,text,uuid[]),
 public.company_referral(uuid) from public,anon,authenticated,service_role;
grant execute on function public.transition_opening(uuid,integer,text,text,text),
 public.save_company_opening(uuid,integer,text,text,text,integer,text,text,text,text,date,text,text,uuid[]),
 public.company_referral(uuid) to authenticated;
notify pgrst, 'reload schema';
commit;
