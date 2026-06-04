'use client'

import Link from 'next/link'
import { useLanguage } from '@/components/providers/LanguageProvider'
import AdminEventForm from '@/components/AdminEventForm'

export default function NewEventPage() {
  const { t } = useLanguage()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-white font-bold text-xl">{t.admin.newEvent}</h1>
      </div>

      <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-6">
        <AdminEventForm />
      </div>
    </div>
  )
}
