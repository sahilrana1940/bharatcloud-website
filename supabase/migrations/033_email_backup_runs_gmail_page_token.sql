alter table email_backup_runs add column if not exists gmail_page_token text;

notify pgrst, 'reload schema';
