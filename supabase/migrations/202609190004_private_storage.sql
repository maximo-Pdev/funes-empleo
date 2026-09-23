-- T013: never grant signed URLs, listing, overwrite or deletion of historical CV objects.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('candidate-cvs','candidate-cvs',false,5242880,array['application/pdf']);

create policy cv_authenticated_download on storage.objects for select to authenticated using (
 bucket_id='candidate-cvs' and storage.allow_only_operation('object.get_authenticated') and
 exists(select 1 from public.cv_documents d where d.storage_path=name and private.can_read_cv(d.id))
);
-- Upload is reserved for the validated T044 server flow. No unvalidated browser upload or
-- service-role bypass is introduced here. That flow must atomically register validated metadata
-- before Storage accepts the exact immutable object. Owners/admins, never companies, may upload.
create policy cv_validated_insert on storage.objects for insert to authenticated with check (
 bucket_id='candidate-cvs' and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.pdf$' and
 exists(select 1 from public.cv_documents d where d.storage_path=name and d.status='valid'
  and d.mime_type='application/pdf' and d.byte_size between 1 and 5242880
  and (private.is_admin() or private.owns_candidate(d.candidate_id)))
);
