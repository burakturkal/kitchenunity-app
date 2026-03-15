-- The stores table was created before the standard super_admin bypass pattern was established.
-- This migration adds a super_admin policy so that users with role='super_admin' can
-- update any store, not just the store linked to their profile.
-- Without this, updating a new store (with no profile.store_id pointing to it) returns 403.

-- Drop existing super_admin policies if they exist (idempotent)
drop policy if exists "stores_super_admin" on public.stores;
drop policy if exists "stores_super_admin_all" on public.stores;

-- Allow super_admin full read/write access to all stores
create policy "stores_super_admin"
  on public.stores
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.role = 'super_admin'
    )
  );
