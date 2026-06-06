'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
        {/* Glowing pink orb background */}
        <div className="relative flex flex-col items-center gap-6 w-full max-w-sm">
          <div className="absolute inset-0 rounded-3xl bg-brand-pink/5 blur-3xl" aria-hidden="true" />

          {/* Icon container */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-brand-pink/20 to-brand-wine/30 border border-brand-pink/30 flex items-center justify-center shadow-lg shadow-brand-pink/10">
            {/* Camera icon */}
            <svg className="w-11 h-11 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {/* Decorative ping dot */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand-pink animate-pulse-slow" />
          </div>

          {/* Text */}
          <div className="relative text-center space-y-3">
            <h3 className="text-xl font-bold text-white">
              No photos yet
            </h3>
            <p className="text-white/60 text-sm leading-relaxed">
              Be part of our next run and help us fill this gallery with amazing memories!
            </p>
          </div>

          {/* Pink divider */}
          <div className="relative w-16 h-0.5 bg-gradient-pink rounded-full" />

          {/* Motivational message */}
          <p className="relative text-brand-pink font-semibold text-base text-center">
            No photos yet — be part of our next run!
          </p>

          {/* CTA button */}
          <Link
            href="/next-run"
            className="relative bg-brand-pink text-white font-bold text-base px-8 py-4 rounded-full hover:bg-brand-pink/90 active:scale-95 transition-all duration-200 shadow-lg shadow-brand-pink/30 w-full text-center"
          >
            Join the Next Run →
          </Link>
        </div>
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
