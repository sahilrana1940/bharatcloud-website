-- One company copy of a message. Not owned by an employee.
-- Deleting company_users must not delete these rows (no user foreign key).

create table if not exists mails (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  company_domain text not null,
  dedupe_key text not null,
  content_key text,
  rfc_message_id text,
  subject text,
  from_email text,
  to_email text,
  body_text text,
  received_at timestamptz not null default now(),
  company_from_email text not null,
  storage_path text,
  created_at timestamptz not null default now(),
  unique (company_id, dedupe_key)
);

create unique index if not exists mails_company_content_key
  on mails (company_id, content_key)
  where content_key is not null;

create index if not exists mails_company_received
  on mails (company_id, received_at desc);

comment on table mails is
  'Single company archive copy. Survives employee removal. No user_id.';

alter table mails enable row level security;

notify pgrst, 'reload schema';
