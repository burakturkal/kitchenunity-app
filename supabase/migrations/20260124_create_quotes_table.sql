-- Enable UUID generation if not already enabled
create extension if not exists pgcrypto;

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric not null default 0,
  status text default 'Quote',
  line_items jsonb,
  tax_rate numeric,
  is_non_taxable boolean default false,
  notes text,
  attachments jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists quotes_store_id_idx on public.quotes(store_id);
create index if not exists quotes_customer_id_idx on public.quotes(customer_id);

alter table public.quotes enable row level security;

create policy quotes_store_isolation on public.quotes
  for all
  using (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()))
  with check (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()));

create policy quotes_super_admin on public.quotes
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin'));
