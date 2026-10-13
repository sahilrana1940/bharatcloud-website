-- email_backups columns used by mail archive (migration 005 subset)

alter table email_backups add column if not exists company_domain text;
alter table email_backups add column if not exists thread_id text;
alter table email_backups add column if not exists to_email text;
alter table email_backups add column if not exists folder text;
alter table email_backups add column if not exists created_at timestamptz not null default now();

notify pgrst, 'reload schema';
