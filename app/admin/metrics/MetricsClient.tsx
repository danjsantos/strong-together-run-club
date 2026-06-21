'use client'

import Link from 'next/link'
import { weekLabel } from '@/lib/metrics'

interface WeekPoint {
  weekStart: string
  count: number
}

interface Props {
  totalMembers: number
  totalCheckins: number
  totalEvents: number
  avgAttendance: number
  activeMembers: number
  returningRate: number
  newMembersPerWeek: WeekPoint[]
  checkinsPerWeek: WeekPoint[]
}

function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-4">
      <p className="text-white/50 text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-white text-3xl font-black mt-1">{value}</p>
      {hint && <p className="text-white/40 text-[11px] mt-1 leading-tight">{hint}</p>}
    </div>
  )
}

function BarChart({ title, data, color }: { title: string; data: WeekPoint[]; color: string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div className="bg-gradient-card rounded-2xl border border-brand-wine/40 p-5">
      <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-4">{title}</p>
      <div className="flex items-end gap-1.5 h-40">
        {data.map((d) => (
          <div
            key={d.weekStart}
            className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0"
          >
            <span className="text-white/70 text-[10px] font-bold leading-none h-3">
              {d.count > 0 ? d.count : ''}
            </span>
            <div
              className="w-full rounded-t-md"
              style={{
                height: `${(d.count / max) * 100}%`,
                minHeight: d.count > 0 ? '4px' : '2px',
                backgroundColor: d.count > 0 ? color : 'rgba(255,255,255,0.06)',
              }}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-1.5 mt-2">
        {data.map((d) => (
          <span
            key={d.weekStart}
            className="flex-1 text-center text-white/30 text-[9px] truncate"
          >
            {weekLabel(d.weekStart)}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MetricsClient({
  totalMembers,
  totalCheckins,
  totalEvents,
  avgAttendance,
  activeMembers,
  returningRate,
  newMembersPerWeek,
  checkinsPerWeek,
}: Props) {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black text-white">Metrics</h1>
          <Link href="/admin" className="text-brand-pink text-sm font-semibold hover:underline">
            ← Back to admin
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Members" value={totalMembers} />
          <StatCard label="Check-ins" value={totalCheckins} />
          <StatCard label="Avg / run" value={avgAttendance} hint="check-ins per event" />
          <StatCard label="Events" value={totalEvents} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <StatCard
            label="Active members"
            value={activeMembers}
            hint="checked in the last 4 weeks"
          />
          <StatCard
            label="Returning rate"
            value={`${returningRate}%`}
            hint="members with 2+ check-ins"
          />
        </div>

        <BarChart title="New members per week" data={newMembersPerWeek} color="#FF8FC7" />
        <BarChart title="Check-ins per week" data={checkinsPerWeek} color="#E91E8C" />

        <p className="text-white/30 text-xs text-center">
          Weeks start on Monday, Eastern Time. Last 12 weeks shown.
        </p>
      </div>
    </div>
  )
}
