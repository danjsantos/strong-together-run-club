'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface RSVPFormProps {
  eventId: string
  onRSVPChange?: (count: number) => void
}

export default function RSVPForm({ eventId, onRSVPChange }: RSVPFormProps) {
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [hasRSVP, setHasRSVP] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [rsvpCount, setRsvpCount] = useState(0)

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        setName(user.user_metadata?.full_name || user.email || '')
        const { data: existing } = await supabase
          .from('rsvps')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()
        setHasRSVP(!!existing)
      }

      const { count } = await supabase
        .from('rsvps')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', eventId)
      setRsvpCount(count || 0)
      onRSVPChange?.(count || 0)
      setLoading(false)
    }
    init()
  }, [eventId, onRSVPChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !name.trim()) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, name: name.trim() }),
    })

    if (res.ok) {
      setHasRSVP(true)
      setSuccess(true)
      const newCount = rsvpCount + 1
      setRsvpCount(newCount)
      onRSVPChange?.(newCount)
    } else {
      const data = await res.json()
      setError(data.error || t.rsvp.error)
    }
    setSubmitting(false)
  }

  const handleCancel = async () => {
    if (!user) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('rsvps').delete().eq('event_id', eventId).eq('user_id', user.id)
    setHasRSVP(false)
    setSuccess(false)
    const newCount = Math.max(0, rsvpCount - 1)
    setRsvpCount(newCount)
    onRSVPChange?.(newCount)
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40 animate-pulse">
        <div className="h-4 bg-white/10 rounded w-40 mb-4" />
        <div className="h-10 bg-white/10 rounded mb-3" />
        <div className="h-12 bg-white/10 rounded" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40 text-center">
        <p className="text-white/60 text-sm mb-4">{t.nextRun.loginToRsvp}</p>
        <a
          href="/login"
          className="inline-block bg-brand-pink text-white font-bold px-6 py-3 rounded-full hover:bg-brand-pink/90 transition-colors"
        >
          {t.nav.login}
        </a>
      </div>
    )
  }

  if (hasRSVP) {
    return (
      <div className="bg-gradient-card rounded-2xl p-6 border border-brand-pink/30 text-center">
        <div className="w-12 h-12 bg-brand-pink/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-brand-pink font-bold text-lg mb-1">
          {success ? t.rsvp.success : t.rsvp.alreadyRsvped}
        </p>
        <p className="text-white/40 text-sm mb-4">
          {rsvpCount} {rsvpCount === 1 ? 'person' : 'people'} {t.nextRun.attendees}
        </p>
        <button
          onClick={handleCancel}
          disabled={submitting}
          className="text-white/40 text-xs hover:text-white/70 transition-colors underline"
        >
          {t.rsvp.cancelRsvp}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40">
      <h3 className="text-white font-bold text-lg mb-4">{t.rsvp.title}</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="text-white/60 text-xs font-medium uppercase tracking-wider block mb-1.5">
            {t.rsvp.name}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.rsvp.namePlaceholder}
            required
            className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
          />
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="bg-brand-pink text-white font-bold py-3 px-6 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? t.common.loading : t.rsvp.confirm}
        </button>
      </form>
    </div>
  )
}
