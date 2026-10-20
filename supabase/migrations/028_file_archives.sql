-- All uploads archived from day 1 on E2E bharatcloudfinal2

create table if not exists file_archives (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  file_name text not null,
  s3_bucket text not null default 'bharatcloudfinal2',
  s3_key text not null,
  storage_class text not null default 'GLACIER',
  archived_at timestamptz not null default now(),
  source text,
  size_mb float,
  is_from_start boolean not null default true
);

create index if not exists file_archives_org_archived
  on file_archives (org_id, archived_at desc);

create table if not exists archive_restore_logs (
  id uuid primary key default gen_random_uuid(),
  org_id text not null,
  file_archive_id uuid references file_archives(id) on delete set null,
  s3_key text not null,
  restored_by text not null,
  restored_at timestamptz not null default now()
);

create index if not exists archive_restore_logs_org
  on archive_restore_logs (org_id, restored_at desc);

alter table file_archives enable row level security;
alter table archive_restore_logs enable row level security;

drop policy if exists file_archives_select on file_archives;
create policy file_archives_select on file_archives for select using (
  exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.company_id::text = file_archives.org_id
  )
);

drop policy if exists file_archives_insert on file_archives;
create policy file_archives_insert on file_archives for insert with check (
  exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.company_id::text = file_archives.org_id
  )
);

drop policy if exists archive_restore_logs_insert on archive_restore_logs;
create policy archive_restore_logs_insert on archive_restore_logs for insert with check (
  exists (
    select 1 from company_users cu
    where cu.email = auth.email() and cu.company_id::text = archive_restore_logs.org_id
  )
);

notify pgrst, 'reload schema';
