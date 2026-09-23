-- Forward-only T010 correction: self-requested archive has a controlled reason code too.
create function private.complete_self_archive_reason() returns trigger language plpgsql set search_path='' as $$
begin
 if new.status='archived' and new.archive_reason is null and old.status<>'archived' then
   new.archive_reason:='self_requested';
 end if;
 return new;
end; $$;
revoke all on function private.complete_self_archive_reason() from public,anon,authenticated,service_role;
create trigger account_archive_reason before update on public.accounts
for each row execute function private.complete_self_archive_reason();
alter table public.accounts add constraint account_archive_reason_complete
 check((status='archived')=(archive_reason is not null));
