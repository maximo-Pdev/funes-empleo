-- Safe replacement for the historical maintenance entrypoint, NOT a product migration.
-- Applying this refusal to an already installed demo requires separate authorization.
-- No Auth deletion, fixture SQL execution, locks or business-data changes.
create or replace function private.reset_fictitious_demo(
  environment text, project_ref text, confirmation text, seed_sql text
) returns jsonb language plpgsql security invoker set search_path='' as $reset$
begin
  raise exception 'HOSTED_RESET_DISABLED'
    using hint = 'No ejecutar SQL generado previamente. Consultar docs/operations/demo-credentials.md y revisar un reset que preserve Auth; usar reset-local.mjs solo en local aislado.';
end $reset$;
revoke all on function private.reset_fictitious_demo(text,text,text,text) from public,anon,authenticated,service_role;
