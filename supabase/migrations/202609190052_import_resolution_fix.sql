-- Local pgTAP found ambiguous decision variable in 050 after successful application.
-- Forward-only correction; no partial DDL/data remained (test transaction rolled back).
create or replace function public.resolve_import_row(p_batch uuid,p_version integer,p_row uuid,p_decision text,p_reason text,
 p_data jsonb,p_candidate uuid,p_candidate_version integer,p_fields text[])
returns void language plpgsql security definer set search_path='' as $$
declare actor public.accounts; b public.import_batches; r public.import_rows; decision_ref uuid;
begin
 actor:=private.import_admin();
 select * into b from public.import_batches where id=p_batch for update;
 if b.id is null then raise exception 'NOT_FOUND'; end if;
 if b.version is distinct from p_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 if b.status not in ('blocked','preview_ready') then raise exception 'INVALID_TRANSITION'; end if;
 select * into r from public.import_rows where id=p_row and batch_id=b.id for update;
 if r.id is null then raise exception 'NOT_FOUND'; end if;
 if p_decision is null or p_decision not in ('use_or_update_existing','correct_and_create','reject')
   or p_fields is null or not (p_fields <@ array['name','dni','email','phone','locality','categories','summary','availability'])
 then raise exception 'INVALID_INPUT'; end if;
 if p_decision='use_or_update_existing' then
   if not exists(select 1 from private.assisted_matches(regexp_replace(r.normalized_payload->>'dni','[. ]','','g'),
     lower(trim(r.normalized_payload->>'email'))) m where m.candidate_id=p_candidate) then raise exception 'INVALID_INPUT'; end if;
   if p_data is not null then raise exception 'INVALID_INPUT'; end if;
 elsif p_decision='correct_and_create' then
   if cardinality(private.import_errors(p_data))>0 then raise exception 'INVALID_INPUT'; end if;
 elsif p_data is not null then raise exception 'INVALID_INPUT'; end if;
 decision_ref:=private.workflow_reason('import_rows',r.id,p_decision,p_reason,actor.id);
 update public.import_rows set decision=p_decision,decision_id=decision_ref,
   target_candidate_id=case when p_decision='use_or_update_existing' then p_candidate else null end,
   target_version=case when p_decision='use_or_update_existing' then p_candidate_version else null end,
   confirmed_fields=case when p_decision='use_or_update_existing' then p_fields else '{}' end,
   normalized_payload=case when p_decision='correct_and_create' then p_data else normalized_payload end where id=r.id;
 perform private.workflow_event('import_rows',r.id,'duplicate_resolved',r.status::text,r.status::text,actor.id,p_decision,decision_ref);
 perform private.refresh_import(b.id);
end $$;

-- Apply an expressly selected patch through the existing assisted duplicate
-- command so untouched private data and category timestamps stay unchanged.
create function private.materialize_import_row(r public.import_rows) returns uuid
language plpgsql security definer set search_path='' as $$
declare data jsonb; cats jsonb; reviews jsonb; review uuid; result jsonb; target uuid;
begin
 select coalesce(jsonb_agg(c.id),'[]') into cats from jsonb_array_elements_text(r.normalized_payload->'categories') x
   join public.job_categories c on c.code=x and c.version=1 and c.active;
 data:=(r.normalized_payload-'reference')||jsonb_build_object('categories',cats,'interests','[]'::jsonb,'address','','detail','');
 if r.decision='use_or_update_existing' then
   if cardinality(r.confirmed_fields)=0 then return r.target_candidate_id; end if;
   reviews:=public.screen_assisted_duplicates(regexp_replace(data->>'dni','[. ]','','g'),lower(trim(data->>'email')));
   select (x->>'reviewId')::uuid into review from jsonb_array_elements(reviews) x where x->>'candidateId'=r.target_candidate_id::text;
   if review is null then raise exception 'POTENTIAL_DUPLICATE'; end if;
   result:=public.save_assisted_candidate(r.target_candidate_id,r.target_version,data,review,'use_or_update_existing',
     'Actualización explícita desde lote de demostración',r.confirmed_fields);
 else result:=public.save_assisted_candidate(null,null,data); end if;
 if result->>'status'<>'saved' then raise exception 'POTENTIAL_DUPLICATE'; end if;
 target:=(result->>'candidateId')::uuid;
 if r.decision is distinct from 'use_or_update_existing' then
   update public.candidate_profiles set origin='imported',last_confirmed_at=null,refresh_due_at=null where id=target;
 end if;
 return target;
end $$;
revoke all on function private.materialize_import_row(public.import_rows) from public,anon,authenticated,service_role;

create or replace function public.confirm_candidate_import(p_batch uuid,p_version integer,p_hash text,p_mapping text)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.accounts; b public.import_batches; r public.import_rows; target uuid; failure text;
begin
 actor:=private.import_admin();
 perform pg_advisory_xact_lock(604040);
 select * into b from public.import_batches where id=p_batch for update;
 if b.id is null then raise exception 'NOT_FOUND'; end if;
 if b.version is distinct from p_version then raise exception 'CONFLICT_STALE_DATA'; end if;
 if b.status<>'preview_ready' then raise exception 'INVALID_TRANSITION'; end if;
 if p_hash is distinct from b.file_sha256 or p_mapping is distinct from b.mapping_version
    or p_mapping is distinct from 'demo-candidates-v1' then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from public.import_batches where file_sha256=b.file_sha256 and status='completed') then raise exception 'INVALID_TRANSITION'; end if;
 lock table public.candidate_private_data,public.candidate_contacts in share row exclusive mode;
 lock table public.job_categories in share mode;
 -- Lock existing targets before rechecking their optimistic versions.
 perform 1 from public.candidate_profiles where id in (select target_candidate_id from public.import_rows where batch_id=b.id) order by id for update;
 perform private.refresh_import(b.id);
 if (select status from public.import_batches where id=b.id)<>'preview_ready' then return 'blocked'; end if;
 update public.import_batches set status='confirming',confirmed_by=actor.id,confirmed_at=clock_timestamp() where id=b.id;
 perform private.record_event('import_batches',b.id,'import_confirmed','preview_ready','confirming',actor.id);
 begin
   for r in select * from public.import_rows where batch_id=b.id and decision is distinct from 'reject' order by row_number loop
     if r.decision is not null and not exists(select 1 from private.workflow_decisions d where d.id=r.decision_id
       and d.entity_id=r.id and d.command=r.decision) then raise exception 'INVALID_INPUT'; end if;
     target:=private.materialize_import_row(r);
     update public.import_rows set status='imported',created_candidate_id=target where id=r.id;
   end loop;
   update public.import_batches set status='completed',completed_at=clock_timestamp() where id=b.id;
   perform private.record_event('import_batches',b.id,'import_completed','confirming','completed',actor.id,null,jsonb_build_object('count',b.valid_rows));
 exception when others then
   failure:=case when sqlerrm in ('POTENTIAL_DUPLICATE','CONFLICT_STALE_DATA','INVALID_INPUT') then sqlerrm else 'IMPORT_FAILED' end;
   update public.import_batches set status='failed',failure_code=failure where id=b.id;
   perform private.record_event('import_batches',b.id,'import_failed','confirming','failed',actor.id);
   return 'failed';
 end;
 return 'completed';
end $$;
