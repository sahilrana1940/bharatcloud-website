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
