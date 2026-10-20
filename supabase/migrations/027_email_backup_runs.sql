-- E2E Gmail backup job log (batch runs to S3), separate from per-message email_backups rows.

create table if not exists email_backup_runs (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  user_email text not null,
  backup_date timestamptz not null default now(),
  email_count int not null default 0,
  s3_bucket text not null default 'bharatcloudfinal2',
  s3_path text,
  size_mb float,
  status text not null default 'pending',
  progress text
);

create index if not exists email_backup_runs_org_user_date
  on email_backup_runs (org_id, user_email, backup_date desc);

alter table email_backup_runs enable row level security;

drop policy if exists email_backup_runs_select on email_backup_runs;
create policy email_backup_runs_select on email_backup_runs for select using (
  lower(user_email) = lower(auth.email())
  or exists (
    select 1 from company_users cu
    where cu.email = auth.email()
      and cu.role = 'admin'
      and cu.company_id::text = email_backup_runs.org_id
  )
);

drop policy if exists email_backup_runs_insert on email_backup_runs;
create policy email_backup_runs_insert on email_backup_runs for insert with check (
  lower(user_email) = lower(auth.email())
);

notify pgrst, 'reload schema';
