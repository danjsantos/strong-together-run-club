'use client'

import Link from 'next/link'
import Logo from './Logo'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function Footer() {
  const { t } = useLanguage()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-brand-dark border-t border-brand-wine/30 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Brand */}
          <div className="flex flex-col gap-3">
            <Logo className="h-10 w-auto" />
            <p className="text-white/50 text-sm">{t.footer.tagline}</p>
            <p className="text-white/40 text-xs flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {t.footer.location}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest">Links</h3>
            <Link href="/" className="text-white/60 text-sm hover:text-white transition-colors">{t.nav.home}</Link>
            <Link href="/next-run" className="text-white/60 text-sm hover:text-white transition-colors">{t.nav.nextRun}</Link>
            <Link href="/login" className="text-white/60 text-sm hover:text-white transition-colors">{t.nav.login}</Link>
          </div>

          {/* Social */}
          <div className="flex flex-col gap-3">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest">Social</h3>
            <a
              href="https://www.instagram.com/strongtogetherrunclub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/60 text-sm hover:text-brand-pink transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              @strongtogetherrunclub
            </a>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs">
            &copy; {year} Strong Together Run Club. {t.footer.rights}.
          </p>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-brand-pink animate-pulse-slow" />
            <span className="text-white/30 text-xs">Myrtle Beach, SC</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
