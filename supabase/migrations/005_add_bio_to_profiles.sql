-- Migration 005: Add bio column to profiles table
-- The bio column is used in onboarding (Step 2) and the profile page
-- but was missing from the initial schema and all previous migrations.

alter table public.profiles
  add column if not exists bio text;
