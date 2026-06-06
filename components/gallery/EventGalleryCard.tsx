'use client'

import { useState, useCallback } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatShortDate } from '@/lib/utils'
import EventGalleryLightbox from './EventGalleryLightbox'

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

interface EventGalleryCardProps {
  event: GalleryEvent
  photos: Photo[]
}

export default function EventGalleryCard({ event, photos }: EventGalleryCardProps) {
  const { t, language } = useLanguage()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(false)

  const displayTitle = language === 'pt' && event.title_pt ? event.title_pt : event.title
  const displayLocation = language === 'pt' && event.location_pt ? event.location_pt : event.location

  // Separate cover photo (flyer) from the regular photo grid
  const hasCover = Boolean(event.cover_photo_url)
  const gridPhotos = hasCover
    ? photos.filter(p => p.photo_url !== event.cover_photo_url)
    : photos

  const visiblePhotos = expanded ? gridPhotos : gridPhotos.slice(0, 8)

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index)
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
  }, [])

  return (
    <>
      <div className="bg-gradient-card rounded-2xl overflow-hidden border border-brand-wine/30 shadow-xl">
        {/* Event header */}
        <div className="p-4 pb-0">
          <h2 className="text-white font-black text-xl sm:text-2xl leading-tight mb-1">{displayTitle}</h2>
          <div className="flex flex-wrap items-center gap-3 text-white/70 text-sm pb-4">
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatShortDate(event.date, language)}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {displayLocation}
            </span>
            <span className="flex items-center gap-1 ml-auto">
              <svg className="w-3.5 h-3.5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-semibold text-white">{event.photo_count}</span>
              <span>{t.gallery.photos}</span>
            </span>
          </div>
        </div>

        {/* Cover photo / flyer — displayed prominently when set */}
        {hasCover && (
          <div className="px-4 pb-4">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.cover_photo_url!}
                alt={`${displayTitle} flyer`}
                className="rounded-2xl shadow-lg w-full max-w-sm object-contain"
              />
            </div>
          </div>
        )}

        {/* Photo grid — excludes the cover photo */}
        {gridPhotos.length > 0 ? (
          <div className="p-4 pt-0">
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {visiblePhotos.map((photo, index) => (
                <button
                  key={photo.id}
                  className="relative aspect-square overflow-hidden rounded-lg group/thumb cursor-pointer"
                  onClick={() => openLightbox(index)}
                  aria-label={photo.caption || `Photo ${index + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.photo_url}
                    alt={photo.caption || ''}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/30 transition-colors duration-200 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                  {/* Show overlay on last visible if more photos exist */}
                  {!expanded && index === 7 && gridPhotos.length > 8 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">+{gridPhotos.length - 8}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Show more / less toggle */}
            {gridPhotos.length > 8 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-4 w-full text-center text-brand-pink text-sm font-semibold hover:text-brand-pink/80 transition-colors py-2"
              >
                {expanded ? t.gallery.showLess : `${t.gallery.viewMore} (${gridPhotos.length - 8})`}
              </button>
            )}
          </div>
        ) : (
          !hasCover && (
            <div className="p-6 text-center text-white/30 text-sm">{t.gallery.noPhotos}</div>
          )
        )}
      </div>

      {/* Lightbox — uses gridPhotos so indices align correctly */}
      {lightboxIndex !== null && (
        <EventGalleryLightbox
          photos={gridPhotos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onNavigate={setLightboxIndex}
        />
      )}
    </>
  )
}
