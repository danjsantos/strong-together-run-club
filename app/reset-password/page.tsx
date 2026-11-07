'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'

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
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
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
          autoComplete={autoComplete}
          required
          minLength={6}
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

// ─── Main content ─────────────────────────────────────────────────────────────
type Status = 'checking' | 'ready' | 'invalid' | 'done'

function ResetPasswordContent() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [status, setStatus] = useState<Status>('checking')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // The user reaches this page after /api/auth/confirm verified the recovery
  // token and set the session cookies. If there is no session (link expired,
  // already used, or confirm route reported an error) show the invalid state.
  useEffect(() => {
    if (searchParams.get('error')) {
      setStatus('invalid')
      return
    }
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setStatus(data.user ? 'ready' : 'invalid')
    })
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t.login.passwordTooShort)
      return
    }
    if (password !== confirm) {
      setError(t.login.passwordMismatch)
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setStatus('done')
    setTimeout(() => router.replace('/dashboard'), 2000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-pink/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="bg-brand-dark/80 backdrop-blur-xl rounded-3xl border border-brand-wine/40 p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <Logo className="h-12 w-auto" />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-xl font-black text-white mb-1">{t.login.newPasswordTitle}</h1>
            <p className="text-white/50 text-xs">{t.login.newPasswordSubtitle}</p>
          </div>

          {status === 'checking' && (
            <p className="text-white/50 text-sm text-center">{t.login.validatingLink}</p>
          )}

          {status === 'invalid' && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-center">
              <p className="text-white font-semibold text-sm">{t.login.resetLinkInvalid}</p>
              <button
                type="button"
                onClick={() => router.replace('/login')}
                className="mt-4 text-brand-pink text-sm font-semibold hover:underline"
              >
                {t.login.backToSignIn}
              </button>
            </div>
          )}

          {status === 'done' && (
            <div className="bg-brand-pink/10 border border-brand-pink/30 rounded-2xl p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-brand-pink/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-semibold text-sm">{t.login.passwordUpdated}</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <PasswordField
                label={t.login.newPasswordLabel}
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
              />
              <PasswordField
                label={t.login.confirmNewPasswordLabel}
                value={confirm}
                onChange={setConfirm}
                autoComplete="new-password"
              />
              {error && <p className="text-red-400 text-xs text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-pink text-white font-bold py-3 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 mt-1"
              >
                {loading ? '...' : t.login.savePassword}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}
