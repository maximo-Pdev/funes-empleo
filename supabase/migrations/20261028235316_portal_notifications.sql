begin;

-- Additive; no historical backfill. Recovery: disable audit_notification_fanout,
-- hide the UI and retain these rows and their source audit evidence.
create table public.account_notifications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default 'aviso-'||encode(extensions.gen_random_bytes(12),'hex')
    check(reference ~ '^aviso-[0-9a-f]{24}$'),
  recipient_account_id uuid not null references public.accounts(id) on delete restrict,
  source_event_id uuid not null references public.audit_events(id) on delete restrict,
  kind text not null check(kind in ('candidate_nominated','candidate_preinterview',
    'candidate_referred','candidate_hired','candidate_not_selected','company_referral',
    'company_published','company_rejected','admin_review','admin_application',
    'admin_hired_report','admin_not_selected_report','admin_company_registered')),
  resource_id uuid not null,
  created_at timestamptz not null,
  read_at timestamptz,
  unique(recipient_account_id,source_event_id,kind)
);
create index account_notifications_chronology on public.account_notifications
  (recipient_account_id,created_at desc,id desc);
create index account_notifications_unread on public.account_notifications(recipient_account_id)
  where read_at is null;
alter table public.account_notifications enable row level security;
revoke all on public.account_notifications from public,anon,authenticated,service_role;
create policy notifications_own on public.account_notifications for select to authenticated
  using(recipient_account_id=(select private.current_account_id()));

create function private.emit_account_notification(p_source public.audit_events,p_recipient uuid,
  p_kind text,p_resource uuid) returns void
language sql security definer set search_path='' as $$
  insert into public.account_notifications(recipient_account_id,source_event_id,kind,resource_id,created_at)
  select a.id,(p_source).id,p_kind,p_resource,(p_source).occurred_at
  from public.accounts a where a.id=p_recipient and a.status<>'archived'
  on conflict(recipient_account_id,source_event_id,kind) do nothing
$$;

create function private.fanout_audit_notification() returns trigger
language plpgsql security definer set search_path='' as $$
declare part public.participations; candidate_account uuid; company_account uuid;
  employee record; notice_kind text; resource uuid;
begin
  if new.entity_type='participations' and new.action='participation_created' then
    select * into part from public.participations where id=new.entity_id;
    if part.origin='admin_nomination' then
      select account_id into candidate_account from public.candidate_profiles where id=part.candidate_id;
      perform private.emit_account_notification(new,candidate_account,'candidate_nominated',part.id);
    elsif part.origin='self_application' then
      notice_kind:='admin_application'; resource:=part.id;
    end if;
  elsif new.entity_type='preinterviews' and new.action='preinterview_recorded' then
    select p.* into part from public.preinterviews i join public.participations p on p.id=i.participation_id where i.id=new.entity_id;
    select account_id into candidate_account from public.candidate_profiles where id=part.candidate_id;
    perform private.emit_account_notification(new,candidate_account,'candidate_preinterview',new.entity_id);
  elsif new.entity_type='referrals' and new.action='referral_created' then
    -- This event precedes the final participation status update. Do not gate on status.
    select p.* into part from public.referrals r join public.participations p on p.id=r.participation_id where r.id=new.entity_id;
    select account_id into candidate_account from public.candidate_profiles where id=part.candidate_id;
    select c.account_id into company_account from public.job_openings o join public.company_profiles c on c.id=o.company_id where o.id=part.opening_id;
    perform private.emit_account_notification(new,candidate_account,'candidate_referred',new.entity_id);
    perform private.emit_account_notification(new,company_account,'company_referral',new.entity_id);
  elsif new.entity_type='participations' and new.action in ('outcome_confirmed','outcome_corrected')
    and new.new_state in ('hired','not_selected') then
    select * into part from public.participations where id=new.entity_id;
    select account_id into candidate_account from public.candidate_profiles where id=part.candidate_id;
    perform private.emit_account_notification(new,candidate_account,
      case new.new_state when 'hired' then 'candidate_hired' else 'candidate_not_selected' end,part.id);
  elsif new.entity_type='job_openings' and new.action='opening_submitted' then
    notice_kind:='admin_review'; resource:=new.entity_id;
  elsif new.entity_type='job_openings' and new.action in ('opening_approved','opening_rejected') then
    select c.account_id into company_account from public.job_openings o join public.company_profiles c on c.id=o.company_id where o.id=new.entity_id;
    perform private.emit_account_notification(new,company_account,
      case new.action when 'opening_approved' then 'company_published' else 'company_rejected' end,new.entity_id);
  elsif new.entity_type='company_feedback' and new.action='feedback_recorded' then
    select case f.reported_outcome when 'hired' then 'admin_hired_report' when 'not_selected' then 'admin_not_selected_report' end,
      f.id into notice_kind,resource from public.company_feedback f where f.id=new.entity_id;
  elsif new.entity_type='company_profiles' and new.action='profile_created' then
    notice_kind:='admin_company_registered'; resource:=new.entity_id;
  end if;
  if notice_kind is not null then
    for employee in select id from public.accounts where role='admin' and status='active' loop
      perform private.emit_account_notification(new,employee.id,notice_kind,resource);
    end loop;
  end if;
  return new;
end $$;
create trigger audit_notification_fanout after insert on public.audit_events
for each row execute function private.fanout_audit_notification();

-- Resolve live ownership and archive boundaries. No stored subject or personal snapshot.
create function private.account_notification_payload(n public.account_notifications,actor public.accounts)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare part public.participations; opening public.job_openings; company public.company_profiles;
  candidate public.candidate_profiles; reference text; referral_ref text;
  target_kind text; subject text; target jsonb:=null; available boolean:=false;
begin
  if n.recipient_account_id is distinct from actor.id then raise exception 'NOT_FOUND'; end if;
  if n.kind='admin_company_registered' and actor.role='admin' then
    select * into company from public.company_profiles where id=n.resource_id and archived_at is null;
    if company.id is not null then
      select r.reference into reference from private.record_references r where r.kind='company' and r.entity_id=company.id;
      subject:=company.legal_name; target_kind:='admin_company';
    end if;
  elsif n.kind in ('company_published','company_rejected','admin_review') then
    select * into opening from public.job_openings where id=n.resource_id and archived_at is null;
    select * into company from public.company_profiles where id=opening.company_id and archived_at is null;
    if opening.id is not null and company.id is not null and
      ((actor.role='admin' and n.kind='admin_review') or (actor.role='company' and company.account_id=actor.id and company.status='active')) then
      select r.reference into reference from private.record_references r where r.kind='opening' and r.entity_id=opening.id;
      subject:=opening.title; target_kind:=case actor.role when 'admin' then 'admin_opening' else 'company_opening' end;
    end if;
  else
    if n.kind in ('candidate_referred','company_referral') then
      select p.* into part from public.referrals r join public.participations p on p.id=r.participation_id where r.id=n.resource_id and r.archived_at is null;
      select r.reference into referral_ref from private.record_references r where r.kind='referral' and r.entity_id=n.resource_id;
    elsif n.kind='candidate_preinterview' then
      select p.* into part from public.preinterviews i join public.participations p on p.id=i.participation_id where i.id=n.resource_id and i.archived_at is null;
    elsif n.kind in ('admin_hired_report','admin_not_selected_report') then
      select p.* into part from public.company_feedback f join public.referrals r on r.id=f.referral_id
        join public.participations p on p.id=r.participation_id where f.id=n.resource_id and r.archived_at is null;
    else
      select * into part from public.participations where id=n.resource_id;
    end if;
    select * into candidate from public.candidate_profiles where id=part.candidate_id and archived_at is null;
    select * into opening from public.job_openings where id=part.opening_id and archived_at is null;
    select * into company from public.company_profiles where id=opening.company_id and archived_at is null;
    if part.id is not null and part.archived_at is null and candidate.id is not null and opening.id is not null and
      ((actor.role='candidate' and candidate.account_id=actor.id and n.kind like 'candidate_%')
        or (actor.role='admin' and n.kind like 'admin_%')
        or (actor.role='company' and n.kind='company_referral' and company.account_id=actor.id and company.status='active')) then
      subject:=opening.title;
      target_kind:=case actor.role when 'candidate' then 'candidate_participation' when 'admin' then 'admin_participation' else 'company_referral' end;
      select r.reference into reference from private.record_references r
        where r.kind=case actor.role when 'company' then 'opening' else 'participation' end
        and r.entity_id=case actor.role when 'company' then opening.id else part.id end;
    end if;
  end if;
  available:=reference is not null and target_kind is not null;
  if available then
    target:=jsonb_build_object('kind',target_kind,'reference',reference);
    if target_kind='company_referral' then target:=target||jsonb_build_object('referral',referral_ref); end if;
  end if;
  return jsonb_build_object('reference',n.reference,'kind',n.kind,'createdAt',n.created_at,
    'readAt',n.read_at,'available',available,'subject',case when available then subject else null end,'target',target);
end $$;

create function public.list_my_notifications(p_page integer default 1,p_page_size integer default 20)
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb;
begin
  actor:=private.require_workflow_actor();
  if p_page is null or p_page not between 1 and 10000 or p_page_size is null or p_page_size not between 1 and 20 then raise exception 'INVALID_INPUT'; end if;
  select jsonb_build_object('total',count(*),'unread',count(*) filter(where read_at is null),
    'page',p_page,'pageSize',p_page_size,'items',coalesce((
      select jsonb_agg(private.account_notification_payload(item,actor) order by item.created_at desc,item.id desc)
      from (select * from public.account_notifications where recipient_account_id=actor.id
        order by created_at desc,id desc limit p_page_size offset (p_page-1)*p_page_size) item
    ),'[]'::jsonb)) into result from public.account_notifications where recipient_account_id=actor.id;
  return result;
end $$;

create function public.open_my_notification(p_reference text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; item public.account_notifications;
begin
  actor:=private.require_workflow_actor();
  if p_reference is null or p_reference !~ '^aviso-[0-9a-f]{24}$' then raise exception 'NOT_FOUND'; end if;
  update public.account_notifications set read_at=coalesce(read_at,clock_timestamp())
    where reference=p_reference and recipient_account_id=actor.id returning * into item;
  if item.id is null then raise exception 'NOT_FOUND'; end if;
  return private.account_notification_payload(item,actor);
end $$;

create function public.my_candidate_preinterview_agenda() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb;
begin
  actor:=private.require_workflow_actor();
  if actor.role<>'candidate' then raise exception 'FORBIDDEN'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('reference',r.reference,'scheduledAt',i.scheduled_at,
    'heldAt',i.held_at,'channel',i.channel) order by i.created_at desc,i.id desc),'[]'::jsonb) into result
    from public.preinterviews i join public.participations p on p.id=i.participation_id
    join public.candidate_profiles c on c.id=p.candidate_id
    join private.record_references r on r.kind='participation' and r.entity_id=p.id
    where c.account_id=actor.id and c.archived_at is null and p.archived_at is null and i.archived_at is null;
  return result;
end $$;
revoke all on function private.emit_account_notification(public.audit_events,uuid,text,uuid),
 private.fanout_audit_notification(),private.account_notification_payload(public.account_notifications,public.accounts)
 from public,anon,authenticated,service_role;
revoke all on function public.list_my_notifications(integer,integer),public.open_my_notification(text),
 public.my_candidate_preinterview_agenda() from public,anon,authenticated,service_role;
grant execute on function public.list_my_notifications(integer,integer),public.open_my_notification(text),
 public.my_candidate_preinterview_agenda() to authenticated;
notify pgrst,'reload schema';
commit;
