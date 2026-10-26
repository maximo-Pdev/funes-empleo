begin;
-- S23: el consentimiento presencial se elimina; el perfil asistido se crea y activa
-- sin consentimiento, que solo se acepta como "Términos y condiciones" al registrarse.
drop function if exists public.create_active_assisted_candidate(jsonb,boolean,text,text,integer,uuid,text,text,text[]);
create function public.create_active_assisted_candidate(p_data jsonb,
 p_expected_version integer default null,p_review uuid default null,p_decision text default null,p_reason text default null,p_fields text[] default '{}')
returns jsonb language plpgsql security definer set search_path='' as $$
declare actor public.accounts; result jsonb; target uuid; current_version integer;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 -- Using/rejecting an existing match is not a new registration.
 if p_decision in ('use_or_update_existing','reject') then
   return public.save_assisted_candidate(null,p_expected_version,p_data,p_review,p_decision,p_reason,p_fields);
 end if;
 if jsonb_typeof(p_data) is distinct from 'object'
   or jsonb_typeof(p_data->'categories') is distinct from 'array'
   or jsonb_typeof(p_data->'interests') is distinct from 'array' then raise exception 'INVALID_INPUT'; end if;
 if nullif(btrim(p_data->>'locality'),'') is null or nullif(btrim(p_data->>'summary'),'') is null
   or p_data->>'availability' is distinct from 'available'
   or jsonb_array_length(p_data->'categories')+jsonb_array_length(p_data->'interests')=0 then raise exception 'INVALID_INPUT'; end if;
 result:=public.save_assisted_candidate(null,p_expected_version,p_data,p_review,p_decision,p_reason,p_fields);
 if result->>'status'<>'saved' then return result; end if;
 target:=(result->>'candidateId')::uuid;
 select version into current_version from public.candidate_profiles where id=target for update;
 current_version:=public.assisted_candidate_command(target,current_version,'activate');
 return result;
end $$;
revoke all on function public.create_active_assisted_candidate(jsonb,integer,uuid,text,text,text[])
 from public,anon,authenticated,service_role;
grant execute on function public.create_active_assisted_candidate(jsonb,integer,uuid,text,text,text[]) to authenticated;
notify pgrst, 'reload schema';
commit;
