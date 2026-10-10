-- Payments + billing helpers (run after 004/005)

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  company_domain text not null,
  amount int not null default 1999,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists payments_domain_status on payments (company_domain, status);

alter table companies
  add column if not exists subscription_status text not null default 'trial';

alter table drive_files
  add column if not exists file_size bigint;

update drive_files set file_size = size where file_size is null and size is not null;

alter table email_backups
  add column if not exists company_domain text;

create unique index if not exists email_backups_gmail_id_unique
  on email_backups (gmail_id)
  where gmail_id is not null;
