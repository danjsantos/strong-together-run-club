'use client'

/**
 * AuthCodeHandler
 *
 * When Supabase OAuth redirects back to the site URL (instead of /api/auth/callback),
 * the ?code= query param lands on the home page. This component detects that,
 * exchanges the code for a session, checks onboarding_complete, and redirects
 * the user to /onboarding if they haven't completed it yet.
 *
 * Mount this once inside the home page layout (it renders nothing visible).
 */

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCodeHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) return

    const handle = async () => {
      const supabase = createClient()

      // Exchange the PKCE code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      if (error || !data.user) return

      // Upsert profile (in case it doesn't exist yet)
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.full_name || data.user.email,
        avatar_url: data.user.user_metadata?.avatar_url,
      }, { onConflict: 'id' })

      // Check onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', data.user.id)
        .single()

      // Clean the ?code= from the URL regardless of outcome
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('code')

      if (!profile?.onboarding_complete) {
        router.replace('/onboarding?next=/')
      } else {
        // Already onboarded — just clean the URL
        router.replace(cleanUrl.pathname + (cleanUrl.search || ''))
      }
    }

    handle()
  }, [router, searchParams])

  return null
}
