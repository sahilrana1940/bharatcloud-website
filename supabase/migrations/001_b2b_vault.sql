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
