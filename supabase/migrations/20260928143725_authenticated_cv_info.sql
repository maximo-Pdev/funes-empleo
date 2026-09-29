-- Storage 1.77.5 performs an authenticated metadata check before downloading.
-- Preserve live ownership/referral checks; never allow listing or signed URLs.
-- Recovery: a new migration can restore allow_only_operation('object.get_authenticated').
drop policy cv_authenticated_download on storage.objects;
create policy cv_authenticated_download on storage.objects for select to authenticated using (
 bucket_id='candidate-cvs'
 and storage.allow_any_operation(array['object.get_authenticated','object.get_authenticated_info'])
 and private.can_read_cv_path(name)
);
