'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface EventFormData {
  title: string
  title_pt: string
  description: string
  description_pt: string
  date: string
  location: string
  location_pt: string
  google_maps_url: string
  google_maps_embed: string
  is_active: boolean
}

const empty: EventFormData = {
  title: '',
  title_pt: '',
  description: '',
  description_pt: '',
  date: '',
  location: '',
  location_pt: '',
  google_maps_url: '',
  google_maps_embed: '',
  is_active: true,
}

interface AdminEventFormProps {
  initial?: Partial<EventFormData>
  eventId?: string
}

export default function AdminEventForm({ initial, eventId }: AdminEventFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [form, setForm] = useState<EventFormData>({ ...empty, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const set = (field: keyof EventFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccessMsg('')

    const method = eventId ? 'PUT' : 'POST'
    const res = await fetch('/api/events', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, id: eventId }),
    })

    if (res.ok) {
      setSuccessMsg(eventId ? t.admin.eventUpdated : t.admin.eventCreated)
      if (!eventId) {
        setTimeout(() => router.push('/admin'), 1200)
      }
    } else {
      const data = await res.json()
      setError(data.error || t.common.error)
    }
    setSubmitting(false)
  }

  const inputClass =
    'w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors'
  const labelClass = 'text-white/60 text-xs font-medium uppercase tracking-wider block mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{t.admin.eventTitle}</label>
          <input type="text" value={form.title} onChange={set('title')} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t.admin.eventTitlePt}</label>
          <input type="text" value={form.title_pt} onChange={set('title_pt')} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.admin.eventDate}</label>
        <input
          type="datetime-local"
          value={form.date}
          onChange={set('date')}
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{t.admin.eventLocation}</label>
          <input type="text" value={form.location} onChange={set('location')} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>{t.admin.eventLocationPt}</label>
          <input type="text" value={form.location_pt} onChange={set('location_pt')} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className={labelClass}>{t.admin.eventDescription}</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={4}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>{t.admin.eventDescriptionPt}</label>
          <textarea
            value={form.description_pt}
            onChange={set('description_pt')}
            rows={4}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>{t.admin.mapsUrl}</label>
        <input
          type="url"
          value={form.google_maps_url}
          onChange={set('google_maps_url')}
          placeholder="https://maps.google.com/..."
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>
          {t.admin.mapsEmbed}
          <span className="ml-1 text-white/30 normal-case">({t.common.optional})</span>
        </label>
        <input
          type="text"
          value={form.google_maps_embed}
          onChange={set('google_maps_embed')}
          placeholder="https://www.google.com/maps/embed?pb=..."
          className={inputClass}
        />
        <p className="text-white/30 text-xs mt-1">
          From Google Maps → Share → Embed a map → copy the src URL.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
          className={`relative w-10 h-6 rounded-full transition-colors ${
            form.is_active ? 'bg-brand-pink' : 'bg-white/20'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              form.is_active ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
        <span className="text-white/60 text-sm">
          {form.is_active ? t.admin.active : t.admin.inactive}
        </span>
      </div>

      {error && (
        <p className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
          {error}
        </p>
      )}
      {successMsg && (
        <p className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-brand-pink text-white font-bold py-3 px-6 rounded-full hover:bg-brand-pink/90 transition-colors disabled:opacity-50"
        >
          {submitting ? t.common.loading : eventId ? t.admin.updateEvent : t.admin.createEvent}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin')}
          className="border border-white/20 text-white/60 font-semibold py-3 px-6 rounded-full hover:border-white/40 transition-colors"
        >
          {t.common.cancel}
        </button>
      </div>
    </form>
  )
}
