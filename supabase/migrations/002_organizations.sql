-- BharatCloud B2B SaaS — organizations & members

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_email text not null unique,
  plan text not null default 'free',
  storage_limit bigint not null default 10737418240,
  storage_used bigint not null default 0,
  status text not null default 'active' check (status in ('active', 'blocked')),
  created_at timestamptz not null default now()
);

create table if not exists org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_email text not null,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  joined_at timestamptz not null default now(),
  unique (org_id, user_email)
);

create index if not exists idx_org_members_org on org_members(org_id);
create index if not exists idx_organizations_status on organizations(status);
