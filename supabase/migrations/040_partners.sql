-- B2B partner accounts. Service role reads this from the partner dashboard API.
-- total_ids is optional; when null the API counts company_users for company_id.

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  firebase_uid text unique,
  partner_name text not null,
  company_name text not null,
  company_id uuid references companies(id) on delete set null,
  total_ids integer,
  payment_status text not null default 'pending',
  renewal_date date,
  created_at timestamptz not null default now()
);

create index if not exists partners_company_id on partners (company_id);

alter table partners enable row level security;

notify pgrst, 'reload schema';
