-- Central archive index (drive, vault, email, cctv)

create table if not exists archive_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  uploaded_by text not null,
  owner_email text,
  type text not null default 'email',
  file_name text not null,
  size bigint not null default 0,
  storage_path text not null,
  is_central boolean not null default true,
  gmail_id text,
  subject text,
  from_email text,
  message_date timestamptz,
  metadata jsonb,
  created_at timestamptz not null default now()
);

alter table archive_files drop constraint if exists archive_files_type_check;
alter table archive_files add constraint archive_files_type_check
  check (type in ('drive', 'vault', 'email', 'cctv'));

create index if not exists archive_files_company_type on archive_files (company_id, type);
create unique index if not exists archive_files_company_gmail
  on archive_files (company_id, gmail_id)
  where gmail_id is not null and type = 'email';

alter table companies
  add column if not exists billing_status text not null default 'trial';

notify pgrst, 'reload schema';
