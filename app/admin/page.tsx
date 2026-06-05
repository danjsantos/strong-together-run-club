import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from './AdminDashboardClient'


export default async function AdminPage() {
  const supabase = createClient()

  const [
    { data: events },
    { count: memberCount },
    { count: totalRsvps },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, title_pt, date, location, is_active')
      .order('date', { ascending: false })
      .limit(20),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('rsvps').select('*', { count: 'exact', head: true }),
  ])

  const eventIds = (events || []).map(e => e.id)
  let rsvpCounts: Record<string, number> = {}
  let checkinCounts: Record<string, number> = {}

  if (eventIds.length > 0) {
    const [{ data: rsvpData }, { data: checkinData }] = await Promise.all([
      supabase
        .from('rsvps')
        .select('event_id')
        .in('event_id', eventIds),
      supabase
        .from('checkins')
        .select('event_id')
        .in('event_id', eventIds),
    ])

    if (rsvpData) {
      rsvpData.forEach(r => {
        rsvpCounts[r.event_id] = (rsvpCounts[r.event_id] || 0) + 1
      })
    }
    if (checkinData) {
      checkinData.forEach(c => {
        checkinCounts[c.event_id] = (checkinCounts[c.event_id] || 0) + 1
      })
    }
  }

  return (
    <AdminDashboardClient
      events={events || []}
      memberCount={memberCount || 0}
      totalRsvps={totalRsvps || 0}
      rsvpCounts={rsvpCounts}
      checkinCounts={checkinCounts}
    />
  )
}
