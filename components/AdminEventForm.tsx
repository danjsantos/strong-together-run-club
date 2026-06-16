'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'

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
  cover_photo_url: string
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
  cover_photo_url: '',
}

interface AdminEventFormProps {
  initial?: Partial<EventFormData>
  eventId?: string
}

/**
 * Convert any image file to a JPEG Blob using a canvas element.
 * Handles HEIC/HEIF from iPhones and enforces a max dimension.
 */
async function convertToJpeg(file: File, maxDimension = 2048, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new window.Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Failed to convert image')); return }
          const newName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          resolve(new File([blob], newName, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Cannot load image: ${file.name}`))
    }
    img.src = url
  })
}

export default function AdminEventForm({ initial, eventId }: AdminEventFormProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [form, setForm] = useState<EventFormData>({ ...empty, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Image upload state
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadPreview, setUploadPreview] = useState<string>(initial?.cover_photo_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (field: keyof EventFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  // Upload a banner image to the event-photos bucket and store the public URL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadError('')

    try {
      const supabase = createClient()

      // Convert to JPEG for consistent format
      let processedFile = file
      try {
        processedFile = await convertToJpeg(file)
      } catch {
        // Fall back to original file if conversion fails
      }

      // Use a dedicated "banners" folder inside the event-photos bucket
      const filename = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

      const { error: storageError } = await supabase.storage
        .from('event-photos')
        .upload(filename, processedFile, { contentType: 'image/jpeg', upsert: false })

      if (storageError) throw new Error(storageError.message)

      const { data: { publicUrl } } = supabase.storage
        .from('event-photos')
        .getPublicUrl(filename)

      setForm((prev) => ({ ...prev, cover_photo_url: publicUrl }))
      setUploadPreview(publicUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, cover_photo_url: '' }))
    setUploadPreview('')
    setUploadError('')
  }

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

      {/* ── Event Banner / Flyer Image ─────────────────────────────────── */}
      <div>
        <label className={labelClass}>
          {t.admin.eventBannerImage}
          <span className="ml-1 text-white/30 normal-case">({t.common.optional})</span>
        </label>

        {/* Preview */}
        {uploadPreview && (
          <div className="relative mb-3 inline-block">
            <Image
              src={uploadPreview}
              alt="Banner preview"
              width={200}
              height={280}
              className="rounded-xl object-contain border border-white/10"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white/70 text-sm hover:bg-white/10 hover:border-brand-pink/40 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t.common.loading}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploadPreview ? t.admin.changeBannerImage : t.admin.uploadBannerImage}
              </>
            )}
          </button>

          {/* Manual URL input as alternative */}
          {!uploadPreview && (
            <input
              type="url"
              value={form.cover_photo_url}
              onChange={set('cover_photo_url')}
              placeholder="or paste image URL…"
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-pink transition-colors"
            />
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {uploadError && (
          <p className="text-red-400 text-xs mt-1.5">{uploadError}</p>
        )}
        <p className="text-white/30 text-xs mt-1">
          Shown as the banner on the Next Run page. Falls back to the default banner if empty.
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
