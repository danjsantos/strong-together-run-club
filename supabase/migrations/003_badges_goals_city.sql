-- ============================================================
-- 003_badges_goals_city.sql
-- Adds city (text), goals (jsonb), and badges (jsonb) columns
-- to profiles table. city was already added in 002 but kept
-- here for idempotency via IF NOT EXISTS.
-- ============================================================

alter table public.profiles
  add column if not exists city    text,
  add column if not exists goals   jsonb,
  add column if not exists badges  jsonb not null default '[]'::jsonb;
