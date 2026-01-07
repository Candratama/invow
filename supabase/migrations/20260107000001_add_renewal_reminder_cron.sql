-- Migration: Setup pg_cron to trigger renewal email daily at 09:00 WIB (02:00 UTC)
-- Requires pg_cron and pg_net extensions
-- Note: These extensions may need to be enabled manually in Supabase Dashboard

-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the cron job
-- Runs daily at 02:00 UTC (09:00 WIB)
SELECT cron.schedule(
  'send-renewal-reminders',           -- job name
  '0 2 * * *',                         -- cron expression: 02:00 UTC daily
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-renewal-email',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
