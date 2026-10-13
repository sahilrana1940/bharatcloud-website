-- Repair partial archive_files tables (e.g. created before migration 019 columns existed)

alter table archive_files add column if not exists uploaded_by text;
alter table archive_files add column if not exists owner_email text;
alter table archive_files add column if not exists type text not null default 'email';
alter table archive_files add column if not exists file_name text;
alter table archive_files add column if not exists size bigint not null default 0;
alter table archive_files add column if not exists storage_path text;
alter table archive_files add column if not exists is_central boolean not null default true;
alter table archive_files add column if not exists gmail_id text;
alter table archive_files add column if not exists subject text;
alter table archive_files add column if not exists from_email text;
alter table archive_files add column if not exists message_date timestamptz;
alter table archive_files add column if not exists metadata jsonb;
alter table archive_files add column if not exists created_at timestamptz not null default now();

-- Backfill NOT NULL columns where table had rows without them
update archive_files set uploaded_by = coalesce(uploaded_by, owner_email, 'unknown') where uploaded_by is null;
update archive_files set file_name = coalesce(file_name, subject, 'email.json') where file_name is null;
update archive_files set storage_path = coalesce(storage_path, '') where storage_path is null;

alter table archive_files drop constraint if exists archive_files_type_check;
alter table archive_files add constraint archive_files_type_check
  check (type in ('drive', 'vault', 'email', 'cctv'));

create index if not exists archive_files_company_type on archive_files (company_id, type);
create unique index if not exists archive_files_company_gmail
  on archive_files (company_id, gmail_id)
  where gmail_id is not null and type = 'email';

notify pgrst, 'reload schema';
