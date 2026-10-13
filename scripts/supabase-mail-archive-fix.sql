-- Run once in Supabase SQL Editor (GOR JRM / any tenant)
-- Fixes orange "is_central column" errors and clears stale backup error state

alter table archive_files add column if not exists is_central boolean not null default true;
alter table archive_files add column if not exists uploaded_by text;
alter table archive_files add column if not exists owner_email text;
alter table archive_files add column if not exists gmail_id text;
alter table archive_files add column if not exists subject text;
alter table archive_files add column if not exists from_email text;
alter table archive_files add column if not exists message_date timestamptz;
alter table archive_files add column if not exists metadata jsonb;

update company_users
set email_sync_status = 'idle', email_sync_progress = ''
where email_sync_status = 'error'
  and email_sync_progress like '%archive_files%';

notify pgrst, 'reload schema';
