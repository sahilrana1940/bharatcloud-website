alter table email_backups add column if not exists user_email text;
alter table email_backups add column if not exists backup_status text;
alter table email_backups add column if not exists backup_url text;
alter table email_backups add column if not exists created_at timestamptz not null default now();

update email_backups
set user_email = owner_email
where user_email is null and owner_email is not null;

notify pgrst, 'reload schema';
