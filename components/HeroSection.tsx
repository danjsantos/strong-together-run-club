'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'
export default function HeroSection() {
  const { t } = useLanguage()
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <Image src="/myrtle-beach-bg.jpg" alt="Myrtle Beach, SC" fill priority className="object-cover object-center" />
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-hero opacity-70" />
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(233,30,140,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(233,30,140,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-pink/10 blur-3xl pointer-events-none" />
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto pt-20">
        <div className="inline-flex items-center gap-2 bg-brand-wine/60 border border-brand-pink/30 rounded-full px-4 py-1.5 mb-8 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse" />
          <span className="text-white/80 text-xs font-medium tracking-wide uppercase">Myrtle Beach, SC</span>
        </div>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-tight mb-4 animate-slide-up">
          {t.hero.title}<br />
          <span className="text-brand-pink">{t.hero.titleAccent}</span>
        </h1>
        <p className="text-white/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-slide-up">{t.hero.subtitle}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in">
          <Link href="/next-run" className="bg-brand-pink text-white font-bold text-base px-8 py-4 rounded-full hover:bg-brand-pink/90 hover:scale-105 transition-all duration-200 shadow-lg shadow-brand-pink/30">{t.hero.cta}</Link>
          <Link href="/login" className="border border-white/30 text-white font-semibold text-base px-8 py-4 rounded-full hover:border-white hover:bg-white/10 transition-all duration-200">{t.hero.joinUs}</Link>
        </div>
        <div className="mt-16 flex flex-col items-center gap-2 text-white/30 text-xs animate-fade-in">
          <span>{t.hero.scroll}</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent animate-pulse" />
        </div>
      </div>
    </section>
  )
}
