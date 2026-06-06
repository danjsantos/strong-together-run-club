-- ============================================================
-- 002_running_profile_onboarding.sql
-- Adds running-profile columns to profiles and marks
-- anacristinamellone@yahoo.com as admin.
-- ============================================================

-- ── Running profile columns ──────────────────────────────────
alter table public.profiles
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists experience_level    text,      -- 'beginner' | 'intermediate' | 'advanced'
  add column if not exists weekly_mileage      text,      -- '0-10' | '10-20' | '20-30' | '30+'
  add column if not exists avg_pace            text,      -- e.g. '8:00 min/mi'
  add column if not exists preferred_distance  text,      -- '5K' | '10K' | 'Half Marathon' | 'Marathon' | 'Ultra'
  add column if not exists running_goals       text[],    -- array of goal tags
  add column if not exists city               text,
  add column if not exists shoe_brand         text;

-- ── Grant admin to Ana Cristina ──────────────────────────────
-- We join auth.users to find the UUID for the email, then update profiles.
update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where email = 'anacristinamellone@yahoo.com'
  limit 1
);
