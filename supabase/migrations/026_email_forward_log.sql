create table if not exists email_forward_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  archived_email_id uuid,
  from_company_email text not null,
  requested_by text not null,
  to_email text not null,
  subject text,
  body_preview text,
  delivery_status text not null default 'queued',
  created_at timestamptz not null default now()
);

create index if not exists email_forward_log_company on email_forward_log (company_id, created_at desc);
create index if not exists email_forward_log_requester on email_forward_log (requested_by, created_at desc);

notify pgrst, 'reload schema';
