alter table email_backup_runs add column if not exists email_count int not null default 0;
alter table email_backup_runs add column if not exists archived_count int not null default 0;
alter table email_backup_runs add column if not exists size_mb double precision;

notify pgrst, 'reload schema';
