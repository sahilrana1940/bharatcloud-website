-- Unified B2B + B2C vault (4 private buckets, personal_vault, locks, recovery)

insert into storage.buckets (id, name, public)
values
  ('bharatcloud-company-hot', 'bharatcloud-company-hot', false),
  ('bharatcloud-personal-hot', 'bharatcloud-personal-hot', false),
  ('bharatcloud-cold', 'bharatcloud-cold', false),
  ('bharatcloud-vault', 'bharatcloud-vault', false)
on conflict (id) do update set public = false;

create table if not exists personal_users (
  user_email text primary key,
  plan text not null default 'free',
  storage_limit_bytes bigint not null default 2147483648,
  storage_used_bytes bigint not null default 0,
  plan_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists personal_vault (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  company_domain text,
  file_name text not null,
  file_size bigint not null default 0,
  type text not null default 'file'
    check (type in ('photo', 'video', 'whatsapp', 'file', 'company_doc')),
  hot_path text,
  cold_path text,
  vault_path text not null,
  storage_tier text not null default 'hot' check (storage_tier in ('hot', 'cold')),
  is_deleted boolean not null default false,
  is_locked boolean not null default true,
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  mime_type text
);

create index if not exists personal_vault_user on personal_vault (user_email, is_deleted);
create index if not exists personal_vault_company on personal_vault (company_domain);
create index if not exists personal_vault_tier_created on personal_vault (storage_tier, created_at);

create table if not exists app_locks (
  user_email text primary key,
  pin_hash text not null,
  biometric_enabled boolean not null default false,
  failed_attempts int not null default 0,
  is_device_locked boolean not null default false,
  backup_code_hash text,
  updated_at timestamptz not null default now()
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

-- B2B team index table (email-keyed; sync from company_users)
create table if not exists team_members_email (
  email text primary key,
  company_domain text not null,
  role text not null check (role in ('owner', 'employee'))
);

alter table personal_vault enable row level security;

create policy personal_vault_select_owner on personal_vault for select using (
  company_domain is not null and company_domain = (
    select t.company_domain from team_members_email t
    where t.email = auth.email() and t.role = 'owner' limit 1
  )
);

create policy personal_vault_select_employee on personal_vault for select using (
  user_email = auth.email()
  or (
    company_domain is not null and company_domain = (
      select t.company_domain from team_members_email t where t.email = auth.email() limit 1
    )
  )
);

create policy personal_vault_select_b2c on personal_vault for select using (
  user_email = auth.email() and company_domain is null
);

create policy personal_vault_insert_own on personal_vault for insert with check (user_email = auth.email());
