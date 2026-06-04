'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/components/providers/LanguageProvider'

export default function AdminNav() {
  const { t } = useLanguage()
  const pathname = usePathname()

  const links = [
    {
      href: '/admin',
      label: t.admin.dashboard,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      href: '/admin/events/new',
      label: t.admin.newEvent,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
  ]

  return (
    <aside className="lg:w-52 flex-shrink-0">
      <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-4 lg:sticky lg:top-24">
        <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-3 px-2">
          {t.admin.dashboard}
        </p>
        <nav className="flex flex-row lg:flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-brand-pink/20 text-brand-pink'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.icon}
              <span className="hidden sm:inline">{link.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  )
}
