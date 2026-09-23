-- T012/T015: a correctly signed but revoked JWT must not retain private DB access.
create function private.has_live_session() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.sessions s where s.user_id=auth.uid()
 and s.id::text=auth.jwt()->>'session_id' and (s.not_after is null or s.not_after>now()))
$$;
create or replace function private.current_account_id() returns uuid language sql stable security definer set search_path='' as $$
 select id from public.accounts where auth_user_id=auth.uid() and status='active' and private.has_live_session()
$$;
create or replace function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.accounts where auth_user_id=auth.uid() and status='active' and role='admin' and private.has_live_session())
$$;
create or replace function public.my_account_status() returns table(id uuid,role public.account_role,status public.account_status,version integer)
language sql stable security definer set search_path='' as $$
 select a.id,a.role,a.status,a.version from public.accounts a where a.auth_user_id=auth.uid() and private.has_live_session()
$$;

-- Wrapper validates the live session before the serialized/locked transition. The implementation
-- remains private and cannot be invoked through the Data API or by application/secret roles.
alter function public.change_account_status(uuid,integer,text,text,boolean) set schema private;
revoke all on function private.change_account_status(uuid,integer,text,text,boolean) from public,anon,authenticated,service_role;
create function public.change_account_status(p_account uuid,p_version integer,p_command text,p_reason text,p_confirmed boolean) returns integer
language plpgsql security definer set search_path='' as $$
begin
 -- Lock the Auth session against concurrent logout/deletion through completion of this command.
 perform 1 from auth.sessions where user_id=auth.uid() and id::text=auth.jwt()->>'session_id'
 and (not_after is null or not_after>now()) for share;
 if not found then raise exception 'AUTH_REQUIRED'; end if;
 return private.change_account_status(p_account,p_version,p_command,p_reason,p_confirmed);
end; $$;
revoke all on function public.change_account_status(uuid,integer,text,text,boolean) from public,anon,service_role;
grant execute on function public.change_account_status(uuid,integer,text,text,boolean) to authenticated;
revoke all on function private.has_live_session() from public,anon,service_role;
grant execute on function private.has_live_session() to authenticated;

alter table public.cv_documents add constraint cv_exact_opaque_path check(storage_path=candidate_id::text||'/'||id::text||'.pdf');
