'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'
import Link from 'next/link'
import Image from 'next/image'

export default function AboutPage() {
  const { t } = useLanguage()
  const about = (t as any).about

  return (
    <div className="min-h-screen bg-brand-dark">

      {/* ── HERO ── */}
      <section className="relative min-h-[60vh] flex items-center justify-center text-center overflow-hidden pt-28 pb-20 px-4">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-hero opacity-30 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(233,30,140,0.18)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto animate-fade-in">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-brand-pink/10 border border-brand-pink/30 rounded-full px-4 py-1.5 text-xs font-semibold tracking-widest uppercase text-brand-pink mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-pink" />
            Myrtle Beach, SC
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black leading-tight mb-5">
            {about.hero.title}{' '}
            <span className="text-brand-pink">{about.hero.titleAccent}</span>
          </h1>

          <p className="text-white/65 text-lg leading-relaxed max-w-xl mx-auto">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      {/* ── OUR STORY ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <span className="text-xs font-bold tracking-widest uppercase text-brand-pink block mb-3">
          {about.story.label}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black mb-6">{about.story.title}</h2>
        <p className="text-white/65 leading-relaxed text-lg mb-4">{about.story.p1}</p>
        <p className="text-white/65 leading-relaxed text-lg">{about.story.p2}</p>

        {/* Stats strip */}
        <div className="grid grid-cols-3 mt-10 rounded-2xl overflow-hidden border border-brand-pink/20">
          {[
            { value: '28+', label: about.story.statMembers },
            { value: '54+', label: about.story.statMiles },
            { value: '100%', label: about.story.statPaces },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-gradient-card px-4 py-8 text-center border-r border-brand-pink/20 last:border-r-0"
            >
              <div className="text-4xl font-black text-brand-pink mb-1">{s.value}</div>
              <div className="text-xs font-semibold tracking-widest uppercase text-white/50">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-gradient-pink opacity-20" />
      </div>

      {/* ── VALUES ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <span className="text-xs font-bold tracking-widest uppercase text-brand-pink block mb-3">
          {about.values.label}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black mb-3">{about.values.title}</h2>
        <p className="text-white/65 leading-relaxed text-lg mb-10">{about.values.subtitle}</p>

        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: '🤝', title: about.values.v1Title, desc: about.values.v1Desc },
            { icon: '💪', title: about.values.v2Title, desc: about.values.v2Desc },
            { icon: '🌊', title: about.values.v3Title, desc: about.values.v3Desc },
          ].map((v, i) => (
            <div
              key={i}
              className="bg-gradient-card border border-brand-pink/20 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(233,30,140,0.2)] transition-all duration-200"
            >
              <div className="text-3xl mb-3">{v.icon}</div>
              <h3 className="font-bold text-base mb-2">{v.title}</h3>
              <p className="text-white/55 text-sm leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-gradient-pink opacity-20" />
      </div>

      {/* ── FOUNDER ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <span className="text-xs font-bold tracking-widest uppercase text-brand-pink block mb-3">
          {about.founder.label}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black mb-3">{about.founder.title}</h2>
        <p className="text-white/65 leading-relaxed text-lg mb-8">{about.founder.intro}</p>

        <div className="bg-gradient-card border border-brand-pink/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-full bg-gradient-pink flex items-center justify-center text-3xl flex-shrink-0 border-2 border-brand-pink">
            🏃
          </div>
          <div>
            <h3 className="text-xl font-black mb-0.5">Ana</h3>
            <p className="text-xs font-bold tracking-widest uppercase text-brand-pink mb-4">
              {about.founder.role}
            </p>
            <p className="text-white/65 leading-relaxed italic">
              &ldquo;{about.founder.quote}&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-gradient-pink opacity-20" />
      </div>

      {/* ── IN THE NEWS ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <span className="text-xs font-bold tracking-widest uppercase text-brand-pink block mb-3">
          {about.news.label}
        </span>
        <h2 className="text-3xl sm:text-4xl font-black mb-3">{about.news.title}</h2>
        <p className="text-white/65 leading-relaxed text-lg mb-8">{about.news.intro}</p>

        {/* Interview card */}
        <div className="bg-gradient-card border border-brand-pink/20 rounded-2xl overflow-hidden">

          {/* Card header */}
          <div className="bg-brand-pink/10 border-b border-brand-pink/20 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <span className="bg-brand-pink text-white text-xs font-black tracking-widest uppercase px-3 py-1.5 rounded-full whitespace-nowrap">
              WMBF News
            </span>
            <div>
              <h3 className="font-bold text-base leading-snug">{about.news.articleTitle}</h3>
              <p className="text-white/50 text-xs mt-0.5">{about.news.articleMeta}</p>
            </div>
          </div>

          {/* Watch link */}
          <a
            href="https://www.wmbfnews.com/2026/06/10/more-than-miles-how-strong-together-run-club-is-building-community/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-6 py-4 border-b border-brand-pink/20 bg-brand-pink/5 hover:bg-brand-pink/15 transition-colors group"
          >
            <span className="text-2xl">📺</span>
            <div className="flex-1">
              <p className="font-semibold text-sm text-white">{about.news.watchLabel}</p>
              <p className="text-xs text-white/50">Grand Strand Today · June 10, 2026 · wmbfnews.com</p>
            </div>
            <span className="text-brand-pink font-bold text-lg group-hover:translate-x-1 transition-transform">→</span>
          </a>

          {/* Body */}
          <div className="p-6 sm:p-8 space-y-5">
            <blockquote className="border-l-4 border-brand-pink pl-4 text-base italic text-white leading-relaxed">
              &ldquo;{about.news.quote1}&rdquo;
            </blockquote>

            <p className="text-white/65 leading-relaxed">{about.news.body1}</p>
            <p className="text-white/65 leading-relaxed">{about.news.body2}</p>

            <blockquote className="border-l-4 border-brand-pink pl-4 text-base italic text-white leading-relaxed">
              &ldquo;{about.news.quote2}&rdquo;
              <footer className="text-white/50 text-sm mt-2 not-italic">— WMBF News, June 10, 2026</footer>
            </blockquote>

            <p className="text-white/65 leading-relaxed">{about.news.body3}</p>

            {/* Source footer */}
            <div className="flex items-center gap-3 pt-4 border-t border-brand-pink/20">
              <span className="bg-white/10 border border-white/15 rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider">
                WMBF
              </span>
              <a
                href="https://www.wmbfnews.com/2026/06/10/more-than-miles-how-strong-together-run-club-is-building-community/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-pink text-sm font-medium hover:underline"
              >
                {about.news.readMore} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="h-px bg-gradient-pink opacity-20" />
      </div>

      {/* ── CTA ── */}
      <section className="relative text-center py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_50%_50%,rgba(233,30,140,0.1)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-lg mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">{about.cta.title}</h2>
          <p className="text-white/65 text-lg mb-8 leading-relaxed">{about.cta.subtitle}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/login"
              className="bg-brand-pink text-white font-bold px-8 py-3.5 rounded-full hover:bg-brand-pink/90 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(233,30,140,0.4)] transition-all duration-200"
            >
              {about.cta.join}
            </Link>
            <Link
              href="/next-run"
              className="border-2 border-white/25 text-white font-bold px-8 py-3.5 rounded-full hover:border-brand-pink hover:-translate-y-0.5 transition-all duration-200"
            >
              {about.cta.nextRun}
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
