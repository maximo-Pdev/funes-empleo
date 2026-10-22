begin;
create or replace function public.change_account_status(p_account uuid,p_version integer,p_command text,p_reason text,p_confirmed boolean) returns integer
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from auth.sessions where user_id=auth.uid() and id::text=auth.jwt()->>'session_id'
 and (not_after is null or not_after>now()) for share;
 if not found or private.current_account_id() is null then raise exception 'AUTH_REQUIRED'; end if;
 if not private.is_admin() then raise exception 'FORBIDDEN'; end if;
 return private.change_account_status(p_account,p_version,p_command,p_reason,p_confirmed);
end; $$;
revoke all on function public.change_account_status(uuid,integer,text,text,boolean) from public,anon,authenticated,service_role;
grant execute on function public.change_account_status(uuid,integer,text,text,boolean) to authenticated;
notify pgrst, 'reload schema';
commit;
