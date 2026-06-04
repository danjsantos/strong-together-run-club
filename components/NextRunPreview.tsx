'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'
import { formatDate, formatTime } from '@/lib/utils'

interface Event {
  id: string
  title: string
  title_pt: string | null
  date: string
  location: string
  location_pt: string | null
  google_maps_url: string | null
}

interface NextRunPreviewProps {
  event: Event
  rsvpCount?: number
}

export default function NextRunPreview({ event, rsvpCount = 0 }: NextRunPreviewProps) {
  const { t, language } = useLanguage()
  const title = (language === 'pt' && event.title_pt) ? event.title_pt : event.title
  const location = (language === 'pt' && event.location_pt) ? event.location_pt : event.location

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-4 text-center">
          {t.nextRun.title}
        </h2>

        <div className="bg-gradient-card rounded-3xl border border-brand-wine/40 overflow-hidden">
          {/* Pink top bar */}
          <div className="h-1 bg-gradient-pink" />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="text-white text-2xl font-bold mb-1">{title}</h3>
                <p className="text-white/50 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {location}
                </p>
              </div>

              {rsvpCount > 0 && (
                <div className="flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/30 rounded-full px-4 py-2 self-start">
                  <span className="w-2 h-2 rounded-full bg-brand-pink" />
                  <span className="text-brand-pink text-sm font-semibold">
                    {rsvpCount} {t.nextRun.attendees}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{t.nextRun.date}</p>
                <p className="text-white text-sm font-semibold">{formatDate(event.date, language)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-1">{t.nextRun.time}</p>
                <p className="text-white text-sm font-semibold">{formatTime(event.date, language)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/next-run"
                className="flex-1 bg-brand-pink text-white font-bold text-center py-3 px-6 rounded-full hover:bg-brand-pink/90 transition-colors"
              >
                {t.nextRun.rsvp}
              </Link>
              {event.google_maps_url && (
                <a
                  href={event.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 border border-white/20 text-white font-semibold text-center py-3 px-6 rounded-full hover:border-white/40 hover:bg-white/5 transition-colors"
                >
                  {t.nextRun.directions}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
