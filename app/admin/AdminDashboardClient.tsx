'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatDate } from '@/lib/utils'
import QRGenerator from '@/components/QRGenerator'

// Convert UTC ISO string from DB → local datetime-local input value (America/New_York)
function utcToEasternInput(utcStr: string): string {
  if (!utcStr) return ''
  const date = new Date(utcStr)
  // Format as YYYY-MM-DDTHH:mm in Eastern time
  const eastern = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const p = Object.fromEntries(eastern.map(x => [x.type, x.value]))
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`
}

// Convert datetime-local input value (America/New_York) → UTC ISO string for DB
function easternInputToUtc(localStr: string): string {
  if (!localStr) return ''
  // localStr is like "2026-06-14T07:00" — treat as Eastern time
  const [datePart, timePart] = localStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  // Use a trick: create date in UTC then adjust for Eastern offset
  // Easier: just pass to Date with timezone offset string
  // Eastern is UTC-4 (EDT) or UTC-5 (EST); use Intl to get current offset
  const tempDate = new Date(`${datePart}T${timePart}:00`)
  // Get Eastern offset in minutes
  const easternFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  })
  const parts = easternFormatter.formatToParts(tempDate)
  const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-4'
  const match = offsetStr.match(/GMT([+-]\d+)/)
  const offsetHours = match ? parseInt(match[1]) : -4
  const utcDate = new Date(tempDate.getTime() - offsetHours * 60 * 60 * 1000)
  return utcDate.toISOString()
}

interface Event {
  id: string
  title: string
  title_pt: string | null
  title_es?: string | null
  date: string
  location: string
  location_pt?: string | null
  location_es?: string | null
  description?: string | null
  description_pt?: string | null
  description_es?: string | null
  google_maps_url?: string | null
  google_maps_embed?: string | null
  is_active: boolean
}

interface RsvpItem {
  name: string
  email: string
  created_at: string
}

interface CheckinItem {
  profile_id: string
  checked_in_at: string
  profiles: { name: string | null; display_name: string | null } | null
}

interface Props {
  events: Event[]
  memberCount: number
  totalRsvps: number
  rsvpCounts: Record<string, number>
  checkinCounts: Record<string, number>
}

export default function AdminDashboardClient({ events: initialEvents, memberCount, totalRsvps, rsvpCounts: initialRsvpCounts, checkinCounts: initialCheckinCounts }: Props) {
  const { t, language } = useLanguage()

  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [rsvpCounts, setRsvpCounts] = useState(initialRsvpCounts)
  const [checkinCounts, setCheckinCounts] = useState(initialCheckinCounts)

  const [expandedEvent, setExpandedEvent] = useState<string | null>(null)
  const [rsvpList, setRsvpList] = useState<Record<string, RsvpItem[]>>({})
  const [checkinList, setCheckinList] = useState<Record<string, CheckinItem[]>>({})
  const [loadingRsvps, setLoadingRsvps] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deletingCheckin, setDeletingCheckin] = useState<string | null>(null)
  const [deletingRsvp, setDeletingRsvp] = useState<string | null>(null)

  // Inline edit state
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Event>>({})
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [editSuccess, setEditSuccess] = useState('')

  const upcomingRuns = events.filter(e => new Date(e.date) > new Date()).length

  const loadRsvps = async (eventId: string) => {
    if (expandedEvent === eventId) {
      setExpandedEvent(null)
      return
    }
    setExpandedEvent(eventId)
    setLoadingRsvps(true)

    const [rsvpRes, checkinRes] = await Promise.all([
      fetch(`/api/rsvp?eventId=${eventId}`),
      fetch(`/api/checkin?eventId=${eventId}`),
    ])

    const rsvpData = await rsvpRes.json()
    const newRsvps = rsvpData.rsvps || []
    setRsvpList(prev => ({ ...prev, [eventId]: newRsvps }))

    if (checkinRes.ok) {
      const checkinData = await checkinRes.json()
      const newCheckins = checkinData.checkins || []
      setCheckinList(prev => ({ ...prev, [eventId]: newCheckins }))
    }

    setLoadingRsvps(false)
  }

  const handleDeleteEvent = async (eventId: string, title: string) => {
    if (!confirm(`${t.admin.confirmDelete}\n\n"${title}"`)) return
    setDeleting(eventId)
    const res = await fetch('/api/events', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: eventId }),
    })
    if (res.ok) {
      setEvents(prev => prev.filter(e => e.id !== eventId))
    }
    setDeleting(null)
  }

  const handleDeleteCheckin = async (eventId: string, profileId: string) => {
    if (!confirm('Remove this check-in?')) return
    const key = `${eventId}-${profileId}`
    setDeletingCheckin(key)
    const res = await fetch('/api/admin/checkin', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId, eventId }),
    })
    if (res.ok) {
      setCheckinList(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter(c => c.profile_id !== profileId),
      }))
      setCheckinCounts(prev => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] || 1) - 1) }))
    }
    setDeletingCheckin(null)
  }

  const handleDeleteRsvp = async (eventId: string, email: string) => {
    if (!confirm('Remove this RSVP?')) return
    setDeletingRsvp(email)
    const res = await fetch('/api/admin/rsvp', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, eventId }),
    })
    if (res.ok) {
      setRsvpList(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter(r => r.email !== email),
      }))
      setRsvpCounts(prev => ({ ...prev, [eventId]: Math.max(0, (prev[eventId] || 1) - 1) }))
    }
    setDeletingRsvp(null)
  }

  const startEdit = (event: Event) => {
    setEditingEventId(event.id)
    setEditForm({ ...event })
    setEditError('')
    setEditSuccess('')
    // Close the RSVP accordion if open
    if (expandedEvent === event.id) setExpandedEvent(null)
  }

  const cancelEdit = () => {
    setEditingEventId(null)
    setEditForm({})
    setEditError('')
    setEditSuccess('')
  }

  const saveEdit = async () => {
    if (!editingEventId) return
    setSavingEdit(true)
    setEditError('')
    setEditSuccess('')

    const res = await fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...editForm, id: editingEventId }),
    })

    if (res.ok) {
      const data = await res.json()
      setEvents(prev => prev.map(e => e.id === editingEventId ? { ...e, ...data.event } : e))
      setEditSuccess('Event updated!')
      setTimeout(() => {
        setEditingEventId(null)
        setEditForm({})
        setEditSuccess('')
      }, 1500)
    } else {
      const data = await res.json()
      setEditError(data.error || 'Failed to update event')
    }
    setSavingEdit(false)
  }

  const inputClass = 'w-full bg-white/5 border border-white/20 rounded-xl px-3 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors'
  const labelClass = 'text-white/50 text-xs font-medium uppercase tracking-wider block mb-1'

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
            const isEditing = editingEventId === event.id
            const rsvpCount = rsvpCounts[event.id] || 0
            const checkinCount = checkinCounts[event.id] || 0
            const isPast = new Date(event.date) < new Date()
            const currentRsvps = rsvpList[event.id] || []
            const currentCheckins = checkinList[event.id] || []

            return (
              <div
                key={event.id}
                className="bg-gradient-card rounded-2xl border border-brand-wine/40 overflow-hidden"
              >
                {/* ── Inline Edit Form ── */}
                {isEditing ? (
                  <div className="p-4 sm:p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-bold text-sm">Edit Event</h3>
                      <button onClick={cancelEdit} className="text-white/40 hover:text-white transition-colors text-xs">
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>{t.admin.eventTitle}</label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t.admin.eventTitlePt}</label>
                        <input
                          type="text"
                          value={editForm.title_pt || ''}
                          onChange={e => setEditForm(p => ({ ...p, title_pt: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>{t.admin.eventDate}</label>
                      <input
                        type="datetime-local"
                        value={editForm.date ? utcToEasternInput(editForm.date) : ''}
                        onChange={e => setEditForm(p => ({ ...p, date: easternInputToUtc(e.target.value) }))}
                        className={inputClass}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>{t.admin.eventLocation}</label>
                        <input
                          type="text"
                          value={editForm.location || ''}
                          onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>{t.admin.eventLocationPt}</label>
                        <input
                          type="text"
                          value={editForm.location_pt || ''}
                          onChange={e => setEditForm(p => ({ ...p, location_pt: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelClass}>{t.admin.mapsUrl}</label>
                      <input
                        type="url"
                        value={editForm.google_maps_url || ''}
                        onChange={e => setEditForm(p => ({ ...p, google_maps_url: e.target.value }))}
                        placeholder="https://maps.google.com/..."
                        className={inputClass}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditForm(p => ({ ...p, is_active: !p.is_active }))}
                        className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${editForm.is_active ? 'bg-brand-pink' : 'bg-white/20'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${editForm.is_active ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                      <span className="text-white/60 text-sm">{editForm.is_active ? t.admin.active : t.admin.inactive}</span>
                    </div>

                    {editError && (
                      <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl px-3 py-2">{editError}</p>
                    )}
                    {editSuccess && (
                      <p className="bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-xl px-3 py-2">{editSuccess}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="flex-1 bg-brand-pink text-white font-bold py-3 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50 text-sm"
                      >
                        {savingEdit ? 'Saving...' : t.admin.updateEvent}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="border border-white/20 text-white/60 font-semibold py-3 px-5 rounded-full hover:border-white/40 transition-colors text-sm"
                      >
                        {t.common.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Normal Card View ── */
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

                    {/* RSVP + Check-in badges */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-white/5 rounded-full px-3 py-1">
                        <span className="text-brand-pink text-xs font-bold">{rsvpCount}</span>
                        <span className="text-white/40 text-xs">{t.admin.rsvps}</span>
                      </div>
                      <div className="flex items-center gap-1 bg-green-500/10 rounded-full px-3 py-1 border border-green-500/20">
                        <span className="text-green-400 text-xs font-bold">{checkinCount}</span>
                        <span className="text-white/40 text-xs">{t.admin.checkedIn}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {!isPast && event.is_active && (
                        <QRGenerator eventId={event.id} eventTitle={title} />
                      )}
                      <button
                        onClick={() => loadRsvps(event.id)}
                        className="text-white/50 hover:text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      >
                        {isExpanded ? '↑ Hide' : t.admin.viewRsvps}
                      </button>
                      {/* Edit button */}
                      <button
                        onClick={() => startEdit(event)}
                        className="text-blue-400/60 hover:text-blue-400 p-1.5 rounded-lg hover:bg-blue-400/5 transition-colors"
                        title={t.common.edit}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {/* Delete event button */}
                      <button
                        onClick={() => handleDeleteEvent(event.id, title)}
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
                )}

                {/* ── RSVP + Check-in Accordion ── */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-white/10 px-5 py-4">
                    {loadingRsvps ? (
                      <p className="text-white/30 text-xs">{t.common.loading}</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* RSVP List */}
                        <div>
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                            {t.admin.rsvps} ({currentRsvps.length})
                          </p>
                          {currentRsvps.length === 0 ? (
                            <p className="text-white/30 text-xs">{t.admin.noRsvps}</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {currentRsvps.map((r, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2">
                                  <div className="w-7 h-7 rounded-full bg-brand-pink/20 flex items-center justify-center text-brand-pink text-xs font-bold flex-shrink-0">
                                    {r.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium truncate">{r.name}</p>
                                    <p className="text-white/40 text-xs truncate">{r.email}</p>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteRsvp(event.id, r.email)}
                                    disabled={deletingRsvp === r.email}
                                    className="text-red-400/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/5 transition-colors flex-shrink-0"
                                    title="Remove RSVP"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Check-in List */}
                        <div>
                          <p className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-2">
                            {t.admin.checkedIn} ({currentCheckins.length})
                          </p>
                          {currentCheckins.length === 0 ? (
                            <p className="text-white/30 text-xs">No check-ins yet.</p>
                          ) : (
                            <div className="flex flex-col gap-2">
                              {currentCheckins.map((c, i) => {
                                const name = c.profiles?.display_name || c.profiles?.name || 'Runner'
                                const key = `${event.id}-${c.profile_id}`
                                return (
                                  <div key={i} className="flex items-center gap-3 bg-green-500/5 rounded-xl px-3 py-2 border border-green-500/10">
                                    <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 text-xs font-bold flex-shrink-0">
                                      {name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-xs font-medium truncate">{name}</p>
                                    </div>
                                    <span className="text-green-400 text-xs flex-shrink-0">✓</span>
                                    <button
                                      onClick={() => handleDeleteCheckin(event.id, c.profile_id)}
                                      disabled={deletingCheckin === key}
                                      className="text-red-400/40 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-400/5 transition-colors flex-shrink-0"
                                      title="Remove check-in"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                      </svg>
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>

                        {/* Summary bar */}
                        {currentRsvps.length > 0 && (
                          <div className="bg-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                            <span className="text-white/40 text-xs">Attendance rate</span>
                            <span className="text-white font-bold text-sm">
                              {currentCheckins.length}/{currentRsvps.length}
                              <span className="text-white/40 font-normal ml-1 text-xs">
                                ({currentRsvps.length > 0 ? Math.round((currentCheckins.length / currentRsvps.length) * 100) : 0}%)
                              </span>
                            </span>
                          </div>
                        )}
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
