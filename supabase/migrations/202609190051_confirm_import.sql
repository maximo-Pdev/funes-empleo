-- Forward-only; no rollback deletes business history. A failed materialization is
-- a subtransaction: all candidates/contacts/categories/events roll back together.
create unique index import_completed_hash on public.import_batches(file_sha256) where status='completed';

create function public.confirm_candidate_import(p_batch uuid,p_version integer,p_hash text,p_mapping text)
returns text language plpgsql security definer set search_path='' as $$
declare actor public.accounts; b public.import_batches; r public.import_rows; result jsonb; data jsonb; old_data jsonb;
 candidate public.candidate_profiles; target uuid; cats jsonb; key text; failure text;
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
 -- Freeze duplicate keys and catalog while checking and materializing. This also
 -- covers other writers that do not use the assisted-import advisory lock.
 lock table public.candidate_private_data,public.candidate_contacts in share row exclusive mode;
 lock table public.job_categories in share mode;
 perform private.refresh_import(b.id);
 if (select status from public.import_batches where id=b.id)<>'preview_ready' then return 'blocked'; end if;
 update public.import_batches set status='confirming',confirmed_by=actor.id,confirmed_at=clock_timestamp() where id=b.id;
 perform private.record_event('import_batches',b.id,'import_confirmed','preview_ready','confirming',actor.id);
 begin
   for r in select * from public.import_rows where batch_id=b.id and decision is distinct from 'reject' order by row_number loop
     if r.decision is not null and not exists(select 1 from private.workflow_decisions d where d.id=r.decision_id
       and d.entity_id=r.id and d.command=r.decision) then raise exception 'INVALID_INPUT'; end if;
     select coalesce(jsonb_agg(c.id),'[]') into cats from jsonb_array_elements_text(r.normalized_payload->'categories') x
       join public.job_categories c on c.code=x and c.version=1 and c.active;
     data:=(r.normalized_payload-'reference')||jsonb_build_object('categories',cats,'interests','[]'::jsonb,'address','','detail','');
     target:=null;
     if r.decision='use_or_update_existing' then
       select * into candidate from public.candidate_profiles where id=r.target_candidate_id and archived_at is null for update;
       if candidate.id is null or candidate.version is distinct from r.target_version then raise exception 'CONFLICT_STALE_DATA'; end if;
       target:=candidate.id;
       if cardinality(r.confirmed_fields)=0 then
         update public.import_rows set status='imported',created_candidate_id=target where id=r.id;
         continue;
       end if;
       select jsonb_build_object('name',candidate.display_name,'dni',d.dni_normalized,'address',coalesce(d.address,''),
         'locality',coalesce(candidate.locality,''),'summary',coalesce(candidate.skills_experience_summary,''),
         'availability',coalesce(candidate.availability,'available'),'detail',coalesce(candidate.availability_detail,''),
         'email',coalesce((select value from public.candidate_contacts where candidate_id=target and kind='email' and is_primary and archived_at is null),''),
         'phone',coalesce((select value from public.candidate_contacts where candidate_id=target and kind='phone' and is_primary and archived_at is null),''),
         'categories',coalesce((select jsonb_agg(category_id) from public.candidate_categories where candidate_id=target and kind='occupation'),'[]'),
         'interests',coalesce((select jsonb_agg(category_id) from public.candidate_categories where candidate_id=target and kind='interest'),'[]'))
       into old_data from public.candidate_private_data d where d.candidate_id=target;
       foreach key in array r.confirmed_fields loop old_data:=jsonb_set(old_data,array[key],data->key); end loop;
       data:=old_data;
     end if;
     result:=public.save_assisted_candidate(target,case when target is null then null else r.target_version end,data);
     if result->>'status'<>'saved' then raise exception 'POTENTIAL_DUPLICATE'; end if;
     target:=(result->>'candidateId')::uuid;
     if r.decision is distinct from 'use_or_update_existing' then
       update public.candidate_profiles set origin='imported',last_confirmed_at=null,refresh_due_at=null where id=target;
     end if;
     update public.import_rows set status='imported',created_candidate_id=target where id=r.id;
   end loop;
   update public.import_batches set status='completed',completed_at=clock_timestamp() where id=b.id;
   perform private.record_event('import_batches',b.id,'import_completed','confirming','completed',actor.id,null,
     jsonb_build_object('count',b.valid_rows));
 exception when others then
   failure:=case when sqlerrm in ('POTENTIAL_DUPLICATE','CONFLICT_STALE_DATA','INVALID_INPUT') then sqlerrm else 'IMPORT_FAILED' end;
   update public.import_batches set status='failed',failure_code=failure where id=b.id;
   perform private.record_event('import_batches',b.id,'import_failed','confirming','failed',actor.id);
   return 'failed';
 end;
 return 'completed';
end $$;
revoke all on function public.confirm_candidate_import(uuid,integer,text,text) from public,anon,service_role;
grant execute on function public.confirm_candidate_import(uuid,integer,text,text) to authenticated;
