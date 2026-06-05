'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import EventGalleryCard from './EventGalleryCard'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
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

interface EventWithPhotos extends GalleryEvent {
  photos: Photo[]
}

export default function GalleryPageClient() {
  const { t } = useLanguage()
  const [events, setEvents] = useState<GalleryEvent[]>([])
  const [eventPhotos, setEventPhotos] = useState<Record<string, Photo[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadGallery() {
      try {
        setLoading(true)
        const res = await fetch('/api/gallery/events')
        if (!res.ok) throw new Error('Failed to load events')
        const { events: eventsData } = await res.json() as { events: GalleryEvent[] }

        // Only show events that have photos
        const eventsWithPhotos = eventsData.filter(e => e.photo_count > 0)
        setEvents(eventsWithPhotos)

        // Load photos for each event in parallel
        const photoResults = await Promise.all(
          eventsWithPhotos.map(async (event) => {
            const r = await fetch(`/api/gallery/photos?eventId=${event.id}`)
            if (!r.ok) return { id: event.id, photos: [] }
            const { photos } = await r.json() as { photos: Photo[] }
            return { id: event.id, photos }
          })
        )

        const photosMap: Record<string, Photo[]> = {}
        photoResults.forEach(({ id, photos }) => {
          photosMap[id] = photos
        })
        setEventPhotos(photosMap)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadGallery()
  }, [])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
          <p className="text-white/50 text-sm">{t.common.loading}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-white/50 text-sm">{t.common.error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-20 h-20 rounded-full bg-brand-wine/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-white/40 text-center">{t.gallery.noPhotos}</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {events.map((event) => (
        <EventGalleryCard
          key={event.id}
          event={event}
          photos={eventPhotos[event.id] || []}
        />
      ))}
    </div>
  )
}
