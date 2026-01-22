-- Enable UUID generation if not already enabled
create extension if not exists pgcrypto;

-- Orders table
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount numeric not null default 0,
  status text,
  tracking_number text,
  line_items jsonb,
  tax_rate numeric,
  is_non_taxable boolean default false,
  notes text,
  attachments jsonb,
  created_at timestamptz default now()
);

create index if not exists orders_store_id_idx on public.orders(store_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);

alter table public.orders enable row level security;

create policy orders_store_isolation on public.orders
  for all
  using (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()))
  with check (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()));

create policy orders_super_admin on public.orders
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin'));

-- Inventory table
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text,
  sku text,
  quantity integer default 0,
  price numeric default 0,
  status text,
  track_stock boolean default true,
  description text,
  created_at timestamptz default now()
);

create index if not exists inventory_store_id_idx on public.inventory(store_id);
create index if not exists inventory_sku_idx on public.inventory(sku);

alter table public.inventory enable row level security;

create policy inventory_store_isolation on public.inventory
  for all
  using (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()))
  with check (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()));

create policy inventory_super_admin on public.inventory
  for all
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin'))
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'super_admin'));
