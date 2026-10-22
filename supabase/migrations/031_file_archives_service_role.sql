-- Live file_archives uses user_email / e2e_path / class / size_bytes.
-- Keep those, and add the columns the app also writes. service_role bypasses RLS;
-- this policy covers a client that still authenticates as service_role.

alter table file_archives add column if not exists org_id text;
alter table file_archives add column if not exists user_email text;
alter table file_archives add column if not exists s3_bucket text;
alter table file_archives add column if not exists s3_key text;
alter table file_archives add column if not exists e2e_path text;
alter table file_archives add column if not exists storage_class text;
alter table file_archives add column if not exists class text;
alter table file_archives add column if not exists size_mb float;
alter table file_archives add column if not exists size float;
alter table file_archives add column if not exists size_bytes bigint;
alter table file_archives add column if not exists is_from_start boolean default true;

drop policy if exists file_archives_service_role_all on file_archives;
create policy file_archives_service_role_all
  on file_archives
  for all
  to service_role
  using (true)
  with check (true);

notify pgrst, 'reload schema';
