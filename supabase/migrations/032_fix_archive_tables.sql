-- Archive index already exists on the live project with these columns.
-- The API uses the service role. RLS stays enabled. Do not grant the anon key
-- access to mailbox paths.

create extension if not exists pgcrypto;

create table if not exists email_backup_runs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  email text,
  status text,
  progress text,
  created_at timestamptz not null default now()
);

create table if not exists file_archives (
  id uuid primary key default gen_random_uuid(),
  company_id uuid,
  email text,
  file_name text,
  s3_path text,
  size_mb double precision,
  storage_class text,
  source text,
  created_at timestamptz not null default now()
);

create index if not exists file_archives_company_email
  on file_archives (company_id, email, created_at desc);

notify pgrst, 'reload schema';
