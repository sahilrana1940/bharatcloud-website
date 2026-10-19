-- One stored copy per team message. Each member gets an inbox pointer, not another file.

create table if not exists team_emails (
  message_id text not null,
  team_id text not null,
  subject text,
  from_email text,
  snippet text,
  storage_path text,
  size_mb numeric not null default 0,
  original_size_mb numeric not null default 0,
  saved_mb numeric not null default 0,
  created_at timestamptz not null default now(),
  primary key (message_id, team_id)
);

create index if not exists team_emails_message_team_idx
  on team_emails (message_id, team_id);

create table if not exists user_inbox_view (
  id uuid primary key default gen_random_uuid(),
  message_id text not null,
  team_id text not null,
  user_email text not null,
  is_read boolean not null default false,
  constraint user_inbox_view_mail_fk
    foreign key (message_id, team_id)
    references team_emails (message_id, team_id)
    on delete cascade,
  unique (message_id, team_id, user_email)
);

create index if not exists user_inbox_view_message_team_idx
  on user_inbox_view (message_id, team_id);

create index if not exists user_inbox_view_user_idx
  on user_inbox_view (user_email);

alter table team_emails enable row level security;
alter table user_inbox_view enable row level security;

notify pgrst, 'reload schema';
