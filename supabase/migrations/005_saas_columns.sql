-- BharatCloud SaaS columns + team_members alias

alter table drive_files
  add column if not exists company_domain text,
  add column if not exists file_name text,
  add column if not exists public_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists is_deleted boolean not null default false,
  add column if not exists shared boolean not null default false;

update drive_files df
set file_name = coalesce(df.file_name, df.name),
    company_domain = c.domain
from companies c
where c.id = df.company_id and df.company_domain is null;

alter table email_backups
  add column if not exists company_domain text,
  add column if not exists thread_id text,
  add column if not exists to_email text,
  add column if not exists folder text,
  add column if not exists created_at timestamptz not null default now();

alter table company_users
  add column if not exists display_name text,
  add column if not exists drive_sync_status text default 'idle',
  add column if not exists email_sync_status text default 'idle',
  add column if not exists email_sync_progress text;

create or replace view team_members as
select
  cu.id,
  c.domain as company_domain,
  cu.company_id,
  cu.email,
  coalesce(cu.display_name, split_part(cu.email, '@', 1)) as name,
  cu.role,
  cu.is_backup_enabled,
  cu.drive_used_gb as storage_used_gb,
  cu.drive_limit_gb,
  cu.drive_sync_status,
  cu.email_sync_status,
  cu.email_sync_progress
from company_users cu
join companies c on c.id = cu.company_id;

create index if not exists drive_files_domain_created on drive_files (company_domain, created_at desc);
create index if not exists email_backups_domain_date on email_backups (company_domain, date desc);

-- RLS: allow authenticated insert/select for own company rows (service role bypasses)
drop policy if exists drive_files_access on drive_files;
create policy drive_files_select on drive_files for select using (
  owner_email = auth.email()
  or exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.role = 'admin' and cu.company_id = drive_files.company_id
  )
);
create policy drive_files_insert on drive_files for insert with check (
  owner_email = auth.email()
  or exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.role = 'admin' and cu.company_id = drive_files.company_id
  )
);
create policy drive_files_update on drive_files for update using (
  owner_email = auth.email()
  or exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.role = 'admin' and cu.company_id = drive_files.company_id
  )
);

drop policy if exists email_backups_access on email_backups;
create policy email_backups_select on email_backups for select using (
  owner_email = auth.email()
  or exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.role = 'admin' and cu.company_id = email_backups.company_id
  )
);
create policy email_backups_insert on email_backups for insert with check (
  owner_email = auth.email()
  or exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.role = 'admin' and cu.company_id = email_backups.company_id
  )
);
