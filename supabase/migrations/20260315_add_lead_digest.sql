-- Add daily lead digest settings to stores
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS daily_digest_enabled   boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS daily_digest_time       text,                         -- "HH:MM" in UTC, e.g. "17:00"
  ADD COLUMN IF NOT EXISTS daily_digest_statuses   text[]    NOT NULL DEFAULT '{}', -- e.g. '{New,Qualified}'
  ADD COLUMN IF NOT EXISTS daily_digest_last_sent  date;                         -- prevents duplicate sends on same day

-- ─── Cron job: runs every minute, triggers the edge function ───────────────────
-- Requires pg_cron + pg_net extensions (both enabled by default on Supabase).
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY before running,
-- or set them as Supabase Vault secrets and reference them here.

SELECT cron.schedule(
  'send-daily-lead-digest',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ffhdrhvstaonvcludbgn.supabase.co/functions/v1/send-daily-digest',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  );
  $$
);
