-- Add Facebook Lead Ads columns to stores
alter table public.stores
  add column if not exists facebook_page_id text,
  add column if not exists facebook_page_token text;

-- Index for fast webhook routing: page_id → store
create index if not exists stores_facebook_page_id_idx on public.stores(facebook_page_id);
