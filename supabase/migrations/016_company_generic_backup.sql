-- Generic multi-tenant: domain directory, central drive owner, archive dedup hash

alter table companies
  add column if not exists godaddy_connected boolean not null default false,
  add column if not exists central_drive_owner_email text;

update companies
set central_drive_owner_email = admin_email
where central_drive_owner_email is null;

alter table company_archive_files
  add column if not exists file_hash text,
  add column if not exists source_owner_email text;

create index if not exists company_archive_files_company_hash
  on company_archive_files (company_id, file_hash)
  where file_hash is not null;

create table if not exists company_directory_emails (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  source text not null default 'manual'
    check (source in ('manual', 'handoff', 'workspace', 'godaddy')),
  backup_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create index if not exists company_directory_emails_company on company_directory_emails (company_id);

notify pgrst, 'reload schema';
