-- Review: show authorized labor values and explicit patch fields before confirmation.
-- Identity/contact values remain masked. Forward-only, no history deletion.
create index import_row_dni_lookup on public.import_rows(batch_id,(regexp_replace(normalized_payload->>'dni','[. ]','','g')))
 where decision is distinct from 'reject';
create index import_row_email_lookup on public.import_rows(batch_id,(lower(trim(normalized_payload->>'email'))))
 where decision is distinct from 'reject';
create or replace function public.import_batch_preview(p_batch uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b public.import_batches; rows jsonb;
begin
 perform private.import_admin();
 select * into b from public.import_batches where id=p_batch;
 if b.id is null then raise exception 'NOT_FOUND'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'number',r.row_number,'status',r.status,'errors',r.error_codes,
   'decision',r.decision,'fields',r.confirmed_fields,'name',r.normalized_payload->>'name',
   'locality',r.normalized_payload->>'locality','summary',r.normalized_payload->>'summary',
   'categories',r.normalized_payload->'categories','availability',r.normalized_payload->>'availability',
   'dni','***'||right(r.normalized_payload->>'dni',3),
   'email',case when nullif(r.normalized_payload->>'email','') is null then '' else '***@***' end,
   'phone',case when nullif(r.normalized_payload->>'phone','') is null then '' else '***'||right(r.normalized_payload->>'phone',2) end,
   'matches',coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'version',p.version))
      from private.assisted_matches(regexp_replace(r.normalized_payload->>'dni','[. ]','','g'),lower(trim(r.normalized_payload->>'email'))) m
      join public.candidate_profiles p on p.id=m.candidate_id),'[]')) order by r.row_number),'[]') into rows
 from public.import_rows r where batch_id=b.id;
 return jsonb_build_object('id',b.id,'version',b.version,'hash',b.file_sha256,'mapping',b.mapping_version,'status',b.status,
   'total',b.total_rows,'valid',b.valid_rows,'invalid',b.invalid_rows,'duplicates',b.duplicate_rows,
   'failure',b.failure_code,'retryOf',b.retry_of_batch_id,'rows',rows);
end $$;
