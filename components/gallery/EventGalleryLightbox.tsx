'use client'

import { useEffect, useCallback } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Photo {
  id: string
  photo_url: string
  caption: string | null
}

interface EventGalleryLightboxProps {
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function EventGalleryLightbox({
  photos,
  currentIndex,
  onClose,
  onNavigate,
}: EventGalleryLightboxProps) {
  const { t } = useLanguage()
  const photo = photos[currentIndex]

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(currentIndex - 1)
  }, [currentIndex, onNavigate])

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) onNavigate(currentIndex + 1)
  }, [currentIndex, photos.length, onNavigate])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose, handlePrev, handleNext])

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close button */}
      <button
        className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10"
        onClick={onClose}
        aria-label={t.gallery.close}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Photo counter */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
        {currentIndex + 1} / {photos.length}
      </div>

      {/* Prev arrow */}
      {currentIndex > 0 && (
        <button
          className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); handlePrev() }}
          aria-label={t.gallery.prevPhoto}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Next arrow */}
      {currentIndex < photos.length - 1 && (
        <button
          className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full w-11 h-11 flex items-center justify-center transition-colors z-10"
          onClick={(e) => { e.stopPropagation(); handleNext() }}
          aria-label={t.gallery.nextPhoto}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image */}
      <div
        className="relative max-w-5xl w-full mx-16 flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.photo_url}
          alt={photo.caption || 'Event photo'}
          className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
        />
        {photo.caption && (
          <p className="mt-4 text-white/70 text-sm text-center max-w-lg px-4">{photo.caption}</p>
        )}
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 overflow-x-auto">
          {photos.map((p, i) => (
            <button
              key={p.id}
              onClick={(e) => { e.stopPropagation(); onNavigate(i) }}
              className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentIndex ? 'border-brand-pink scale-110' : 'border-transparent opacity-50 hover:opacity-80'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.photo_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
