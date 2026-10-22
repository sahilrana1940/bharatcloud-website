alter table file_archives add column if not exists user_id uuid;
alter table email_backup_runs add column if not exists user_id uuid;

create index if not exists file_archives_mailbox_idx
  on file_archives (company_id, email, created_at desc);

create index if not exists file_archives_user_id_idx
  on file_archives (user_id, created_at desc);

create index if not exists email_backup_runs_mailbox_idx
  on email_backup_runs (company_id, email, created_at desc);

notify pgrst, 'reload schema';
