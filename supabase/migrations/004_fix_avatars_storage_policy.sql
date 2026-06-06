-- ============================================================
-- 004_fix_avatars_storage_policy.sql
--
-- Bug 1 fix: The original UPDATE policy for the avatars bucket
-- used `auth.uid() = owner`, but the `owner` column in
-- storage.objects is only set on the first INSERT and may be
-- NULL if the row was created by a trigger or a different client.
-- This causes `upsert: true` uploads (used when replacing a photo)
-- to fail with a policy violation on the UPDATE leg.
--
-- Fix: replace the UPDATE policy with one that checks the object
-- path prefix instead. Avatar files are always stored under
-- `{user_id}/avatar.*`, so checking that the path starts with
-- the authenticated user's UUID is both correct and robust.
-- ============================================================

-- Drop the old owner-based UPDATE policy
drop policy if exists "Authenticated users can update own avatars" on storage.objects;

-- New policy: allow UPDATE when the object path starts with the user's UUID
create policy "Authenticated users can update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
