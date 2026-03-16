-- Allow store owners to update their own store record.
-- Without this, RLS blocks updates (e.g. sales_tax) with a 400 for non-super_admin users.

drop policy if exists "stores_owner_update" on public.stores;

create policy "stores_owner_update"
  on public.stores
  for update
  to authenticated
  using (
    id = (select store_id from public.profiles where profiles.id = auth.uid())
  )
  with check (
    id = (select store_id from public.profiles where profiles.id = auth.uid())
  );
