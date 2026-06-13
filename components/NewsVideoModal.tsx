'use client'

import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/components/providers/LanguageProvider'

/* ============================================================
   CONFIG
   ------------------------------------------------------------
   ARTICLE_URL : the WMBF story the pop up links to (already set).
   THUMBNAIL   : optional. If you later drop a screenshot of the
                 segment into /public (e.g. /wmbf-thumb.jpg),
                 set it here and it shows as a preview image.
                 Leave '' to show a clean branded banner instead.
   ============================================================ */
const ARTICLE_URL =
  'https://www.wmbfnews.com/2026/06/10/more-than-miles-how-strong-together-run-club-is-building-community/'
const THUMBNAIL = ''

// Shows the pop up once per visitor. Bump the suffix (v2, v3...) to re-show to everyone.
const SEEN_KEY = 'strc-news-popup-seen-v1'

const COPY = {
  en: {
    badge: 'In the News',
    title: 'We made the news! \uD83D\uDCFA',
    body: "Strong Together Run Club was featured on WMBF News' Grand Strand Today. Take a look!",
    cta: 'Watch the segment on WMBF',
    close: 'Close',
  },
  pt: {
    badge: 'Na mídia',
    title: 'Saímos no jornal! \uD83D\uDCFA',
    body: 'O Strong Together Run Club apareceu no Grand Strand Today, da WMBF News. Dá uma olhada!',
    cta: 'Assistir na WMBF',
    close: 'Fechar',
  },
  es: {
    badge: 'En las noticias',
    title: '\u00A1Salimos en las noticias! \uD83D\uDCFA',
    body: 'Strong Together Run Club apareció en Grand Strand Today, de WMBF News. \u00A1Échale un vistazo!',
    cta: 'Ver el segmento en WMBF',
    close: 'Cerrar',
  },
} as const

export default function NewsVideoModal() {
  const { language } = useLanguage()
  const t = COPY[language] ?? COPY.en
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Show once per visitor, ~2s after load
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem(SEEN_KEY)) return
    const timer = setTimeout(() => setOpen(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Close on ESC + lock background scroll while open
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  function close() {
    setOpen(false)
    if (typeof window !== 'undefined') localStorage.setItem(SEEN_KEY, '1')
  }

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      onClick={(e) => {
        if (e.target === e.currentTarget) close()
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-brand-pink/30 bg-gradient-card shadow-2xl animate-slide-up"
      >
        {/* Close button */}
        <button
          onClick={close}
          aria-label={t.close}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white/80 transition hover:bg-black/60 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Clickable banner -> opens WMBF story */}
        <a
          href={ARTICLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative block aspect-video w-full overflow-hidden bg-gradient-pink"
        >
          {THUMBNAIL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={THUMBNAIL} alt="WMBF News segment" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-105">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#E91E8C" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </div>
          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            WMBF News
          </span>
        </a>

        {/* Text */}
        <div className="p-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-pink/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-pink">
            {t.badge}
          </span>
          <h2 className="mt-3 text-2xl font-black text-white">{t.title}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-white/70">{t.body}</p>

          <div className="mt-5 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <a
              href={ARTICLE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={close}
              className="w-full rounded-full bg-brand-pink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-pink/90 sm:w-auto"
            >
              {t.cta}
            </a>
            <button
              onClick={close}
              className="w-full rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 sm:w-auto"
            >
              {t.close}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
