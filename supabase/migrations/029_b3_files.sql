-- Bharat Big Bucket (B3) — company file objects (Vercel Blob URLs)

create table if not exists b3_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_size bigint not null default 0,
  ai_tag text not null default 'general',
  created_at timestamptz not null default now()
);

create index if not exists b3_files_company_created on b3_files (company_id, created_at desc);

notify pgrst, 'reload schema';
