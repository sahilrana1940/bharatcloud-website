alter table google_oauth_tokens
  add column if not exists google_email text;

comment on column google_oauth_tokens.google_email is
  'Google account email from OAuth userinfo (tokens stored encrypted at application layer).';
