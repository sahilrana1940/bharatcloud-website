-- BharatCloud workspace login tracking (NOT Supabase Auth public.profiles)

create table if not exists workspace_profiles (
  email text primary key,
  company_id uuid references companies(id) on delete set null,
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workspace_profiles_company on workspace_profiles (company_id);

create table if not exists workspace_profile_invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  invited_by text,
  created_at timestamptz not null default now(),
  unique (company_id, email)
);

create index if not exists workspace_profile_invites_company on workspace_profile_invites (company_id);

notify pgrst, 'reload schema';
