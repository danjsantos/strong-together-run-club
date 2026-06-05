'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface CheckInButtonProps {
  eventId: string
  eventDate: string
}

export default function CheckInButton({ eventId, eventDate }: CheckInButtonProps) {
  const { t } = useLanguage()
  const [user, setUser] = useState<User | null>(null)
  const [hasRSVP, setHasRSVP] = useState(false)
  const [checkedIn, setCheckedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Determine if today is the event day
  const isEventDay = (() => {
    const eventDateObj = new Date(eventDate)
    const today = new Date()
    return (
      eventDateObj.getFullYear() === today.getFullYear() &&
      eventDateObj.getMonth() === today.getMonth() &&
      eventDateObj.getDate() === today.getDate()
    )
  })()

  useEffect(() => {
    const supabase = createClient()
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Check RSVP
        const { data: rsvp } = await supabase
          .from('rsvps')
          .select('id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .single()
        setHasRSVP(!!rsvp)

        // Check existing check-in
        const { data: checkin } = await supabase
          .from('checkins')
          .select('id')
          .eq('event_id', eventId)
          .eq('profile_id', user.id)
          .single()
        setCheckedIn(!!checkin)
      }

      setLoading(false)
    }
    init()
  }, [eventId])

  // Only show on event day for RSVPed users
  if (!isEventDay || !user || loading || !hasRSVP) return null

  const handleCheckIn = async () => {
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId }),
    })

    if (res.ok) {
      setCheckedIn(true)
      setSuccess(true)
    } else {
      const data = await res.json()
      if (data.error === 'Already checked in') {
        setCheckedIn(true)
      } else {
        setError(data.error || t.common.error)
      }
    }
    setSubmitting(false)
  }

  if (checkedIn) {
    return (
      <div className="bg-gradient-card rounded-2xl p-5 border border-brand-pink/30 text-center">
        <div className="w-12 h-12 bg-brand-pink/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-brand-pink font-bold text-base">
          {success ? t.nextRun.checkInSuccess : t.nextRun.alreadyCheckedIn}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-gradient-card rounded-2xl p-5 border border-brand-wine/40">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">
          Today&apos;s Run
        </p>
      </div>
      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
      <button
        onClick={handleCheckIn}
        disabled={submitting}
        className="w-full bg-brand-pink text-white font-black py-3 px-6 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
      >
        {submitting ? t.common.loading : t.nextRun.checkIn}
      </button>
    </div>
  )
}
