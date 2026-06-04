'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'
import WeatherWidget from '@/components/WeatherWidget'
import RSVPForm from '@/components/RSVPForm'
import { formatDate, formatTime } from '@/lib/utils'
interface Event {
  id: string
  title: string
  title_pt: string | null
  description: string | null
  description_pt: string | null
  date: string
  location: string
  location_pt: string | null
  google_maps_url: string | null
  google_maps_embed: string | null
}
interface NextRunClientProps {
  event: Event | null
  initialRsvpCount: number
}
export default function NextRunClient({ event, initialRsvpCount }: NextRunClientProps) {
  const { t, language } = useLanguage()
  const [rsvpCount, setRsvpCount] = useState(initialRsvpCount)
  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-4 pt-20">
        <div>
          <div className="text-6xl mb-4">🏃</div>
          <h1 className="text-2xl font-bold text-white mb-2">{t.nextRun.title}</h1>
          <p className="text-white/50 text-sm mb-6">{t.nextRun.noEvent}</p>
          <Link href="/" className="bg-brand-pink text-white font-bold px-6 py-3 rounded-full hover:bg-brand-pink/90 transition-colors">{t.common.back}</Link>
        </div>
      </div>
    )
  }
  const title = (language === 'pt' && event.title_pt) ? event.title_pt : event.title
  const location = (language === 'pt' && event.location_pt) ? event.location_pt : event.location
  const description = (language === 'pt' && event.description_pt) ? event.description_pt : event.description
  return (
    <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-center mb-8 mt-4">
          <Image src="/next-run-banner.jpg" alt="Next Run Banner" width={500} height={700} className="rounded-2xl shadow-lg w-full max-w-sm object-contain" priority />
        </div>
        <div className="text-center mb-10">
          <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">{t.nextRun.title}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{title}</h1>
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            {location}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-card rounded-2xl p-5 border border-brand-wine/40">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{t.nextRun.date}</p>
                <p className="text-white font-bold text-base">{formatDate(event.date, language)}</p>
              </div>
              <div className="bg-gradient-card rounded-2xl p-5 border border-brand-wine/40">
                <p className="text-white/40 text-xs uppercase tracking-wider mb-2">{t.nextRun.time}</p>
                <p className="text-white font-bold text-base">{formatTime(event.date, language)}</p>
              </div>
            </div>
            {rsvpCount > 0 && (
              <div className="flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/30 rounded-xl px-4 py-3">
                <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
                <span className="text-brand-pink text-sm font-semibold">{rsvpCount} {t.nextRun.attendees}</span>
              </div>
            )}
            {description && (
              <div className="bg-gradient-card rounded-2xl p-6 border border-brand-wine/40">
                <h2 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-3">{t.nextRun.description}</h2>
                <p className="text-white/80 text-sm leading-relaxed">{description}</p>
              </div>
            )}
            {event.google_maps_embed ? (
              <div className="rounded-2xl overflow-hidden border border-brand-wine/40 aspect-video">
                <iframe src={event.google_maps_embed} className="w-full h-full" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Event location map" />
              </div>
            ) : event.google_maps_url ? (
              <a href={event.google_maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-gradient-card rounded-2xl p-5 border border-brand-wine/40 hover:border-brand-pink/40 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-brand-pink/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-brand-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm group-hover:text-brand-pink transition-colors">{t.nextRun.directions}</p>
                  <p className="text-white/50 text-xs">{location}</p>
                </div>
                <svg className="w-4 h-4 text-white/30 ml-auto group-hover:text-brand-pink transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </a>
            ) : null}
          </div>
          <div className="flex flex-col gap-5">
            <RSVPForm eventId={event.id} onRSVPChange={setRsvpCount} />
            <WeatherWidget />
          </div>
        </div>
      </div>
    </div>
  )
}
