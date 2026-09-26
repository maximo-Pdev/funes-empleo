-- US5 synthetic demo only. Forward recovery: new corrective migration; never edit
-- applied history. No raw CSV persists. OQ-018 continues to block historical imports.
alter table public.import_rows add column decision text check(decision in ('use_or_update_existing','correct_and_create','reject')),
 add column decision_id uuid references private.workflow_decisions(id),
 add column target_candidate_id uuid references public.candidate_profiles(id),
 add column target_version integer check(target_version>0),
 add column confirmed_fields text[] not null default '{}';

create function private.import_admin() returns public.accounts
language plpgsql security definer set search_path='' as $$
declare actor public.accounts;
begin
 actor:=private.require_workflow_actor();
 if actor.role<>'admin' then raise exception 'FORBIDDEN'; end if;
 return actor;
end $$;

-- Repeat validation in the database: direct RPC callers cannot bypass the parser.
create function private.import_errors(d jsonb) returns text[]
language plpgsql security definer set search_path='' as $$
declare codes text[]:='{}'; cats text[];
begin
 if jsonb_typeof(d) is distinct from 'object' or
    (d-array['name','dni','email','phone','locality','categories','summary','availability','reference'])<>'{}'
    or not (d ?& array['name','dni','email','phone','locality','categories','summary','availability','reference'])
    or exists(select 1 from jsonb_each(d) where key<>'categories' and jsonb_typeof(value)<>'string')
    or jsonb_typeof(d->'categories') is distinct from 'array'
 then return array['INVALID_ROW']; end if;
 if exists(select 1 from jsonb_array_elements(d->'categories') c where jsonb_typeof(c)<>'string') then return array['INVALID_ROW']; end if;
 select coalesce(array_agg(x),'{}') into cats from jsonb_array_elements_text(d->'categories') x;
 if length(trim(d->>'name')) not between 2 and 200 or coalesce(d->>'dni','') !~ '^[0-9. ]+$'
   or regexp_replace(d->>'dni','[. ]','','g') !~ '^[0-9]{7,8}$'
   or ((d->>'phone')='' and (d->>'email')='')
   or length(d->>'email')>320 or ((d->>'email')<>'' and (d->>'email') !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
   or ((d->>'phone')<>'' and (d->>'phone') !~ '^[+0-9() -]{6,50}$')
   or length(d->>'locality')>150 or length(d->>'summary')>5000
   or (d->>'availability') not in ('available','unavailable')
   or (d->>'reference') !~ '^[A-Za-z0-9_-]{1,100}$'
   or cardinality(cats)>20 or cardinality(cats)<>(select count(distinct x) from unnest(cats) x)
 then codes:=array_append(codes,'INVALID_ROW'); end if;
 if exists(select 1 from unnest(cats) x where x not in ('DEMO-A','DEMO-B') or not exists(
   select 1 from public.job_categories c where c.code=x and c.version=1 and c.active))
 then codes:=array_append(codes,'UNMAPPED_CATEGORY'); end if;
 return codes;
end $$;

create function private.refresh_import(p_batch uuid) returns void
language plpgsql security definer set search_path='' as $$
declare r public.import_rows; codes text[]; matched uuid; next_status public.import_row_status;
begin
 for r in select * from public.import_rows where batch_id=p_batch order by row_number loop
   codes:=private.import_errors(r.normalized_payload); matched:=null;
   if r.decision='reject' then codes:='{}';
   else
     select candidate_id into matched from private.assisted_matches(
       regexp_replace(r.normalized_payload->>'dni','[. ]','','g'),lower(trim(r.normalized_payload->>'email')),
       case when r.decision='use_or_update_existing' then r.target_candidate_id else null end) limit 1;
     if matched is not null then codes:=array_append(codes,'POTENTIAL_DUPLICATE'); end if;
     if exists(select 1 from public.import_rows other where other.batch_id=p_batch and other.id<>r.id
       and other.decision is distinct from 'reject' and (
         regexp_replace(other.normalized_payload->>'dni','[. ]','','g')=regexp_replace(r.normalized_payload->>'dni','[. ]','','g')
         or (nullif(lower(trim(other.normalized_payload->>'email')),'')=nullif(lower(trim(r.normalized_payload->>'email')),''))))
     then codes:=array_append(codes,'INTRA_FILE_DUPLICATE'); end if;
     if r.decision='use_or_update_existing' and not exists(select 1 from public.candidate_profiles p where p.id=r.target_candidate_id
       and p.version=r.target_version and p.archived_at is null and (p.account_id is null or exists(
         select 1 from public.accounts a where a.id=p.account_id and a.status='active')))
     then codes:=array_append(codes,'STALE_CANDIDATE'); end if;
   end if;
   next_status:=case when 'INVALID_ROW'=any(codes) or 'STALE_CANDIDATE'=any(codes) then 'invalid'::public.import_row_status
     when 'UNMAPPED_CATEGORY'=any(codes) then 'unmapped_category'::public.import_row_status
     when cardinality(codes)>0 then 'potential_duplicate'::public.import_row_status else 'valid'::public.import_row_status end;
   update public.import_rows set status=next_status,error_codes=codes,matched_candidate_id=matched where id=r.id;
 end loop;
 update public.import_batches b set
   total_rows=(select count(*) from public.import_rows where batch_id=p_batch),
   valid_rows=(select count(*) from public.import_rows where batch_id=p_batch and status='valid' and decision is distinct from 'reject'),
   warning_rows=0,
   invalid_rows=(select count(*) from public.import_rows where batch_id=p_batch and status in ('invalid','unmapped_category')),
   duplicate_rows=(select count(*) from public.import_rows where batch_id=p_batch and status='potential_duplicate'),
   status=case when exists(select 1 from public.import_rows where batch_id=p_batch and cardinality(error_codes)>0)
     or not exists(select 1 from public.import_rows where batch_id=p_batch and decision is distinct from 'reject')
     then 'blocked'::public.import_status else 'preview_ready'::public.import_status end
 where b.id=p_batch;
end $$;

create function public.preview_candidate_import(p_hash text,p_mapping text,p_rows jsonb,p_retry uuid default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor public.accounts; batch uuid; r jsonb; n integer:=0;
begin
 actor:=private.import_admin();
 if p_mapping is distinct from 'demo-candidates-v1' or p_hash is null or p_hash !~ '^[a-f0-9]{64}$'
   or jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'INVALID_INPUT'; end if;
 if jsonb_array_length(p_rows) not between 1 and 10000 or octet_length(p_rows::text)>10485760 then raise exception 'INVALID_INPUT'; end if;
 if p_retry is not null and not exists(select 1 from public.import_batches where id=p_retry and status='failed') then raise exception 'INVALID_INPUT'; end if;
 if exists(select 1 from public.import_batches where file_sha256=p_hash and status='completed') then raise exception 'INVALID_TRANSITION'; end if;
 insert into public.import_batches(created_by,mapping_version,file_sha256,source_reference_safe,retry_of_batch_id)
 values(actor.id,p_mapping,p_hash,'demo-csv',p_retry) returning id into batch;
 for r in select value from jsonb_array_elements(p_rows) loop
   n:=n+1;
   if jsonb_typeof(r)<>'object' or octet_length(r::text)>65536 then raise exception 'INVALID_INPUT'; end if;
   insert into public.import_rows(batch_id,row_number,status,normalized_payload) values(batch,n,'invalid',r);
 end loop;
 perform private.refresh_import(batch);
 return batch;
end $$;

create function public.resolve_import_row(p_batch uuid,p_version integer,p_row uuid,p_decision text,p_reason text,
 p_data jsonb,p_candidate uuid,p_candidate_version integer,p_fields text[])
returns void language plpgsql security definer set search_path='' as $$
declare actor public.accounts; b public.import_batches; r public.import_rows; decision uuid;
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
 decision:=private.workflow_reason('import_rows',r.id,p_decision,p_reason,actor.id);
 update public.import_rows set decision=p_decision,decision_id=decision,
   target_candidate_id=case when p_decision='use_or_update_existing' then p_candidate else null end,
   target_version=case when p_decision='use_or_update_existing' then p_candidate_version else null end,
   confirmed_fields=case when p_decision='use_or_update_existing' then p_fields else '{}' end,
   normalized_payload=case when p_decision='correct_and_create' then p_data else normalized_payload end where id=r.id;
 perform private.workflow_event('import_rows',r.id,'duplicate_resolved',r.status::text,r.status::text,actor.id,p_decision,decision);
 perform private.refresh_import(b.id);
end $$;

-- No raw identifiers or contacts leave this projection. Direct table access still
-- requires active-admin RLS; browsers use only this masked view.
create function public.import_batch_preview(p_batch uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare b public.import_batches; rows jsonb;
begin
 perform private.import_admin();
 select * into b from public.import_batches where id=p_batch;
 if b.id is null then raise exception 'NOT_FOUND'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'number',r.row_number,'status',r.status,'errors',r.error_codes,
   'decision',r.decision,'name',r.normalized_payload->>'name',
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

revoke all on function private.import_admin(),private.import_errors(jsonb),private.refresh_import(uuid) from public,anon,authenticated,service_role;
revoke all on function public.preview_candidate_import(text,text,jsonb,uuid),public.resolve_import_row(uuid,integer,uuid,text,text,jsonb,uuid,integer,text[]),public.import_batch_preview(uuid) from public,anon,service_role;
grant execute on function public.preview_candidate_import(text,text,jsonb,uuid),public.resolve_import_row(uuid,integer,uuid,text,text,jsonb,uuid,integer,text[]),public.import_batch_preview(uuid) to authenticated;
