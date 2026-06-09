'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { createClient } from '@/lib/supabase/client'
import { formatShortDate } from '@/lib/utils'

interface Photo {
  id: string
  event_id: string
  photo_url: string
  caption: string | null
  uploaded_at: string
  sort_order: number
}

interface GalleryEvent {
  id: string
  title: string
  title_pt: string | null
  date: string
  location: string
  location_pt: string | null
  cover_photo_url: string | null
  photo_count: number
}

// Form state uses the same column names as the DB
interface NewEventForm {
  title: string
  date: string
  location: string
}

/**
 * Convert any image file to a JPEG Blob using a canvas element.
 * This handles HEIC/HEIF from iPhones, which Supabase storage may reject
 * depending on bucket configuration. Also enforces a max dimension and
 * quality to keep file sizes under the 10 MB bucket limit.
 */
async function convertToJpeg(file: File, maxDimension = 2048, quality = 0.85): Promise<File> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
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
          // Preserve original name but with .jpg extension
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

export default function AdminGalleryClient() {
  const { t, language } = useLanguage()
  const [events, setEvents] = useState<GalleryEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<GalleryEvent | null>(null)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null)
  const [creating, setCreating] = useState(false)
  const [showNewEventForm, setShowNewEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState<NewEventForm>({ title: '', date: '', location: '' })
  const [createError, setCreateError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [savingOrder, setSavingOrder] = useState(false)
  const [orderSaved, setOrderSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Drag-and-drop state
  const dragIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const loadEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/gallery/events')
      if (!res.ok) throw new Error('Failed to load events')
      const { events: data } = await res.json() as { events: GalleryEvent[] }
      setEvents(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const loadPhotos = async (eventId: string) => {
    try {
      const res = await fetch(`/api/gallery/photos?eventId=${eventId}`)
      if (!res.ok) return
      const { photos: data } = await res.json() as { photos: Photo[] }
      setPhotos(data)
    } catch {
      // ignore
    }
  }

  // Ensure the storage bucket exists when the admin panel loads
  useEffect(() => {
    fetch('/api/gallery/setup', { method: 'POST' }).catch(() => null)
    loadEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadPhotos(selectedEvent.id)
    } else {
      setPhotos([])
    }
  }, [selectedEvent])

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      const res = await fetch('/api/gallery/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvent.title.trim(),
          date: newEvent.date,
          location: newEvent.location.trim(),
        }),
      })
      if (!res.ok) {
        const { error } = await res.json() as { error: string }
        throw new Error(error)
      }
      const { event: created } = await res.json() as { event: GalleryEvent }
      setEvents(prev => [created, ...prev])
      setNewEvent({ title: '', date: '', location: '' })
      setShowNewEventForm(false)
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create event')
      await loadEvents()
    } finally {
      setCreating(false)
    }
  }

  const handleUploadPhotos = async (files: FileList) => {
    if (!selectedEvent || files.length === 0) return
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(false)
    setUploadProgress({ current: 0, total: files.length })

    const supabase = createClient()
    const fileArray = Array.from(files)

    try {
      for (let i = 0; i < fileArray.length; i++) {
        let file = fileArray[i]
        setUploadProgress({ current: i + 1, total: fileArray.length })

        // Convert HEIC/HEIF and any other format to JPEG for maximum
        // compatibility with the Supabase bucket MIME restrictions and
        // to ensure consistent behaviour across iOS/Android/desktop.
        try {
          file = await convertToJpeg(file)
        } catch {
          // If conversion fails (e.g. unsupported format), try the original
          // file and let Supabase reject it with a clear error message.
        }

        const ext = 'jpg'
        const filename = `${selectedEvent.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const { error: storageError } = await supabase.storage
          .from('event-photos')
          .upload(filename, file, { contentType: 'image/jpeg', upsert: false })

        if (storageError) throw new Error(storageError.message)

        const { data: { publicUrl } } = supabase.storage
          .from('event-photos')
          .getPublicUrl(filename)

        const res = await fetch('/api/gallery/photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: selectedEvent.id, photo_url: publicUrl }),
        })
        if (!res.ok) {
          const { error } = await res.json() as { error: string }
          throw new Error(error)
        }
      }

      setUploadSuccess(true)
      setTimeout(() => setUploadSuccess(false), 3000)
      await loadPhotos(selectedEvent.id)
      await loadEvents()
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm(t.gallery.confirmDeletePhoto)) return
    try {
      const res = await fetch('/api/gallery/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: photo.id, photo_url: photo.photo_url }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setPhotos(prev => prev.filter(p => p.id !== photo.id))
      setEvents(prev =>
        prev.map(ev =>
          ev.id === selectedEvent?.id
            ? { ...ev, photo_count: Math.max(0, ev.photo_count - 1) }
            : ev
        )
      )
    } catch {
      // ignore
    }
  }

  const handleSetCover = async (photoUrl: string) => {
    if (!selectedEvent) return
    try {
      const res = await fetch('/api/gallery/cover', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: selectedEvent.id, cover_photo_url: photoUrl }),
      })
      if (!res.ok) throw new Error('Failed to set cover')
      setSelectedEvent(prev => prev ? { ...prev, cover_photo_url: photoUrl } : prev)
      setEvents(prev =>
        prev.map(e => e.id === selectedEvent.id ? { ...e, cover_photo_url: photoUrl } : e)
      )
    } catch {
      // ignore
    }
  }

  const handleDeleteEvent = async (event: GalleryEvent) => {
    if (!confirm(t.gallery.confirmDeleteEvent)) return
    try {
      const res = await fetch('/api/gallery/events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      if (selectedEvent?.id === event.id) setSelectedEvent(null)
      setEvents(prev => prev.filter(e => e.id !== event.id))
    } catch {
      // ignore
    }
  }

  // ── Drag-and-drop handlers ──────────────────────────────────────────────────

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null)
    dragIndexRef.current = null
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = dragIndexRef.current
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragOverIndex(null)
      dragIndexRef.current = null
      return
    }

    setPhotos(prev => {
      const next = [...prev]
      const [moved] = next.splice(dragIndex, 1)
      next.splice(dropIndex, 0, moved)
      return next
    })

    setDragOverIndex(null)
    dragIndexRef.current = null
  }, [])

  const handleSaveOrder = async () => {
    if (!selectedEvent || photos.length === 0) return
    setSavingOrder(true)
    setOrderSaved(false)
    try {
      const res = await fetch('/api/gallery/photos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: photos.map(p => p.id) }),
      })
      if (!res.ok) throw new Error('Failed to save order')
      setOrderSaved(true)
      setTimeout(() => setOrderSaved(false), 3000)
    } catch {
      // ignore
    } finally {
      setSavingOrder(false)
    }
  }

  // ───────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">{t.gallery.adminTitle}</h1>
          <p className="text-white/50 text-sm mt-1">{t.gallery.adminSubtitle}</p>
        </div>
        <button
          onClick={() => setShowNewEventForm(!showNewEventForm)}
          className="bg-brand-pink text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-brand-pink/90 transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t.gallery.newEvent}
        </button>
      </div>

      {/* New event form */}
      {showNewEventForm && (
        <div className="bg-gradient-card rounded-2xl border border-brand-wine/30 p-6">
          <h2 className="text-white font-bold text-lg mb-4">{t.gallery.newEvent}</h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                {t.gallery.eventName} *
              </label>
              <input
                type="text"
                value={newEvent.title}
                onChange={e => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Saturday Morning 5K"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-pink/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                {t.gallery.eventDate} *
              </label>
              <input
                type="date"
                value={newEvent.date}
                onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-pink/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-1.5">
                {t.gallery.eventLocation} *
              </label>
              <input
                type="text"
                value={newEvent.location}
                onChange={e => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Myrtle Beach Boardwalk"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-brand-pink/50 transition-colors"
              />
            </div>
            {createError && (
              <p className="text-red-400 text-sm">{createError}</p>
            )}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="bg-brand-pink text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-brand-pink/90 disabled:opacity-50 transition-colors"
              >
                {creating ? t.common.loading : t.gallery.createEvent}
              </button>
              <button
                type="button"
                onClick={() => { setShowNewEventForm(false); setCreateError(null) }}
                className="bg-white/10 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events list */}
        <div className="lg:col-span-1">
          <h2 className="text-white/70 text-xs font-bold uppercase tracking-widest mb-3">
            {t.gallery.events}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <p className="text-white/30 text-sm">{t.gallery.noEvents}</p>
          ) : (
            <div className="space-y-2">
              {events.map(event => {
                const displayTitle =
                  language === 'pt' && event.title_pt ? event.title_pt : event.title
                const isSelected = selectedEvent?.id === event.id
                return (
                  <div
                    key={event.id}
                    className={`rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-pink bg-brand-pink/10'
                        : 'border-brand-wine/30 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="p-3 flex items-center gap-3"
                      onClick={() => setSelectedEvent(isSelected ? null : event)}
                    >
                      {/* Thumbnail */}
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-brand-wine/30">
                        {event.cover_photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={event.cover_photo_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-5 h-5 text-white/20"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{displayTitle}</p>
                        <p className="text-white/40 text-xs">
                          {formatShortDate(event.date, language)} · {event.photo_count}{' '}
                          {t.gallery.photos}
                        </p>
                      </div>
                    </div>
                    {/* Delete event button */}
                    <div className="px-3 pb-2 flex justify-end">
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteEvent(event)
                        }}
                        className="text-red-400/60 hover:text-red-400 text-xs transition-colors"
                      >
                        {t.common.delete}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Photo management panel */}
        <div className="lg:col-span-2">
          {!selectedEvent ? (
            <div className="h-full min-h-[300px] flex items-center justify-center rounded-2xl border border-brand-wine/20 bg-white/[0.03]">
              <p className="text-white/30 text-sm">{t.gallery.selectEvent}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-white font-bold text-lg">
                  {language === 'pt' && selectedEvent.title_pt
                    ? selectedEvent.title_pt
                    : selectedEvent.title}
                </h2>
                {/* Upload button — uses label wrapping hidden input for reliable mobile tap */}
                <label
                  className={`bg-brand-pink text-white font-semibold px-5 py-3 rounded-xl cursor-pointer hover:bg-brand-pink/90 transition-colors flex items-center gap-2 self-start sm:self-auto text-base active:scale-95 ${
                    uploading ? 'opacity-50 pointer-events-none' : ''
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  {uploading
                    ? uploadProgress
                      ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
                      : t.common.loading
                    : t.gallery.uploadPhotos}
                  {/* accept="image/*" covers HEIC/HEIF on iOS natively.
                      capture is intentionally omitted so the user can choose
                      between camera and photo library on mobile. */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => e.target.files && handleUploadPhotos(e.target.files)}
                  />
                </label>
              </div>

              {uploadError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {uploadError}
                </div>
              )}
              {uploadSuccess && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                  {t.gallery.uploadSuccess}
                </div>
              )}
              {orderSaved && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-400 text-sm">
                  Photo order saved successfully.
                </div>
              )}

              {/* Upload progress bar */}
              {uploading && uploadProgress && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-white/50">
                    <span>Processing photos…</span>
                    <span>{uploadProgress.current}/{uploadProgress.total}</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div
                      className="bg-brand-pink h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Tap-to-upload zone (also works as drag-and-drop on desktop) */}
              <div
                className="border-2 border-dashed border-brand-wine/40 rounded-xl p-8 text-center cursor-pointer hover:border-brand-pink/40 active:border-brand-pink transition-colors"
                onClick={() => !uploading && fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  if (e.dataTransfer.files.length > 0) handleUploadPhotos(e.dataTransfer.files)
                }}
              >
                <svg
                  className="w-10 h-10 text-white/20 mx-auto mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="text-white/50 text-sm font-medium">Tap to select photos</p>
                <p className="text-white/30 text-xs mt-1">or drag & drop · all formats supported</p>
              </div>

              {/* Photos grid with drag-to-reorder */}
              {photos.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-white/40 text-xs">
                      Drag photos to reorder, then save.
                    </p>
                    <button
                      onClick={handleSaveOrder}
                      disabled={savingOrder}
                      className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingOrder ? (
                        <>
                          <div className="w-3 h-3 border border-white/50 border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Order
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={e => handleDragOver(e, index)}
                        onDrop={e => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={`relative group aspect-square rounded-lg overflow-hidden bg-brand-wine/20 cursor-grab active:cursor-grabbing transition-all duration-150 ${
                          dragOverIndex === index ? 'ring-2 ring-brand-pink scale-105' : ''
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.photo_url}
                          alt={photo.caption || ''}
                          className="w-full h-full object-cover pointer-events-none"
                          loading="lazy"
                          draggable={false}
                        />
                        {/* Drag handle indicator */}
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 rounded p-0.5">
                            <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm8-16a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4zm0 8a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </div>
                        </div>
                        {/* Cover indicator */}
                        {selectedEvent.cover_photo_url === photo.photo_url && (
                          <div className="absolute top-1 left-1 bg-brand-pink text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            Cover
                          </div>
                        )}
                        {/* Action overlay — always visible on mobile (no hover) */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 sm:opacity-0 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                          <button
                            onClick={() => handleSetCover(photo.photo_url)}
                            className="text-white/80 hover:text-white text-[11px] font-medium bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition-colors w-full text-center"
                          >
                            {t.gallery.setCover}
                          </button>
                          <button
                            onClick={() => handleDeletePhoto(photo)}
                            className="text-red-400 hover:text-red-300 text-[11px] font-medium bg-red-500/10 hover:bg-red-500/20 rounded px-2 py-1 transition-colors w-full text-center"
                          >
                            {t.common.delete}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-white/30 text-sm text-center py-8">{t.gallery.noPhotosYet}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
