alter table file_archives add column if not exists gmail_message_id text;

create unique index if not exists file_archives_user_gmail_message
  on file_archives (user_id, gmail_message_id)
  where user_id is not null and gmail_message_id is not null;

notify pgrst, 'reload schema';
