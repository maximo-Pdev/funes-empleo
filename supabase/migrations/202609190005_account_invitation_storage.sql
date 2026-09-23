-- Forward-only addition after local verification of 001–004.
create table private.admin_invitations (
 token uuid primary key default gen_random_uuid(), email_hash text not null,
 created_by uuid not null references public.accounts(id), expires_at timestamptz not null default now()+interval '15 minutes',
 consumed_at timestamptz
);
revoke all on private.admin_invitations from public,anon,authenticated,service_role;
create function public.reserve_administrator_invitation(p_email text,p_actor uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare nonce uuid;
begin
 if not exists(select 1 from public.accounts where id=p_actor and role='admin' and status='active' for share) then raise exception 'FORBIDDEN'; end if;
 if p_email is null or length(p_email)>320 or p_email not like '%@%' then raise exception 'INVALID_INPUT'; end if;
 insert into private.admin_invitations(email_hash,created_by) values(encode(extensions.digest(lower(p_email),'sha256'),'hex'),p_actor) returning token into nonce;
 return nonce;
end; $$;
revoke all on function public.reserve_administrator_invitation(text,uuid) from public,anon,authenticated;
grant execute on function public.reserve_administrator_invitation(text,uuid) to service_role;

create or replace function private.on_auth_user() returns trigger language plpgsql security definer set search_path='' as $$
declare chosen public.account_role; aid uuid; actor uuid; invitation_actor uuid;
begin
 if tg_op='INSERT' then
   update private.admin_invitations set consumed_at=clock_timestamp()
   where token::text=new.raw_user_meta_data->>'portal_invitation' and email_hash=encode(extensions.digest(lower(new.email),'sha256'),'hex')
   and consumed_at is null and expires_at>clock_timestamp() returning created_by into invitation_actor;
   if new.raw_app_meta_data->>'portal_role'='admin' or invitation_actor is not null then chosen:='admin';
   elsif new.raw_user_meta_data->>'role' in ('candidate','company') then chosen:=(new.raw_user_meta_data->>'role')::public.account_role;
   else raise exception 'INVALID_INPUT'; end if;
   insert into public.accounts(id,auth_user_id,role,status)
   values(new.id,new.id,chosen,case when new.email_confirmed_at is null then 'pending_verification'::public.account_status else 'active'::public.account_status end) returning id into aid;
   actor:=coalesce(invitation_actor,nullif(new.raw_app_meta_data->>'provisioned_by','')::uuid,aid);
   perform private.record_event('accounts',aid,case when chosen='admin' then 'admin_provisioned' else 'account_created' end,null,case when new.email_confirmed_at is null then 'pending_verification' else 'active' end,actor);
 elsif old.email_confirmed_at is null and new.email_confirmed_at is not null then
   update public.accounts set status='active' where auth_user_id=new.id and status='pending_verification' returning id into aid;
   if aid is not null then perform private.record_event('accounts',aid,'account_verified','pending_verification','active',aid); end if;
 end if;
 return new;
end; $$;

-- Definer projection prevents raw CV metadata being exposed to a company just for downloading.
create function private.can_read_cv_path(p_path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.cv_documents d where d.storage_path=p_path and private.can_read_cv(d.id))
$$;
revoke all on function private.can_read_cv_path(text) from public,anon,service_role;
grant execute on function private.can_read_cv_path(text) to authenticated;
drop policy cv_authenticated_download on storage.objects;
create policy cv_authenticated_download on storage.objects for select to authenticated using (
 bucket_id='candidate-cvs' and storage.allow_only_operation('object.get_authenticated') and private.can_read_cv_path(name)
);
