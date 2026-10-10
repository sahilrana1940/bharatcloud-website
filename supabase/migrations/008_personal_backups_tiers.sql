-- Hot / Cold / Vault tiered personal backups (B2C + B2B)

create table if not exists personal_backups (
  id uuid primary key default gen_random_uuid(),
  user_email text not null,
  file_name text not null,
  hot_path text,
  cold_path text,
  vault_path text not null,
  hot_url text,
  cold_url text,
  vault_url text,
  file_size bigint not null default 0,
  type text not null default 'file'
    check (type in ('photo', 'video', 'whatsapp', 'file')),
  storage_tier text not null default 'hot'
    check (storage_tier in ('hot', 'cold', 'vault')),
  created_at timestamptz not null default now(),
  last_accessed timestamptz not null default now(),
  is_deleted boolean not null default false,
  company_domain text,
  mime_type text
);

create index if not exists personal_backups_user on personal_backups (user_email, is_deleted);
create index if not exists personal_backups_tier_created on personal_backups (storage_tier, created_at);
create index if not exists personal_backups_company on personal_backups (company_domain);

alter table personal_backups enable row level security;

create policy personal_backups_select_own on personal_backups
  for select using (user_email = auth.email());

create policy personal_backups_insert_own on personal_backups
  for insert with check (user_email = auth.email());

create policy personal_backups_update_own on personal_backups
  for update using (user_email = auth.email());

-- Private buckets (service role + signed URLs in app)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('bharatcloud-hot', 'bharatcloud-hot', false, 524288000, null),
  ('bharatcloud-cold', 'bharatcloud-cold', false, 524288000, null),
  ('bharatcloud-vault', 'bharatcloud-vault', false, 524288000, null)
on conflict (id) do update set public = false;
