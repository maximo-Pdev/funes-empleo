-- Storage evaluates the INSERT policy before upload metadata is available.
-- The reserved immutable key is checked here; the bucket validates MIME/size,
-- and commit_candidate_cv verifies the persisted object metadata before use.
drop policy cv_validated_insert on storage.objects;
create policy cv_validated_insert on storage.objects for insert to authenticated with check (
  bucket_id='candidate-cvs' and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.pdf$'
  and exists(select 1 from public.cv_documents d where d.storage_path=name
    and d.status='rejected' and d.validation_result='upload_pending'
    and d.mime_type='application/pdf' and d.byte_size between 1 and 5242880
    and (private.is_admin() or private.owns_candidate(d.candidate_id)))
);
