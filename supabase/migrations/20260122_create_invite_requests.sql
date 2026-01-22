create table if not exists public.invite_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  store_id uuid not null references public.stores(id) on delete cascade,
  requested_role text not null default 'store_user',
  status text not null default 'pending',
  created_at timestamptz default now()
);

create index if not exists invite_requests_email_idx on public.invite_requests(email);
create index if not exists invite_requests_store_id_idx on public.invite_requests(store_id);

alter table public.invite_requests enable row level security;

-- Store owners can insert invites for their store
create policy invite_requests_store_insert on public.invite_requests
  for insert
  with check (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()));

-- Store owners can view their store invites
create policy invite_requests_store_select on public.invite_requests
  for select
  using (store_id = (select profiles.store_id from public.profiles where profiles.id = auth.uid()));

-- Super admin can manage all invites
create policy invite_requests_super_admin on public.invite_requests
  for all
  using (public.is_super_admin())
  with check (public.is_super_admin());
