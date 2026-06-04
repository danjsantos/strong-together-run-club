'use client'

import { useLanguage } from '@/components/providers/LanguageProvider'

interface StatsSectionProps {
  memberCount: number
  totalRsvps: number
}

export default function StatsSection({ memberCount, totalRsvps }: StatsSectionProps) {
  const { t } = useLanguage()

  const stats = [
    { value: memberCount, label: t.stats.members, icon: '👟' },
    { value: Math.max(1, Math.floor(totalRsvps / Math.max(memberCount, 1))), label: t.stats.runsCompleted, icon: '🏃' },
    { value: totalRsvps * 3, label: t.stats.totalMiles, icon: '📍' },
  ]

  return (
    <section className="relative py-16 bg-brand-dark">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-gradient-card rounded-2xl p-6 text-center border border-brand-wine/40 hover:border-brand-pink/40 transition-colors"
            >
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-4xl sm:text-5xl font-black text-brand-pink mb-1">
                {stat.value.toLocaleString()}
                <span className="text-2xl">+</span>
              </div>
              <div className="text-white/60 text-sm font-medium uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
