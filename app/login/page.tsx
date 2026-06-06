'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

// ─── Google SVG ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

// ─── Eye icons ────────────────────────────────────────────────────────────────
function EyeIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

// ─── Password field with eye toggle ──────────────────────────────────────────
function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 pr-11 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  )
}

// ─── Plain text field ─────────────────────────────────────────────────────────
function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-white/60 text-xs font-semibold uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
      />
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────
type Tab = 'signin' | 'signup' | 'forgot'

function LoginContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

  const [tab, setTab] = useState<Tab>('signin')

  // Sign-in state
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siLoading, setSiLoading] = useState(false)
  const [siError, setSiError] = useState('')

  // Sign-up state
  const [suDisplayName, setSuDisplayName] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirm, setSuConfirm] = useState('')
  const [suLoading, setSuLoading] = useState(false)
  const [suError, setSuError] = useState('')
  const [suSuccess, setSuSuccess] = useState(false)

  // Forgot password state
  const [fpEmail, setFpEmail] = useState('')
  const [fpLoading, setFpLoading] = useState(false)
  const [fpError, setFpError] = useState('')
  const [fpSuccess, setFpSuccess] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push(redirectTo)
    })
  }, [router, redirectTo])

  const resetAll = () => {
    setSiError(''); setSuError(''); setFpError('')
    setSuSuccess(false); setFpSuccess(false)
  }

  // ── Google OAuth ────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })
  }

  // ── Email sign-in ───────────────────────────────────────────────────────────
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setSiLoading(true)
    setSiError('')
    const supabase = createClient()
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: siEmail.trim(),
      password: siPassword,
    })
    if (error) {
      setSiError(error.message)
      setSiLoading(false)
    } else {
      // Check if the user has completed onboarding; if not, send them there first
      const userId = signInData.user?.id
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_complete')
          .eq('id', userId)
          .single()
        if (!profile?.onboarding_complete) {
          router.push(`/onboarding?next=${encodeURIComponent(redirectTo)}`)
          return
        }
      }
      router.push(redirectTo)
    }
  }

  // ── Email sign-up ───────────────────────────────────────────────────────────
  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuError('')

    if (suPassword.length < 6) {
      setSuError(t.login.passwordTooShort)
      return
    }
    if (suPassword !== suConfirm) {
      setSuError(t.login.passwordMismatch)
      return
    }

    setSuLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: suEmail.trim(),
      password: suPassword,
      options: {
        data: { full_name: suDisplayName.trim() },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=${redirectTo}`,
      },
    })

    if (error) {
      setSuError(error.message)
      setSuLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email: data.user.email,
        name: suDisplayName.trim() || data.user.email,
        display_name: suDisplayName.trim() || null,
      }, { onConflict: 'id' })
    }

    setSuLoading(false)
    setSuSuccess(true)
  }

  // ── Forgot password ─────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setFpLoading(true)
    setFpError('')
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(fpEmail.trim(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/profile`,
    })
    if (error) {
      setFpError(error.message)
    } else {
      setFpSuccess(true)
    }
    setFpLoading(false)
  }

  // ── Divider ─────────────────────────────────────────────────────────────────
  const Divider = ({ label }: { label: string }) => (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-white/30 text-xs">{label}</span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-pink/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-brand-dark/80 backdrop-blur-xl rounded-3xl border border-brand-wine/40 p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo className="h-12 w-auto" />
          </div>

          {/* Tab switcher — hidden on forgot-password view */}
          {tab !== 'forgot' && (
            <div className="flex bg-white/5 rounded-2xl p-1 mb-6 gap-1">
              <button
                type="button"
                onClick={() => { setTab('signin'); resetAll() }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tab === 'signin'
                    ? 'bg-brand-pink text-white shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t.login.signInEmail}
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); resetAll() }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  tab === 'signup'
                    ? 'bg-brand-pink text-white shadow'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {t.login.signUp}
              </button>
            </div>
          )}

          {/* ── SIGN IN TAB ── */}
          {tab === 'signin' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-black text-white mb-1">{t.login.title}</h1>
                <p className="text-white/50 text-xs">{t.login.subtitle}</p>
              </div>

              {/* Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-6 rounded-full hover:bg-white/90 hover:scale-[1.01] transition-all duration-200 shadow-lg"
              >
                <GoogleIcon />
                {t.login.signInGoogle}
              </button>

              <Divider label={t.login.orEmail} />

              <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
                <Field
                  label={t.login.emailLabel}
                  type="email"
                  value={siEmail}
                  onChange={setSiEmail}
                  placeholder={t.login.emailPlaceholder}
                  autoComplete="email"
                />
                <PasswordField
                  label={t.login.passwordLabel}
                  value={siPassword}
                  onChange={setSiPassword}
                  placeholder={t.login.passwordPlaceholder}
                  autoComplete="current-password"
                />
                {/* Forgot password link */}
                <div className="flex justify-end -mt-1">
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); resetAll(); setFpEmail(siEmail) }}
                    className="text-brand-pink text-xs hover:underline"
                  >
                    {t.login.forgotPassword}
                  </button>
                </div>
                {siError && (
                  <p className="text-red-400 text-xs text-center">{siError}</p>
                )}
                <button
                  type="submit"
                  disabled={siLoading}
                  className="w-full bg-brand-pink text-white font-bold py-3 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 mt-1"
                >
                  {siLoading ? '...' : t.login.signInEmail}
                </button>
              </form>

              <p className="text-center text-white/30 text-xs mt-5">{t.login.terms}</p>
            </>
          )}

          {/* ── SIGN UP TAB ── */}
          {tab === 'signup' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-black text-white mb-1">{t.login.signUpTitle}</h1>
                <p className="text-white/50 text-xs">{t.login.signUpSubtitle}</p>
              </div>

              {suSuccess ? (
                <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-pink/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-sm">{t.login.signUpSuccess}</p>
                  <p className="text-white/50 text-xs mt-2">{t.login.checkEmail}</p>
                  <button
                    type="button"
                    onClick={() => { setTab('signin'); setSuSuccess(false) }}
                    className="mt-4 text-brand-pink text-sm font-semibold hover:underline"
                  >
                    {t.login.alreadyHaveAccount}
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-6 rounded-full hover:bg-white/90 hover:scale-[1.01] transition-all duration-200 shadow-lg"
                  >
                    <GoogleIcon />
                    {t.login.signInGoogle}
                  </button>

                  <Divider label={t.login.orEmail} />

                  <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3">
                    <Field
                      label={t.login.displayNameLabel}
                      type="text"
                      value={suDisplayName}
                      onChange={setSuDisplayName}
                      placeholder={t.login.displayNamePlaceholder}
                      autoComplete="name"
                    />
                    <Field
                      label={t.login.emailLabel}
                      type="email"
                      value={suEmail}
                      onChange={setSuEmail}
                      placeholder={t.login.emailPlaceholder}
                      autoComplete="email"
                    />
                    <PasswordField
                      label={t.login.passwordLabel}
                      value={suPassword}
                      onChange={setSuPassword}
                      placeholder={t.login.passwordPlaceholder}
                      autoComplete="new-password"
                    />
                    <PasswordField
                      label={t.login.confirmPasswordLabel}
                      value={suConfirm}
                      onChange={setSuConfirm}
                      placeholder={t.login.confirmPasswordPlaceholder}
                      autoComplete="new-password"
                    />
                    {suError && (
                      <p className="text-red-400 text-xs text-center">{suError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={suLoading}
                      className="w-full bg-brand-pink text-white font-bold py-3 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 mt-1"
                    >
                      {suLoading ? '...' : t.login.createAccount}
                    </button>
                  </form>

                  <p className="text-center text-white/30 text-xs mt-4">{t.login.terms}</p>
                </>
              )}
            </>
          )}

          {/* ── FORGOT PASSWORD TAB ── */}
          {tab === 'forgot' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-xl font-black text-white mb-1">{t.login.forgotPasswordTitle}</h1>
                <p className="text-white/50 text-xs">{t.login.forgotPasswordSubtitle}</p>
              </div>

              {fpSuccess ? (
                <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-2xl p-5 text-center">
                  <div className="w-12 h-12 rounded-full bg-brand-pink/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold text-sm">{t.login.resetEmailSent}</p>
                  <button
                    type="button"
                    onClick={() => { setTab('signin'); setFpSuccess(false) }}
                    className="mt-4 text-brand-pink text-sm font-semibold hover:underline"
                  >
                    {t.login.backToSignIn}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                  <Field
                    label={t.login.emailLabel}
                    type="email"
                    value={fpEmail}
                    onChange={setFpEmail}
                    placeholder={t.login.emailPlaceholder}
                    autoComplete="email"
                  />
                  {fpError && (
                    <p className="text-red-400 text-xs text-center">{fpError}</p>
                  )}
                  <button
                    type="submit"
                    disabled={fpLoading}
                    className="w-full bg-brand-pink text-white font-bold py-3 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 mt-1"
                  >
                    {fpLoading ? '...' : t.login.sendResetLink}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTab('signin'); resetAll() }}
                    className="text-white/40 text-xs text-center hover:text-white/70 transition-colors"
                  >
                    ← {t.login.backToSignIn}
                  </button>
                </form>
              )}
            </>
          )}
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
