-- Fix mutable search_path on set_updated_at (others already set it)
create or replace function public.set_updated_at()
returns trigger language plpgsql
security definer set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Restrict storage SELECT to direct object reads (drop broad policies, keep public via bucket)
drop policy if exists "Listing images are publicly readable" on storage.objects;
drop policy if exists "Avatars are publicly readable" on storage.objects;

-- The buckets are public, so getPublicUrl works without a SELECT policy.
-- Add narrow policies so authenticated owners can SELECT their own files (e.g., for listing/management).
create policy "Owners can list own listing files"
  on storage.objects for select
  using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Owners can list own avatars"
  on storage.objects for select
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
