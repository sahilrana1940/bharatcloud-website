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
