import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * /api/auth/callback
 *
 * Handles the OAuth PKCE code exchange server-side.
 *
 * Supabase redirects here after Google OAuth (or email confirmation) with
 * a one-time `code` query parameter.  We exchange it for a session, persist
 * the session cookies, upsert the user's profile row, and then redirect the
 * browser to the correct destination:
 *   - /onboarding  — if the user has never completed onboarding
 *   - `next` param — otherwise (defaults to /)
 *
 * This route MUST be registered as the redirect URL in:
 *   1. Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
 *      (add https://strongtogetherrunclub.com/api/auth/callback)
 *   2. Google Cloud Console → OAuth 2.0 → Authorised redirect URIs
 *      (add https://strongtogetherrunclub.com/api/auth/callback)
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // If there is no code we cannot do anything useful — send the user home.
  if (!code) {
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    // Code exchange failed (expired, already used, etc.) — redirect home.
    console.error('[auth/callback] exchangeCodeForSession error:', error?.message)
    return NextResponse.redirect(new URL('/', requestUrl.origin))
  }

  const user = data.user

  // Root Cause 1 fix: read the existing profile FIRST so we know whether
  // onboarding has already been completed before deciding what to upsert.
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    // Profile row does not exist yet — create it with onboarding_complete = false.
    // The trigger should have done this, but this is a safety net for OAuth flows.
    await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email,
      avatar_url: user.user_metadata?.avatar_url ?? null,
      onboarding_complete: false,
    })
  }
  // If the profile already exists we do NOT touch it here — in particular we
  // must NOT overwrite onboarding_complete, which would reset a completed user.

  const onboardingDone = existingProfile?.onboarding_complete === true

  if (!onboardingDone) {
    const onboardingUrl = new URL('/onboarding', requestUrl.origin)
    onboardingUrl.searchParams.set('next', next)
    return NextResponse.redirect(onboardingUrl)
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
