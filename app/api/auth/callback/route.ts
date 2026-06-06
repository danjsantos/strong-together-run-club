import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (code) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Upsert profile row (creates it if it doesn't exist yet)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email,
        avatar_url: data.user.user_metadata?.avatar_url,
      }, { onConflict: 'id' })

      // Check whether this user has already completed onboarding.
      // If not, redirect them to /onboarding instead of the original `next`.
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single()

      const onboardingDone = profileRow?.onboarding_complete === true

      if (!onboardingDone) {
        const onboardingUrl = new URL('/onboarding', requestUrl.origin)
        onboardingUrl.searchParams.set('next', next)
        return NextResponse.redirect(onboardingUrl)
      }
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin))
}
