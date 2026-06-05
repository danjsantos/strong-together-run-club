-- =============================================================
-- Migration: Gallery Feature
-- Run this in Supabase SQL Editor if the project was already
-- deployed before the gallery feature was added.
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS).
-- =============================================================

-- 1. Add cover_photo_url to events (may already exist)
alter table public.events
  add column if not exists cover_photo_url text;

-- 2. Add location to events (may already exist as NOT NULL)
--    Note: if location already exists as NOT NULL this is a no-op.
alter table public.events
  add column if not exists location text;

-- 3. Create event_photos table
create table if not exists public.event_photos (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete cascade,
  photo_url   text not null,
  caption     text,
  uploaded_at timestamp default now()
);

alter table public.event_photos enable row level security;

-- Public read
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'event_photos'
      and policyname = 'Event photos are publicly readable'
  ) then
    create policy "Event photos are publicly readable"
      on public.event_photos for select using (true);
  end if;
end $$;

-- Block direct client inserts (API route handles inserts via service role)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'event_photos'
      and policyname = 'Authenticated users cannot insert event photos directly'
  ) then
    create policy "Authenticated users cannot insert event photos directly"
      on public.event_photos for insert with check (false);
  end if;
end $$;

-- Block direct client deletes
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'event_photos'
      and policyname = 'Authenticated users cannot delete event photos directly'
  ) then
    create policy "Authenticated users cannot delete event photos directly"
      on public.event_photos for delete using (false);
  end if;
end $$;

-- 4. Create event-photos storage bucket
insert into storage.buckets (id, name, public)
values ('event-photos', 'event-photos', true)
on conflict (id) do nothing;

-- Storage policies (idempotent via DO blocks)
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Event photos are publicly accessible'
  ) then
    create policy "Event photos are publicly accessible"
      on storage.objects for select
      using (bucket_id = 'event-photos');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Authenticated users can upload event photos'
  ) then
    create policy "Authenticated users can upload event photos"
      on storage.objects for insert
      with check (bucket_id = 'event-photos' and auth.role() = 'authenticated');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename  = 'objects'
      and policyname = 'Authenticated users can delete own event photos'
  ) then
    create policy "Authenticated users can delete own event photos"
      on storage.objects for delete
      using (bucket_id = 'event-photos' and auth.uid() = owner);
  end if;
end $$;
