-- T013 forward-only: verify Storage's recorded object properties, not only CV metadata.
drop policy cv_validated_insert on storage.objects;
create policy cv_validated_insert on storage.objects for insert to authenticated with check (
 bucket_id='candidate-cvs' and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}\.pdf$' and
 metadata->>'mimetype'='application/pdf' and
 coalesce((metadata->>'size')::bigint,0) between 1 and 5242880 and
 exists(select 1 from public.cv_documents d where d.storage_path=name and d.status='valid'
  and d.mime_type='application/pdf' and d.byte_size=(metadata->>'size')::bigint
  and (private.is_admin() or private.owns_candidate(d.candidate_id)))
);
