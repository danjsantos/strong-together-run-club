# Strong Together Run Club

Website for Strong Together Run Club — Myrtle Beach, SC.

**Stack:** Next.js 14 · Tailwind CSS · Supabase (auth + db) · Google OAuth · Vercel

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev, your domain in prod |

### 3. Set up the database

In your Supabase project → **SQL Editor**, run in order:

1. `supabase/schema.sql` — creates tables + RLS policies + storage bucket
2. `supabase/migrations/001_gallery_feature.sql` — gallery tables
3. `supabase/migrations/002_running_profile_onboarding.sql` — onboarding columns + initial admin
4. `supabase/migrations/003_badges_goals_city.sql` — badges, goals, and city columns (required for dashboard and profile pages)
5. `supabase/migrations/004_fix_avatars_storage_policy.sql` — fixes the avatars Storage UPDATE policy so photo replacement works correctly
6. `supabase/migrations/005_add_bio_to_profiles.sql` — adds the `bio` column to the profiles table (required for onboarding Step 2 and the profile page)

### 4. Enable Google OAuth in Supabase

1. Supabase → Authentication → Providers → Google
2. Enable it and add your **Client ID** and **Client Secret** from Google Cloud Console
3. In **Google Cloud Console → OAuth 2.0 → Authorised redirect URIs**, add:
   - `https://your-project.supabase.co/auth/v1/callback`
4. In **Supabase → Authentication → URL Configuration**, set:
   - **Site URL:** `https://strongtogetherrunclub.com` (production)
   - **Redirect URLs:** `https://strongtogetherrunclub.com/api/auth/callback`
   - For local dev also add: `http://localhost:3000/api/auth/callback`

> **Important:** The OAuth callback is handled server-side at `/api/auth/callback`.
> This route exchanges the PKCE code for a session, sets the auth cookies, and
> redirects the user — either to `/onboarding` (first login) or to `/` (returning user).
> Do **not** use the bare site URL (`https://strongtogetherrunclub.com`) as the redirect
> target in Supabase; always use the `/api/auth/callback` path.

### 5. Run locally

```bash
npm run dev
```

---

## Deploy to Vercel

Push to `main` — Vercel auto-deploys via GitHub integration.

### Environment variables in Vercel

Dashboard → Project → Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL=https://strongtogetherrunclub.com
```

---

## Features

| Feature | Notes |
|---|---|
| Homepage | Hero · Stats · Next run preview · Photo gallery |
| Next Run page | Event details · Google Maps · Weather (Open-Meteo) · RSVP |
| RSVP | Login required · Saves to Supabase · Cancel anytime |
| Google Auth | Sign in with Google via Supabase Auth (PKCE, server-side callback) |
| Admin dashboard | Protected route · Create events · View RSVP lists |
| Bilingual | English / Portuguese / Spanish toggle (persisted in localStorage) |
| Mobile first | Fully responsive, pure Tailwind — no component libraries |

---

## Project Structure

```
app/
  page.tsx              Homepage (server component)
  login/page.tsx        Google login page
  next-run/             Next run details + RSVP
  admin/                Protected admin dashboard
  api/
    auth/callback/      OAuth PKCE callback handler (server-side)
    rsvp/               RSVP read + write
    events/             Event CRUD (admin only)

components/
  providers/            LanguageProvider (EN/PT/ES context)
  Header.tsx            Sticky header + mobile menu + auth state
  Footer.tsx
  HeroSection.tsx
  StatsSection.tsx
  NextRunPreview.tsx
  PhotoGallery.tsx      Masonry grid + lightbox
  WeatherWidget.tsx     Open-Meteo API, Myrtle Beach coords
  RSVPForm.tsx          Auth-aware RSVP form
  AdminEventForm.tsx    Create/edit event form

lib/
  supabase/             Browser + server clients + admin helpers
  translations.ts       All EN/PT/ES strings
  utils.ts              Date formatting, weather helpers

supabase/
  schema.sql            Tables + RLS + storage
  seed.sql              Sample data
  migrations/           Incremental schema changes
```

---

## Color Palette

| Token | Hex |
|---|---|
| `brand-pink` | `#E91E8C` |
| `brand-wine` | `#6B1A3A` |
| `brand-dark` | `#1A0A12` |
| White | `#FFFFFF` |

---

## Admin Access

Admin status is controlled by the `is_admin` boolean column on the `profiles` table —
**not** by an environment variable. To grant admin access to a user:

```sql
-- Run in Supabase SQL Editor
update public.profiles
set is_admin = true
where id = (
  select id from auth.users
  where email = 'user@example.com'
  limit 1
);
```

The middleware at `middleware.ts` enforces admin access at the edge for all `/admin/*`
routes using the service-role key to bypass RLS. The navbar reads `profiles.is_admin`
client-side after session load to show/hide the Admin link.
