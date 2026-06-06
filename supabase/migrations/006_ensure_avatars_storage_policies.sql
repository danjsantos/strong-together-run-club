-- ============================================================
-- 006_ensure_avatars_storage_policies.sql
--
-- Root Cause 3 fix: Ensure the avatars bucket exists and all
-- required storage policies are in place.  This migration is
-- fully idempotent (drop-if-exists before every create) so it
-- is safe to run on a fresh project or one that already has
-- partial policies applied.
--
-- Policies required for the profile avatar upload flow:
--   SELECT  — public read (anyone can view avatars)
--   INSERT  — authenticated users can upload
--   UPDATE  — authenticated users can replace their own avatar
--             (path-prefix check, not owner column, because
--              owner can be NULL on re-uploads via upsert:true)
--   DELETE  — authenticated users can delete their own avatar
-- ============================================================

-- Ensure the bucket exists
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- ── SELECT ────────────────────────────────────────────────────
drop policy if exists "Avatars are publicly accessible" on storage.objects;
create policy "Avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── INSERT ────────────────────────────────────────────────────
drop policy if exists "Authenticated users can upload avatars" on storage.objects;
create policy "Authenticated users can upload avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
  );

-- ── UPDATE ────────────────────────────────────────────────────
-- Use path-prefix check rather than owner column (owner can be
-- NULL when upsert:true triggers an UPDATE on an existing row).
drop policy if exists "Authenticated users can update own avatars" on storage.objects;
create policy "Authenticated users can update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ── DELETE ────────────────────────────────────────────────────
drop policy if exists "Authenticated users can delete own avatars" on storage.objects;
create policy "Authenticated users can delete own avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
