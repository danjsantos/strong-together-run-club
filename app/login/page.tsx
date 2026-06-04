'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'


function LoginContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(redirectTo)
    })
  }, [router, redirectTo])

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-pink/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-brand-dark/80 backdrop-blur-xl rounded-3xl border border-brand-wine/40 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Logo className="h-12 w-auto" />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2">{t.login.title}</h1>
            <p className="text-white/50 text-sm">{t.login.subtitle}</p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3.5 px-6 rounded-full hover:bg-white/90 hover:scale-[1.01] transition-all duration-200 shadow-lg"
          >
            {/* Google icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t.login.signInGoogle}
          </button>

          <p className="text-center text-white/30 text-xs mt-6">{t.login.terms}</p>
        </div>

        {/* Decorative dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`rounded-full ${i === 1 ? 'w-6 h-1.5 bg-brand-pink' : 'w-1.5 h-1.5 bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
