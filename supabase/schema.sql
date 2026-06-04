-- =============================================================
-- Strong Together Run Club — Supabase Schema
-- Run this in your Supabase SQL editor (Project > SQL Editor)
-- =============================================================

-- --------------------------------------------------------
-- profiles
-- --------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text,
  avatar_url  text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- --------------------------------------------------------
-- events
-- --------------------------------------------------------
create table if not exists public.events (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  title_pt            text,
  description         text,
  description_pt      text,
  date                timestamptz not null,
  location            text not null,
  location_pt         text,
  google_maps_url     text,
  google_maps_embed   text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Events are publicly readable"
  on public.events for select using (true);

create policy "Authenticated users cannot insert events directly"
  on public.events for insert with check (false);

create policy "Authenticated users cannot update events directly"
  on public.events for update using (false);

create policy "Authenticated users cannot delete events directly"
  on public.events for delete using (false);

-- Allow service role (API routes) to bypass RLS — this is the default.
-- Admin API routes use the anon key with server-side auth check.
-- For production, use service_role key in API routes instead.

-- --------------------------------------------------------
-- rsvps
-- --------------------------------------------------------
create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  email       text,
  created_at  timestamptz not null default now(),
  unique(event_id, user_id)
);

alter table public.rsvps enable row level security;

create policy "Users can view own RSVPs"
  on public.rsvps for select using (auth.uid() = user_id);

create policy "Authenticated users can insert own RSVP"
  on public.rsvps for insert with check (auth.uid() = user_id);

create policy "Users can delete own RSVP"
  on public.rsvps for delete using (auth.uid() = user_id);

-- --------------------------------------------------------
-- photos
-- --------------------------------------------------------
create table if not exists public.photos (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references public.events(id) on delete set null,
  url         text not null,
  alt         text,
  created_at  timestamptz not null default now()
);

alter table public.photos enable row level security;

create policy "Photos are publicly readable"
  on public.photos for select using (true);

-- --------------------------------------------------------
-- Storage bucket for photos
-- --------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "Photos are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Authenticated users can upload photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "Authenticated users can delete own photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and auth.uid() = owner);

-- --------------------------------------------------------
-- Auto-create profile on signup
-- --------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      avatar_url = excluded.avatar_url;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
