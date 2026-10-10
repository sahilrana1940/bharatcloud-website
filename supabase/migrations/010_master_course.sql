-- BharatCloud Master: 5 private buckets + core tables

insert into storage.buckets (id, name, public)
values
  ('bharatcloud-personal-hot', 'bharatcloud-personal-hot', false),
  ('bharatcloud-company-hot', 'bharatcloud-company-hot', false),
  ('bharatcloud-cold', 'bharatcloud-cold', false),
  ('bharatcloud-vault', 'bharatcloud-vault', false),
  ('bharatcloud-thumbs', 'bharatcloud-thumbs', false)
on conflict (id) do update set public = false;

create table if not exists personal_users (
  email text primary key,
  plan text not null default 'free',
  storage_limit bigint not null default 2147483648,
  storage_used bigint not null default 0,
  plan_expiry timestamptz,
  is_paid boolean not null default false,
  is_blocked boolean not null default false
);

create table if not exists personal_vault (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  company_domain text,
  file_name text not null,
  file_size bigint not null default 0,
  type text not null default 'file',
  hot_path text,
  cold_path text,
  vault_path text not null,
  thumb_path text,
  storage_tier text not null default 'hot',
  is_deleted boolean not null default false,
  is_locked boolean not null default true,
  last_accessed timestamptz not null default now(),
  created_at timestamptz not null default now(),
  mime_type text
);

create table if not exists app_locks (
  user_email text primary key,
  pin_hash text not null,
  backup_code_hash text,
  is_device_locked boolean not null default false,
  failed_attempts int not null default 0
);

create table if not exists recovery_requests (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  contact_mail text not null,
  reason text not null,
  status text not null default 'pending',
  backup_code_hash text,
  backup_code_plain_temp text,
  code_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists team_members (
  email text primary key,
  company_domain text not null,
  role text not null check (role in ('owner', 'employee'))
);

alter table personal_vault enable row level security;
alter table personal_users enable row level security;
alter table app_locks enable row level security;
alter table recovery_requests enable row level security;
alter table team_members enable row level security;

drop policy if exists own on personal_vault;
create policy own_vault on personal_vault for all using (user_email = auth.email());

drop policy if exists own on personal_users;
create policy own_users on personal_users for all using (email = auth.email());

drop policy if exists own on app_locks;
create policy own_locks on app_locks for all using (user_email = auth.email());
