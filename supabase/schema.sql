-- BharatCloud consolidated schema (generated from supabase/migrations/*.sql)
-- Apply in order on a fresh database, or run individual migrations incrementally.
-- Multi-tenant core: companies.id + company_users(company_id, email)

-- ========== 001_b2b_vault.sql ==========
-- BharatCloud B2B Private Drive

create table if not exists b2b_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  plan text not null check (plan in ('500gb', '1tb')),
  storage_limit_gb integer not null,
  razorpay_subscription_id text,
  created_at timestamptz not null default now()
);

create table if not exists b2b_ids (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references b2b_companies(id) on delete cascade,
  email_prefix text not null,
  storage_used_gb numeric not null default 0,
  last_active_at timestamptz not null default now(),
  s3_prefix text not null,
  unique (company_id, email_prefix)
);

create table if not exists vault_trash (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references b2b_companies(id) on delete cascade,
  file_key text not null,
  original_name text not null,
  deleted_at timestamptz not null default now(),
  s3_version_id text,
  trash_key text not null
);

create index if not exists idx_b2b_ids_company on b2b_ids(company_id);
create index if not exists idx_vault_trash_company on vault_trash(company_id);

-- ========== 002_organizations.sql ==========
-- BharatCloud B2B SaaS — organizations & members

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text not null unique,
  plan text not null default 'free',
  storage_limit bigint not null default 10737418240,
  storage_used bigint not null default 0,
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_email text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (org_id, user_email)
);

create index if not exists idx_org_members_org on org_members(org_id);
create index if not exists idx_organizations_status on organizations(status);

-- ========== 003_org_phone.sql ==========
alter table organizations
  add column if not exists owner_phone text;

-- ========== 004_workspace_backup.sql ==========
-- BharatCloud Workspace Backup (Drive + Vault + Gmail)

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  admin_email text not null,
  plan_name text not null default 'starter',
  storage_limit_gb numeric not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  is_backup_enabled boolean not null default true,
  drive_used_gb numeric not null default 0,
  drive_limit_gb numeric not null default 15,
  unique (company_id, email)
);

create table if not exists company_settings (
  company_id uuid primary key references companies(id) on delete cascade,
  post_backup_action text not null default 'create_shortcut'
    check (post_backup_action in ('keep_both', 'create_shortcut', 'delete_30_days'))
);

create table if not exists google_oauth_tokens (
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  access_token text,
  refresh_token text,
  expiry timestamptz,
  primary key (company_id, email)
);

create table if not exists email_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  owner_email text not null,
  gmail_id text not null,
  subject text,
  from_email text,
  date timestamptz,
  has_attachment boolean not null default false,
  body_text text,
  s3_path text,
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      coalesce(subject, '') || ' ' || coalesce(from_email, '') || ' ' || coalesce(body_text, '')
    )
  ) stored,
  unique (company_id, gmail_id)
);

create index if not exists email_backups_search_idx on email_backups using gin (search_vector);
create index if not exists email_backups_company_owner on email_backups (company_id, owner_email);

create table if not exists drive_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  owner_email text not null,
  drive_file_id text not null,
  name text not null,
  mime_type text,
  size bigint not null default 0,
  web_view_link text,
  s3_path text,
  backup_status text not null default 'pending'
    check (backup_status in ('pending', 'backedup')),
  is_shortcut boolean not null default false,
  unique (company_id, drive_file_id)
);

create index if not exists drive_files_company_owner on drive_files (company_id, owner_email);

-- RLS (Supabase Auth)
alter table email_backups enable row level security;
alter table drive_files enable row level security;

create policy email_backups_access on email_backups
  for all
  using (
    owner_email = auth.email()
    or exists (
      select 1 from company_users cu
      where cu.email = auth.email()
        and cu.role = 'admin'
        and cu.company_id = email_backups.company_id
    )
  );

create policy drive_files_access on drive_files
  for all
  using (
    owner_email = auth.email()
    or exists (
      select 1 from company_users cu
      where cu.email = auth.email()
        and cu.role = 'admin'
        and cu.company_id = drive_files.company_id
    )
  );

-- ========== 005_saas_columns.sql ==========
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

-- ========== 006_payments_billing.sql ==========
-- Payments + billing helpers (run after 004/005)

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  company_domain text not null,
  amount int not null default 1999,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists payments_domain_status on payments (company_domain, status);

alter table companies
  add column if not exists subscription_status text not null default 'trial';

alter table drive_files
  add column if not exists file_size bigint;

update drive_files set file_size = size where file_size is null and size is not null;

alter table email_backups
  add column if not exists company_domain text;

create unique index if not exists email_backups_gmail_id_unique
  on email_backups (gmail_id)
  where gmail_id is not null;

-- ========== 007_role_system.sql ==========
-- 3-role SaaS access (columns on company_users; exposed via team_members view)

alter table company_users
  add column if not exists saas_role text not null default 'employee'
    check (saas_role in ('super_admin', 'company_owner', 'employee'));

alter table company_users
  add column if not exists is_company_owner boolean not null default false;

update company_users
set saas_role = 'company_owner', is_company_owner = true
where role = 'admin' and saas_role = 'employee';

-- Super admin (replace with your Google email):
-- update company_users set saas_role = 'super_admin', is_company_owner = true where email = 'sahilrana1940@gmail.com';

create or replace view team_members as
select
  cu.id,
  c.domain as company_domain,
  cu.company_id,
  cu.email,
  coalesce(cu.display_name, split_part(cu.email, '@', 1)) as name,
  cu.saas_role as role,
  cu.is_company_owner,
  cu.role as workspace_role,
  cu.is_backup_enabled,
  cu.drive_used_gb as storage_used_gb,
  cu.drive_limit_gb,
  cu.drive_sync_status,
  cu.email_sync_status,
  cu.email_sync_progress
from company_users cu
join companies c on c.id = cu.company_id;

-- ========== 008_personal_backups_tiers.sql ==========
-- Hot / Cold / Vault tiered personal backups (B2C + B2B)

create table if not exists personal_backups (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  file_name text not null,
  hot_path text,
  cold_path text,
  vault_path text not null,
  hot_url text,
  cold_url text,
  vault_url text,
  file_size bigint not null default 0,
  type text not null default 'file'
    check (type in ('photo', 'video', 'whatsapp', 'file')),
  storage_tier text not null default 'hot'
    check (storage_tier in ('hot', 'cold', 'vault')),
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  is_deleted boolean not null default false,
  company_domain text,
  mime_type text
);

create index if not exists personal_backups_user on personal_backups (user_email, is_deleted);
create index if not exists personal_backups_tier_created on personal_backups (storage_tier, created_at);
create index if not exists personal_backups_company on personal_backups (company_domain);

alter table personal_backups enable row level security;

create policy personal_backups_select_own on personal_backups
  for select using (user_email = auth.email());

create policy personal_backups_insert_own on personal_backups
  for insert with check (user_email = auth.email());

create policy personal_backups_update_own on personal_backups
  for update using (user_email = auth.email());

-- Private buckets (service role + signed URLs in app)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('bharatcloud-hot', 'bharatcloud-hot', false, 524288000, null),
  ('bharatcloud-cold', 'bharatcloud-cold', false, 524288000, null),
  ('bharatcloud-vault', 'bharatcloud-vault', false, 524288000, null)
on conflict (id) do update set public = false;

-- ========== 009_unified_vault_b2b_b2c.sql ==========
-- Unified B2B + B2C vault (4 private buckets, personal_vault, locks, recovery)

insert into storage.buckets (id, name, public)
values
  ('bharatcloud-company-hot', 'bharatcloud-company-hot', false),
  ('bharatcloud-personal-hot', 'bharatcloud-personal-hot', false),
  ('bharatcloud-cold', 'bharatcloud-cold', false),
  ('bharatcloud-vault', 'bharatcloud-vault', false)
on conflict (id) do update set public = false;

create table if not exists personal_users (
  user_email text primary key,
  plan text not null default 'free',
  storage_limit_bytes bigint not null default 2147483648,
  storage_used_bytes bigint not null default 0,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists personal_vault (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  company_domain text,
  file_name text not null,
  file_size bigint not null default 0,
  type text not null default 'file'
    check (type in ('photo', 'video', 'whatsapp', 'file', 'company_doc')),
  hot_path text,
  cold_path text,
  vault_path text not null,
  storage_tier text not null default 'hot' check (storage_tier in ('hot', 'cold')),
  is_deleted boolean not null default false,
  is_locked boolean not null default true,
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  mime_type text
);

create index if not exists personal_vault_user on personal_vault (user_email, is_deleted);
create index if not exists personal_vault_company on personal_vault (company_domain);
create index if not exists personal_vault_tier_created on personal_vault (storage_tier, created_at);

create table if not exists app_locks (
  user_email text primary key,
  pin_hash text not null,
  biometric_enabled boolean not null default false,
  failed_attempts int not null default 0,
  is_device_locked boolean not null default false,
  backup_code_hash text,
  updated_at timestamptz not null default now()
);

create table if not exists recovery_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  contact_mail text not null,
  reason text not null,
  status text not null default 'pending',
  backup_code_hash text,
  backup_code_plain_temp text,
  code_expires_at timestamptz,
  created_at timestamptz not null default now()
);

-- B2B team index table (email-keyed; sync from company_users)
create table if not exists team_members_email (
  email text primary key,
  company_domain text not null,
  role text not null check (role in ('owner', 'employee'))
);

alter table personal_vault enable row level security;

create policy personal_vault_select_owner on personal_vault for select using (
  company_domain is not null and company_domain = (
    select t.company_domain from team_members_email t
    where t.email = auth.email() and t.role = 'owner' limit 1
  )
);

create policy personal_vault_select_employee on personal_vault for select using (
  user_email = auth.email()
  or (
    company_domain is not null and company_domain = (
      select t.company_domain from team_members_email t where t.email = auth.email() limit 1
    )
  )
);

create policy personal_vault_select_b2c on personal_vault for select using (
  user_email = auth.email() and company_domain is null
);

create policy personal_vault_insert_own on personal_vault for insert with check (user_email = auth.email());

-- ========== 010_master_course.sql ==========
-- BharatCloud Master: 5 private buckets + core tables

insert into storage.buckets (id, name, public)
values
  ('bharatcloud-personal-hot', 'bharatcloud-personal-hot', false),
  ('bharatcloud-company-hot', 'bharatcloud-company-hot', false),
  ('bharatcloud-cold', 'bharatcloud-cold', false),
  ('bharatcloud-vault', 'bharatcloud-vault', false),
  ('bharatcloud-thumbs', 'bharatcloud-thumbs', false)
on conflict (id) do update set public = false;

create table if not exists personal_users (
  email text primary key,
  plan text not null default 'free',
  storage_limit bigint not null default 2147483648,
  storage_used bigint not null default 0,
  plan_expiry timestamptz,
  is_paid boolean not null default false,
  is_blocked boolean not null default false
);

create table if not exists personal_vault (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  company_domain text,
  file_name text not null,
  file_size bigint not null default 0,
  type text not null default 'file',
  hot_path text,
  cold_path text,
  vault_path text not null,
  thumb_path text,
  storage_tier text not null default 'hot',
  is_deleted boolean not null default false,
  is_locked boolean not null default true,
  last_accessed timestamptz not null default now(),
  created_at timestamptz not null default now(),
  mime_type text
);

create table if not exists app_locks (
  user_email text primary key,
  pin_hash text not null,
  backup_code_hash text,
  is_device_locked boolean not null default false,
  failed_attempts int not null default 0
);

create table if not exists recovery_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  contact_mail text not null,
  reason text not null,
  status text not null default 'pending',
  backup_code_hash text,
  backup_code_plain_temp text,
  code_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  email text primary key,
  company_domain text not null,
  role text not null check (role in ('owner', 'employee'))
);

alter table personal_vault enable row level security;
alter table personal_users enable row level security;
alter table app_locks enable row level security;
alter table recovery_requests enable row level security;
alter table team_members enable row level security;

drop policy if exists own on personal_vault;
create policy own_vault on personal_vault for all using (user_email = auth.email());

drop policy if exists own on personal_users;
create policy own_users on personal_users for all using (email = auth.email());

drop policy if exists own on app_locks;
create policy own_locks on app_locks for all using (user_email = auth.email());

-- ========== 011_ensure_storage_buckets.sql ==========
-- Run in Supabase SQL Editor if uploads fail with "Bucket not found"
insert into storage.buckets (id, name, public)
values
  ('bharatcloud-personal-hot', 'bharatcloud-personal-hot', false),
  ('bharatcloud-company-hot', 'bharatcloud-company-hot', false),
  ('bharatcloud-cold', 'bharatcloud-cold', false),
  ('bharatcloud-vault', 'bharatcloud-vault', false),
  ('bharatcloud-thumbs', 'bharatcloud-thumbs', false),
  ('bharatcloud-backups', 'bharatcloud-backups', false)
on conflict (id) do update set public = false;

-- ========== 012_personal_vault_columns.sql ==========
-- Fix: "Could not find the mime_type column of personal_vault"
-- Run in Supabase SQL Editor if vault upload fails after older partial migrations.

alter table personal_vault add column if not exists mime_type text;
alter table personal_vault add column if not exists thumb_path text;
alter table personal_vault add column if not exists hot_path text;
alter table personal_vault add column if not exists cold_path text;

-- Refresh PostgREST schema cache (Supabase API)
notify pgrst, 'reload schema';

-- ========== 013_drive_files_columns.sql ==========
-- Fix: "Could not find the company_domain column of drive_files"
-- Run if migration 005 was not applied on your Supabase project.

alter table drive_files
  add column if not exists company_domain text,
  add column if not exists file_name text,
  add column if not exists file_size bigint,
  add column if not exists public_url text,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists is_deleted boolean not null default false,
  add column if not exists shared boolean not null default false;

update drive_files df
set file_name = coalesce(df.file_name, df.name),
    file_size = coalesce(df.file_size, df.size),
    company_domain = c.domain
from companies c
where c.id = df.company_id
  and (df.company_domain is null or df.file_name is null);

notify pgrst, 'reload schema';

-- ========== 014_company_backup_jobs.sql ==========
-- Automatic Google Drive archive jobs (post-payment backup)

create table if not exists company_backup_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  owner_email text not null,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  drive_page_token text,
  files_total int not null default 0,
  files_done int not null default 0,
  bytes_original bigint not null default 0,
  bytes_compressed bigint not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_backup_jobs_company on company_backup_jobs (company_id, created_at desc);

create table if not exists company_archive_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  job_id uuid references company_backup_jobs(id) on delete set null,
  drive_file_id text not null,
  file_name text not null,
  mime_type text,
  original_size bigint not null default 0,
  compressed_size bigint not null default 0,
  archive_key text,
  status text not null default 'archived'
    check (status in ('pending', 'archived', 'skipped', 'failed')),
  created_at timestamptz not null default now(),
  unique (company_id, drive_file_id)
);

create index if not exists company_archive_files_company on company_archive_files (company_id);

notify pgrst, 'reload schema';

-- ========== 015_payments_company_id.sql ==========
-- Multi-tenant: link payments to companies.id

alter table payments
  add column if not exists company_id uuid references companies(id) on delete cascade;

update payments p
set company_id = c.id
from companies c
where p.company_id is null and c.domain = p.company_domain;

create index if not exists payments_company_status on payments (company_id, status);

notify pgrst, 'reload schema';

