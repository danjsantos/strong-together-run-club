'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

export default function GalleryHeader() {
  const { t } = useLanguage()

  return (
    <div className="text-center mb-12">
      <p className="text-brand-pink text-xs font-bold uppercase tracking-widest mb-3">
        Strong Together Run Club
      </p>
      <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
        <span className="bg-gradient-pink bg-clip-text text-transparent">{t.gallery.title}</span>
      </h1>
      <p className="text-white/50 text-base mb-6">{t.gallery.subtitle}</p>
      <div className="w-16 h-1 bg-gradient-pink rounded-full mx-auto" />
    </div>
  )
}
