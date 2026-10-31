-- T7/S7: additive course links and independent municipal referral history.
-- Recovery: roll application back, revoke EXECUTE on the two new commands and
-- disable publication through a reviewed corrective migration. Preserve courses,
-- immutable referrals and audit events; never DROP populated tables or reset data.
create function private.valid_course_url(p_url text) returns boolean
language sql immutable set search_path='' as $$
 select p_url is not null and length(p_url) between 1 and 2048
  and p_url ~* '^https://([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}([/?#][^[:space:]]*)?$'
  and position(chr(92) in p_url)=0
  and p_url !~* '%(0[0-9a-f]|1[0-9a-f]|7f)'
$$;
revoke all on function private.valid_course_url(text) from public,anon,authenticated,service_role;

create table public.municipal_courses (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(trim(title)) between 1 and 200),
 url text not null check(private.valid_course_url(url)),
 published boolean not null,
 created_at timestamptz not null default clock_timestamp(),
 created_by uuid not null references public.accounts(id) on delete restrict
);
create table public.course_referrals (
 id uuid primary key default gen_random_uuid(),
 candidate_id uuid not null references public.candidate_profiles(id) on delete restrict,
 course_id uuid not null references public.municipal_courses(id) on delete restrict,
 -- Snapshot the administrator-supplied metadata; later edits cannot rewrite history.
 course_title text not null check(length(trim(course_title)) between 1 and 200),
 course_url text not null check(private.valid_course_url(course_url)),
 referred_at timestamptz not null default clock_timestamp(),
 referred_by uuid not null references public.accounts(id) on delete restrict
);
create index course_referral_candidate_history on public.course_referrals(candidate_id,referred_at desc,id desc);
create trigger course_referral_append_only before update or delete on public.course_referrals
 for each row execute function private.deny_history_change();
create trigger course_preserve_record before delete on public.municipal_courses
 for each row execute function private.deny_history_change();
alter table public.municipal_courses enable row level security;
alter table public.course_referrals enable row level security;
revoke all on public.municipal_courses,public.course_referrals from public,anon,authenticated,service_role;
grant select(id,title,url,published) on public.municipal_courses to anon,authenticated;
grant select on public.course_referrals to authenticated;
create policy published_course_links on public.municipal_courses for select to anon,authenticated using(published);
create policy admin_course_links on public.municipal_courses for select to authenticated using(private.is_admin());
create policy admin_course_history on public.course_referrals for select to authenticated using(private.is_admin());

-- Extend rather than replace the current audit allowlist, preserving actions from
-- earlier additive migrations (including concurrently developed account features).
do $$
declare existing_check text;
begin
 select pg_get_expr(conbin,conrelid) into strict existing_check from pg_constraint
 where conrelid='public.audit_events'::regclass and conname='audit_events_action_check';
 alter table public.audit_events drop constraint audit_events_action_check;
 execute format('alter table public.audit_events add constraint audit_events_action_check check ((%s) or action in (''course_link_created'',''course_link_updated''))',existing_check);
end $$;

create function public.save_municipal_course(p_title text,p_url text,p_published boolean,p_course uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.accounts; course_id uuid;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 if p_title is null or length(trim(p_title)) not between 1 and 200
  or not private.valid_course_url(p_url) or p_published is null then raise exception 'INVALID_INPUT'; end if;
 if p_course is null then
  insert into public.municipal_courses(title,url,published,created_by)
   values(trim(p_title),p_url,p_published,actor.id) returning id into course_id;
 else
  select id into course_id from public.municipal_courses where id=p_course for update;
  if course_id is null then raise exception 'NOT_FOUND'; end if;
  update public.municipal_courses set title=trim(p_title),url=p_url,published=p_published where id=course_id;
 end if;
 perform private.workflow_event('municipal_courses',course_id,
  case when p_course is null then 'course_link_created' else 'course_link_updated' end,
  null,case when p_published then 'published' else 'unpublished' end,actor.id);
 return course_id;
end $$;

create function public.create_course_referral(p_candidate uuid,p_course uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.accounts; candidate public.candidate_profiles; course public.municipal_courses; referral_id uuid;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 select * into candidate from public.candidate_profiles where id=p_candidate for share;
 if candidate.id is null then raise exception 'NOT_FOUND'; end if;
 if candidate.archived_at is not null or candidate.status='archived' then raise exception 'INVALID_TRANSITION'; end if;
 select * into course from public.municipal_courses where id=p_course for share;
 if course.id is null then raise exception 'NOT_FOUND'; end if;
 if not course.published then raise exception 'INVALID_TRANSITION'; end if;
 -- No participation, job opening, CV, enrollment or company access is involved.
 insert into public.course_referrals(candidate_id,course_id,course_title,course_url,referred_by)
  values(candidate.id,course.id,course.title,course.url,actor.id) returning id into referral_id;
 perform private.workflow_event('course_referrals',referral_id,'referral_created',null,'recorded',actor.id);
 return referral_id;
end $$;
revoke all on function public.save_municipal_course(text,text,boolean,uuid),public.create_course_referral(uuid,uuid)
 from public,anon,authenticated,service_role;
grant execute on function public.save_municipal_course(text,text,boolean,uuid),public.create_course_referral(uuid,uuid) to authenticated;
