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
