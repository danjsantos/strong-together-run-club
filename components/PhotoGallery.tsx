'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

interface Photo {
  id: string
  url: string
  alt: string | null
  events?: { title: string; title_pt: string | null } | null
}

interface PhotoGalleryProps {
  photos: Photo[]
}

export default function PhotoGallery({ photos }: PhotoGalleryProps) {
  const { t, language } = useLanguage()
  const [lightbox, setLightbox] = useState<Photo | null>(null)

  if (photos.length === 0) {
    return (
      <section className="py-16 px-4 text-center">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4">{t.gallery.title}</h2>
        <p className="text-white/30 text-sm">{t.gallery.noPhotos}</p>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-2">{t.gallery.title}</h2>
          <p className="text-white/50 text-sm">{t.gallery.subtitle}</p>
        </div>

        {/* Masonry-style grid */}
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="break-inside-avoid relative group cursor-pointer overflow-hidden rounded-2xl"
              onClick={() => setLightbox(photo)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.alt || 'Run club photo'}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                {photo.events && (
                  <span className="text-white text-xs font-medium truncate">
                    {language === 'pt' && photo.events.title_pt
                      ? photo.events.title_pt
                      : photo.events.title}
                  </span>
                )}
              </div>
              {/* Zoom icon */}
              <div className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 rounded-full w-10 h-10 flex items-center justify-center"
            onClick={() => setLightbox(null)}
            aria-label={t.gallery.close}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.url}
            alt={lightbox.alt || ''}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  )
}
