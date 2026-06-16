import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminPage() {
  // Guard: only admins can access this page
  const adminUser = await requireAdmin()
  if (!adminUser) redirect('/')

  // Use the service-role client so RLS does not hide RSVPs / check-ins
  const supabase = createAdminClient()

  const [
    { data: events },
    { count: memberCount },
    { count: totalRsvps },
  ] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, title_pt, date, location, location_pt, description, description_pt, google_maps_url, google_maps_embed, is_active, cover_photo_url')
      .order('date', { ascending: false })
      .limit(20),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('rsvps').select('*', { count: 'exact', head: true }),
  ])

  const eventIds = (events || []).map(e => e.id)
  const rsvpCounts: Record<string, number> = {}
  const checkinCounts: Record<string, number> = {}

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
