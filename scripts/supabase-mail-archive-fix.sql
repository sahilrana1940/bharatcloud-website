-- Run once in Supabase SQL Editor (safe to re-run)

-- archive_files (optional index table)
alter table archive_files add column if not exists is_central boolean not null default true;
alter table archive_files add column if not exists uploaded_by text;
alter table archive_files add column if not exists owner_email text;
alter table archive_files add column if not exists gmail_id text;
alter table archive_files add column if not exists subject text;
alter table archive_files add column if not exists from_email text;
alter table archive_files add column if not exists message_date timestamptz;
alter table archive_files add column if not exists metadata jsonb;

-- company_users mail job columns (fixes "email_sync_progress does not exist")
alter table company_users add column if not exists email_sync_status text default 'idle';
alter table company_users add column if not exists email_sync_progress text;

-- Clear stale orange error for Sunderbani hub (change email if needed)
update company_users
set email_sync_status = 'idle', email_sync_progress = null
where lower(email) = lower('sunderbanihub@gorjrmcourier.com');

notify pgrst, 'reload schema';
