alter table payments
  add column if not exists proof_url text,
  add column if not exists proof_note text;

alter table company_users
  add column if not exists google_connect_status text not null default 'approved';

create index if not exists company_users_google_connect_status
  on company_users (google_connect_status);

notify pgrst, 'reload schema';
