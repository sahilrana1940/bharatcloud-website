-- Metered usage lines per company (VPS / B3 / Mail)

create table if not exists billing_usage (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  service text not null check (service in ('VPS', 'b3', 'Mail')),
  units numeric not null default 1,
  amount int not null,
  month date not null,
  usage_date date not null default (current_date),
  created_at timestamptz not null default now()
);

create index if not exists billing_usage_company_month on billing_usage (company_id, month desc);
create index if not exists billing_usage_company_date on billing_usage (company_id, usage_date desc);

notify pgrst, 'reload schema';
