-- Add facebook_leadgen_id to leads for deduplication between webhook and sync
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS facebook_leadgen_id text;

-- Unique constraint: one row per leadgen_id per store
CREATE UNIQUE INDEX IF NOT EXISTS leads_facebook_leadgen_id_unique
  ON public.leads (store_id, facebook_leadgen_id)
  WHERE facebook_leadgen_id IS NOT NULL;

-- Cron job: runs every 30 minutes to catch leads the webhook may have missed
SELECT cron.schedule(
  'facebook-leads-sync',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://ffhdrhvstaonvcludbgn.supabase.co/functions/v1/facebook-leads-sync',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
    ),
    body    := '{}'::jsonb
  );
  $$
);
