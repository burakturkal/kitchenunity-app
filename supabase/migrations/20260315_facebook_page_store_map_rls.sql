-- Allow authenticated superadmin users to read and write facebook_page_store_map
-- The table is used by the webhook to route Facebook leads to the correct store.

-- Enable RLS if not already enabled
alter table public.facebook_page_store_map enable row level security;

-- Drop existing policies to avoid conflicts
drop policy if exists "superadmin_select_fb_map" on public.facebook_page_store_map;
drop policy if exists "superadmin_insert_fb_map" on public.facebook_page_store_map;
drop policy if exists "superadmin_update_fb_map" on public.facebook_page_store_map;
drop policy if exists "superadmin_delete_fb_map" on public.facebook_page_store_map;

-- Allow superadmins (role = 'super_admin' in profiles) full access
create policy "superadmin_select_fb_map"
  on public.facebook_page_store_map for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "superadmin_insert_fb_map"
  on public.facebook_page_store_map for insert
  to authenticated
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "superadmin_update_fb_map"
  on public.facebook_page_store_map for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );

create policy "superadmin_delete_fb_map"
  on public.facebook_page_store_map for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );
