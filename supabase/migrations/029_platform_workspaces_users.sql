-- Super Admin / Admin (paid tenant) / Employee model

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  owner_email text not null,
  company_id uuid references companies(id) on delete set null,
  plan_paid boolean not null default false,
  paytm_txn text,
  e2e_prefix text,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_owner on workspaces (owner_email);

create table if not exists platform_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('SuperAdmin', 'Admin', 'Employee')),
  workspace_id uuid references workspaces(id) on delete set null,
  plan_paid boolean not null default false,
  paytm_txn text,
  created_at timestamptz not null default now()
);

create index if not exists platform_users_workspace on platform_users (workspace_id);

alter table workspaces enable row level security;
alter table platform_users enable row level security;

notify pgrst, 'reload schema';
