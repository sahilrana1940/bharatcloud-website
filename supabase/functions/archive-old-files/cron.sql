-- Schedule daily archive (Supabase Dashboard → Database → Extensions → pg_cron)
-- Or invoke via external cron: POST https://<project>.supabase.co/functions/v1/archive-old-files

select cron.schedule(
  'archive-personal-hot-to-cold',
  '0 3 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_functions_url', true) || '/archive-old-files',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
