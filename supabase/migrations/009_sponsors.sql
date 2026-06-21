-- =============================================================
-- Migration: Sponsors Feature
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times (uses IF NOT EXISTS / guards).
-- =============================================================

create table if not exists public.sponsors (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  logo_url   text,
  link_url   text,
  active     boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.sponsors enable row level security;

-- Public can read only ACTIVE sponsors
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sponsors'
      and policyname = 'Active sponsors are publicly readable'
  ) then
    create policy "Active sponsors are publicly readable"
      on public.sponsors for select using (active = true);
  end if;
end $$;

-- Block direct client writes. The admin API route writes via the service role,
-- which bypasses RLS, so these policies only stop untrusted direct access.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sponsors'
      and policyname = 'No direct client inserts on sponsors'
  ) then
    create policy "No direct client inserts on sponsors"
      on public.sponsors for insert with check (false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sponsors'
      and policyname = 'No direct client updates on sponsors'
  ) then
    create policy "No direct client updates on sponsors"
      on public.sponsors for update using (false);
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'sponsors'
      and policyname = 'No direct client deletes on sponsors'
  ) then
    create policy "No direct client deletes on sponsors"
      on public.sponsors for delete using (false);
  end if;
end $$;
