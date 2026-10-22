create table if not exists platform_storage_meter (
  id text primary key,
  used_bytes bigint not null default 0,
  used_gb numeric not null default 0,
  object_count integer not null default 0,
  bucket text not null default '',
  endpoint text not null default '',
  region text not null default '',
  storage_cost_inr numeric not null default 0,
  error text,
  measured_at timestamptz not null default now()
);

alter table platform_storage_meter enable row level security;
