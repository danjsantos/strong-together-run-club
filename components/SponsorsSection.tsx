'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

export interface PublicSponsor {
  id: string
  name: string
  logo_url: string | null
  link_url: string | null
}

const HEADING: Record<string, { kicker: string; title: string }> = {
  en: { kicker: 'Thank you to', title: 'Our Sponsors' },
  pt: { kicker: 'Agradecemos a', title: 'Nossos Patrocinadores' },
  es: { kicker: 'Gracias a', title: 'Nuestros Patrocinadores' },
}

export default function SponsorsSection({ sponsors }: { sponsors: PublicSponsor[] }) {
  const { language } = useLanguage()
  if (!sponsors || sponsors.length === 0) return null
  const copy = HEADING[language] ?? HEADING.en

  return (
    <section className="py-16 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">
          {copy.kicker}
        </p>
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-10">{copy.title}</h2>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8">
          {sponsors.map((s) => {
            const inner = s.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={s.logo_url}
                alt={s.name}
                className="h-14 sm:h-16 w-auto object-contain"
              />
            ) : (
              <span className="text-white font-bold text-lg">{s.name}</span>
            )
            return s.link_url ? (
              <a
                key={s.id}
                href={s.link_url}
                target="_blank"
                rel="noopener noreferrer"
                title={s.name}
                className="opacity-80 hover:opacity-100 transition"
              >
                {inner}
              </a>
            ) : (
              <div key={s.id} title={s.name} className="opacity-80">
                {inner}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
