import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'
import { redirect } from 'next/navigation'
import MetricsClient from './MetricsClient'
import { weeklyCounts } from '@/lib/metrics'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Metrics' }

const WEEKS = 12
const DAY_MS = 24 * 60 * 60 * 1000

export default async function MetricsPage() {
  const adminUser = await requireAdmin()
  if (!adminUser) redirect('/')

  const db = createAdminClient()
  const [{ data: profiles }, { data: checkins }, { data: events }] = await Promise.all([
    db.from('profiles').select('id, created_at'),
    db.from('checkins').select('profile_id, event_id, checked_in_at'),
    db.from('events').select('id, date'),
  ])

  const profileRows = (profiles ?? []) as { id: string; created_at: string }[]
  const checkinRows = (checkins ?? []) as {
    profile_id: string
    event_id: string
    checked_in_at: string
  }[]
  const eventRows = (events ?? []) as { id: string; date: string }[]

  const now = new Date()

  const totalMembers = profileRows.length
  const totalCheckins = checkinRows.length
  const totalEvents = eventRows.length

  // Average attendance over events that actually had check-ins
  const perEvent: Record<string, number> = {}
  const perMember: Record<string, number> = {}
  const activeSet = new Set<string>()
  const cutoff = new Date(now.getTime() - 28 * DAY_MS)

  for (const c of checkinRows) {
    if (c.event_id) perEvent[c.event_id] = (perEvent[c.event_id] || 0) + 1
    if (c.profile_id) perMember[c.profile_id] = (perMember[c.profile_id] || 0) + 1
    if (c.checked_in_at && new Date(c.checked_in_at) >= cutoff && c.profile_id) {
      activeSet.add(c.profile_id)
    }
  }

  const eventsWithCheckins = Object.keys(perEvent).length
  const avgAttendance =
    eventsWithCheckins > 0 ? Math.round((totalCheckins / eventsWithCheckins) * 10) / 10 : 0

  const membersWithCheckin = Object.keys(perMember).length
  const returningMembers = Object.values(perMember).filter((n) => n >= 2).length
  const returningRate =
    membersWithCheckin > 0 ? Math.round((returningMembers / membersWithCheckin) * 100) : 0

  const newMembersPerWeek = weeklyCounts(
    profileRows.map((p) => p.created_at),
    WEEKS,
    now,
  )
  const checkinsPerWeek = weeklyCounts(
    checkinRows.map((c) => c.checked_in_at),
    WEEKS,
    now,
  )

  return (
    <MetricsClient
      totalMembers={totalMembers}
      totalCheckins={totalCheckins}
      totalEvents={totalEvents}
      avgAttendance={avgAttendance}
      activeMembers={activeSet.size}
      returningRate={returningRate}
      newMembersPerWeek={newMembersPerWeek}
      checkinsPerWeek={checkinsPerWeek}
    />
  )
}
