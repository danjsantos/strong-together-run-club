# Strong Together Run Club

Website for Strong Together Run Club — Myrtle Beach, SC.

**Stack:** Next.js 14 · Tailwind CSS · Supabase (auth + db) · Google OAuth · Cloudflare Workers

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
| `NEXT_PUBLIC_ADMIN_EMAILS` | Your email (comma-separated for multiple admins) |
| `ADMIN_EMAILS` | Same as above |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` in dev, your domain in prod |

### 3. Set up the database

In your Supabase project → **SQL Editor**, run:

1. `supabase/schema.sql` — creates tables + RLS policies + storage bucket
2. `supabase/seed.sql` — adds sample events (optional)

### 4. Enable Google OAuth in Supabase

1. Supabase → Authentication → Providers → Google
2. Enable it and add your **Client ID** and **Client Secret** from Google Cloud Console
3. Add the callback URL to Google: `https://your-project.supabase.co/auth/v1/callback`
4. Also add your site URL to Supabase → Authentication → URL Configuration:
   - **Site URL:** `http://localhost:3000` (dev) / your domain (prod)
   - **Redirect URLs:** `http://localhost:3000/api/auth/callback`

### 5. Run locally

```bash
npm run dev
```

---

## Deploy to Cloudflare Pages

### First-time setup

```bash
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name=strong-together-run-club
```

### After that, just run:

```bash
npm run deploy
```

### Set environment variables in Cloudflare

Dashboard → Pages → your project → Settings → Environment variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ADMIN_EMAILS
NEXT_PUBLIC_ADMIN_EMAILS
NEXT_PUBLIC_SITE_URL
```

---

## Features

| Feature | Notes |
|---|---|
| Homepage | Hero · Stats · Next run preview · Photo gallery |
| Next Run page | Event details · Google Maps · Weather (Open-Meteo) · RSVP |
| RSVP | Login required · Saves to Supabase · Cancel anytime |
| Google Auth | Sign in with Google via Supabase Auth |
| Admin dashboard | Protected route · Create events · View RSVP lists |
| Bilingual | English / Portuguese toggle (persisted in localStorage) |
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
    auth/callback/      OAuth callback handler
    rsvp/               RSVP read + write
    events/             Event CRUD (admin only)

components/
  providers/            LanguageProvider (EN/PT context)
  Header.tsx            Sticky header + mobile menu
  Footer.tsx
  HeroSection.tsx
  StatsSection.tsx
  NextRunPreview.tsx
  PhotoGallery.tsx      Masonry grid + lightbox
  WeatherWidget.tsx     Open-Meteo API, Myrtle Beach coords
  RSVPForm.tsx          Auth-aware RSVP form
  AdminEventForm.tsx    Create/edit event form

lib/
  supabase/             Browser + server clients
  translations.ts       All EN/PT strings
  utils.ts              Date formatting, weather helpers

supabase/
  schema.sql            Tables + RLS + storage
  seed.sql              Sample data
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

Set `ADMIN_EMAILS` in your `.env.local` (and in Cloudflare env vars for prod).
The middleware blocks non-admin users from `/admin/*` at the edge.
