import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

/**
 * /api/auth/confirm
 *
 * Handles email links that carry a `token_hash` (password recovery, email
 * confirmation, magic link, email change).
 *
 * Unlike /api/auth/callback (PKCE `code` exchange), this flow does NOT depend
 * on a code_verifier cookie from the browser that started the request, so it
 * works when the user opens the link in a different browser — e.g. the in-app
 * browser of a mobile mail client. That is the reason password resets must go
 * through here and not through the PKCE callback.
 *
 * Expected query params:
 *   token_hash  — from the Supabase email template ({{ .TokenHash }})
 *   type        — recovery | signup | email | magiclink | email_change
 *   next        — path to redirect to after verification (default /)
 *
 * Supabase Dashboard setup (must be done manually):
 *   1. Authentication → URL Configuration → Redirect URLs
 *        add https://strongtogetherrunclub.com/api/auth/confirm
 *   2. Authentication → Email Templates → Reset Password, use this link:
 *        {{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null
  const nextParam = requestUrl.searchParams.get('next') ?? '/'
  // Only allow same-origin relative paths to avoid open redirects.
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'

  const errorRedirect = (reason: string) => {
    const url = new URL(next, requestUrl.origin)
    url.searchParams.set('error', reason)
    return NextResponse.redirect(url)
  }

  if (!tokenHash || !type) {
    return errorRedirect('missing_token')
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

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    console.error('[auth/confirm] verifyOtp error:', error.message)
    return errorRedirect('invalid_or_expired')
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
