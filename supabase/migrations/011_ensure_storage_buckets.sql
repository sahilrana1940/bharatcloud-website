-- Run in Supabase SQL Editor if uploads fail with "Bucket not found"
insert into storage.buckets (id, name, public)
values
  ('bharatcloud-personal-hot', 'bharatcloud-personal-hot', false),
  ('bharatcloud-company-hot', 'bharatcloud-company-hot', false),
  ('bharatcloud-cold', 'bharatcloud-cold', false),
  ('bharatcloud-vault', 'bharatcloud-vault', false),
  ('bharatcloud-thumbs', 'bharatcloud-thumbs', false),
  ('bharatcloud-backups', 'bharatcloud-backups', false)
on conflict (id) do update set public = false;
