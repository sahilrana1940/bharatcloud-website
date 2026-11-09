-- BharatCloud product tables.
-- Supabase Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Sirf nayi bc_ tables banegi. Purana data, partners, companies, payments delete nahi hoga.
-- Employee alag table nahi hai. Employee aur Company Admin dono bc_users me role se rehte hain.

create table if not exists bc_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  name text not null,
  mobile text not null default '',
  whatsapp text not null default '',
  role text not null check (role in ('super_admin', 'partner', 'company_admin', 'employee')),
  state text not null default '',
  city text not null default '',
  status text not null default 'active' check (status in ('pending', 'approved', 'rejected', 'active')),
  partner_id uuid,
  company_id uuid,
  storage_gb integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists bc_partners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references bc_users(id) on delete cascade,
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  total_ids integer not null default 0,
  total_gb integer not null default 0,
  buy_price_paise integer not null default 699900,
  created_at timestamptz not null default now()
);

create table if not exists bc_companies (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references bc_partners(id) on delete cascade,
  name text not null,
  admin_user_id uuid references bc_users(id) on delete set null,
  yearly_paise integer not null,
  monthly_paise integer not null,
  cycle text not null check (cycle in ('monthly', 'yearly', 'both')),
  allocated_ids integer not null,
  allocated_gb integer not null,
  demo_started_at timestamptz not null default now(),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table bc_users add column if not exists email text;
alter table bc_users add column if not exists password_hash text;
alter table bc_users add column if not exists name text;
alter table bc_users add column if not exists mobile text not null default '';
alter table bc_users add column if not exists whatsapp text not null default '';
alter table bc_users add column if not exists role text;
alter table bc_users add column if not exists state text not null default '';
alter table bc_users add column if not exists city text not null default '';
alter table bc_users add column if not exists status text not null default 'active';
alter table bc_users add column if not exists partner_id uuid;
alter table bc_users add column if not exists company_id uuid;
alter table bc_users add column if not exists storage_gb integer not null default 0;
alter table bc_users add column if not exists created_at timestamptz not null default now();

alter table bc_partners add column if not exists user_id uuid;
alter table bc_partners add column if not exists payment_status text not null default 'unpaid';
alter table bc_partners add column if not exists total_ids integer not null default 0;
alter table bc_partners add column if not exists total_gb integer not null default 0;
alter table bc_partners add column if not exists buy_price_paise integer not null default 699900;
alter table bc_partners add column if not exists created_at timestamptz not null default now();

alter table bc_companies add column if not exists partner_id uuid;
alter table bc_companies add column if not exists name text;
alter table bc_companies add column if not exists admin_user_id uuid;
alter table bc_companies add column if not exists yearly_paise integer;
alter table bc_companies add column if not exists monthly_paise integer;
alter table bc_companies add column if not exists cycle text;
alter table bc_companies add column if not exists allocated_ids integer;
alter table bc_companies add column if not exists allocated_gb integer;
alter table bc_companies add column if not exists demo_started_at timestamptz not null default now();
alter table bc_companies add column if not exists payment_status text not null default 'unpaid';
alter table bc_companies add column if not exists paid_at timestamptz;
alter table bc_companies add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'bc_users_partner_fk') then
    alter table bc_users
      add constraint bc_users_partner_fk
      foreign key (partner_id) references bc_partners(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bc_users_company_fk') then
    alter table bc_users
      add constraint bc_users_company_fk
      foreign key (company_id) references bc_companies(id) on delete set null;
  end if;
end $$;

create table if not exists bc_payments (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('partner_plan', 'company_plan')),
  user_id uuid not null references bc_users(id) on delete cascade,
  partner_id uuid references bc_partners(id) on delete set null,
  company_id uuid references bc_companies(id) on delete set null,
  amount_paise integer not null,
  cycle text,
  upi_ref text not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  created_at timestamptz not null default now()
);

create table if not exists bc_commissions (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references bc_partners(id) on delete cascade,
  company_id uuid references bc_companies(id) on delete set null,
  payment_id uuid references bc_payments(id) on delete set null,
  amount_paise integer not null,
  status text not null default 'pending' check (status in ('pending', 'paid')),
  created_at timestamptz not null default now()
);

create table if not exists bc_files (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references bc_companies(id) on delete cascade,
  owner_id uuid not null references bc_users(id) on delete cascade,
  parent_id uuid references bc_files(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('file', 'folder')),
  size_bytes bigint not null default 0,
  storage_path text,
  mime text,
  trashed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bc_stars (
  user_id uuid not null references bc_users(id) on delete cascade,
  file_id uuid not null references bc_files(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, file_id)
);

create table if not exists bc_shares (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references bc_files(id) on delete cascade,
  company_id uuid not null references bc_companies(id) on delete cascade,
  shared_by uuid not null references bc_users(id) on delete cascade,
  shared_with uuid references bc_users(id) on delete cascade,
  link_token text unique,
  link_enabled boolean not null default false,
  permission text not null check (permission in ('view', 'comment', 'edit', 'download')),
  created_at timestamptz not null default now()
);

create table if not exists bc_comments (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references bc_files(id) on delete cascade,
  user_id uuid not null references bc_users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists bc_activity (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references bc_files(id) on delete cascade,
  actor_id uuid references bc_users(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now()
);

create table if not exists bc_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references bc_users(id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists bc_email_backups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references bc_companies(id) on delete cascade,
  user_id uuid not null references bc_users(id) on delete cascade,
  subject text not null,
  from_email text not null default '',
  size_bytes bigint not null default 0,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create index if not exists bc_files_company on bc_files (company_id, parent_id);
create index if not exists bc_shares_with on bc_shares (shared_with);
create index if not exists bc_shares_file on bc_shares (file_id);
create index if not exists bc_users_role on bc_users (role);
create index if not exists bc_users_company on bc_users (company_id);
create index if not exists bc_companies_partner on bc_companies (partner_id);

alter table bc_users enable row level security;
alter table bc_partners enable row level security;
alter table bc_companies enable row level security;
alter table bc_payments enable row level security;
alter table bc_commissions enable row level security;
alter table bc_files enable row level security;
alter table bc_stars enable row level security;
alter table bc_shares enable row level security;
alter table bc_comments enable row level security;
alter table bc_activity enable row level security;
alter table bc_notifications enable row level security;
alter table bc_email_backups enable row level security;

grant all on table
  bc_users,
  bc_partners,
  bc_companies,
  bc_payments,
  bc_commissions,
  bc_files,
  bc_stars,
  bc_shares,
  bc_comments,
  bc_activity,
  bc_notifications,
  bc_email_backups
to service_role;

do $$
begin
  insert into storage.buckets (id, name, public)
  values ('bc-drive', 'bc-drive', false)
  on conflict (id) do nothing;
exception
  when others then
    raise notice 'bc-drive bucket skip: %', sqlerrm;
end $$;

notify pgrst, 'reload schema';
