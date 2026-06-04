'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatDate } from '@/lib/utils'

interface Event {
  id: string
  title: string
  title_pt: string | null
  date: string
  location: string
  is_active: boolean
}

interface Props {
  events: Event[]
  memberCount: number
  totalRsvps: number
  rsvpCounts: Record<string, number>
}

export default function AdminDashboardClient({ events, memberCount, totalRsvps, rsvpCounts }: Props) {
  const { t, language } = useLanguage()
  const router = useRouter()
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [rsvpList, setRsvpList] = useState<{ name: string; email: string; created_at: string }[]>([])
  const [loadingRsvps, setLoadingRsvps] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const upcomingRuns = events.filter(e => new Date(e.date) > new Date()).length

  const loadRsvps = async (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null)
      return
    }
    setExpandedEvent(eventId)
    setLoadingRsvps(true)
    const res = await fetch(`/api/rsvp?eventId=${eventId}`)
    const data = await res.json()
    setRsvpList(data.rsvps || [])
    setLoadingRsvps(false)
  }

  const handleDelete = async (eventId: string, title: string) => {
    if (!confirm(`${t.admin.confirmDelete}\n\n"${title}"`)) return
    setDeleting(eventId)
    const res = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    })
    if (res.ok) router.refresh()
    setDeleting(null)
  }

  const stats = [
    { value: memberCount, label: t.admin.totalMembers, icon: '👟' },
    { value: upcomingRuns, label: t.admin.upcomingRuns, icon: '📅' },
    { value: totalRsvps, label: t.admin.totalRsvps, icon: '✅' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-gradient-card rounded-2xl p-4 border border-brand-wine/40 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-3xl font-black text-brand-pink">{stat.value}</div>
            <div className="text-white/40 text-xs mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Events list header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-lg">{t.admin.events}</h2>
        <Link
          href="/admin/events/new"
          className="bg-brand-pink text-white font-semibold text-sm px-4 py-2 rounded-full hover:bg-brand-pink/90 transition-colors flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.admin.newEvent}
        </Link>
      </div>

      {/* Events */}
      {events.length === 0 ? (
        <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-8 text-center text-white/40 text-sm">
          {t.admin.noEvents}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event) => {
            const title = language === 'pt' && event.title_pt ? event.title_pt : event.title
            const isExpanded = expandedEvent === event.id
            const count = rsvpCounts[event.id] || 0
            const isPast = new Date(event.date) < new Date()

            return (
              <div
                key={event.id}
                className="bg-gradient-card rounded-2xl border border-brand-wine/40 overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Status dot */}
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-1 sm:mt-0 ${
                    !event.is_active ? 'bg-white/20' : isPast ? 'bg-yellow-500' : 'bg-green-500'
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{title}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {formatDate(event.date, language)} · {event.location}
                    </p>
                  </div>

                  {/* RSVP badge */}
                  <div className="flex items-center gap-1 bg-white/5 rounded-full px-3 py-1">
                    <span className="text-brand-pink text-xs font-bold">{count}</span>
                    <span className="text-white/40 text-xs">{t.admin.rsvps}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadRsvps(event.id)}
                      className="text-white/50 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      {isExpanded ? '↑ Hide' : t.admin.viewRsvps}
                    </button>
                    <button
                      onClick={() => handleDelete(event.id, title)}
                      disabled={deleting === event.id}
                      className="text-red-400/50 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/5 transition-colors"
                      title={t.admin.deleteEvent}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* RSVP accordion */}
                {isExpanded && (
                  <div className="border-t border-white/10 px-5 py-4">
                    {loadingRsvps ? (
                      <p className="text-white/30 text-xs">{t.common.loading}</p>
                    ) : rsvpList.length === 0 ? (
                      <p className="text-white/30 text-xs">{t.admin.noRsvps}</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <p className="text-white/40 text-xs mb-2">
                          {rsvpList.length} {t.admin.rsvps}
                        </p>
                        {rsvpList.map((r, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                            <div className="w-7 h-7 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-xs font-bold">
                              {r.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-xs font-medium">{r.name}</p>
                              <p className="text-white/40 text-xs">{r.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
