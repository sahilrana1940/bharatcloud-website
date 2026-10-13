-- Email archive job status on company_users (required for My mail archive UI)

alter table company_users
  add column if not exists email_sync_status text default 'idle';

alter table company_users
  add column if not exists email_sync_progress text;

notify pgrst, 'reload schema';
