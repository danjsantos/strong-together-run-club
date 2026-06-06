import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const metadata = { title: 'My Dashboard' }

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, display_name, avatar_url, bio, city, goals, badges, onboarding_complete, is_admin')
    .eq('id', user.id)
    .single()

  // Redirect admins to /admin
  if (profile?.is_admin) {
    redirect('/admin')
  }

  // Redirect to onboarding if profile row is missing or onboarding is not complete.
  // Bug 4a fix: a null profile means the profiles row was never created (e.g. the
  // handle_new_user trigger did not fire). Treat it the same as onboarding_complete=false
  // so the user is sent to onboarding instead of landing on a broken dashboard.
  if (!profile || !profile.onboarding_complete) {
    redirect('/onboarding')
  }

  // Fetch total check-in count
  const { count: totalCheckins } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)

  // Fetch recent check-in history (last 10)
  const { data: recentCheckins } = await supabase
    .from('checkins')
    .select('id, checked_in_at, event_id, events(title, date)')
    .eq('profile_id', user.id)
    .order('checked_in_at', { ascending: false })
    .limit(10)

  // Fetch next upcoming event
  const { data: nextEvent } = await supabase
    .from('events')
    .select('id, title, date, location, google_maps_url')
    .eq('is_active', true)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle()

  // Check if user has RSVPd for the next event
  let hasRsvp = false
  if (nextEvent) {
    const { data: rsvp } = await supabase
      .from('rsvps')
      .select('id')
      .eq('event_id', nextEvent.id)
      .eq('user_id', user.id)
      .maybeSingle()
    hasRsvp = !!rsvp
  }

  // Leaderboard position (all-time)
  const { data: allCheckins } = await supabase
    .from('checkins')
    .select('profile_id')

  let leaderboardPosition: number | null = null
  if (allCheckins) {
    const countMap = new Map<string, number>()
    for (const row of allCheckins) {
      countMap.set(row.profile_id, (countMap.get(row.profile_id) ?? 0) + 1)
    }
    const sorted = Array.from(countMap.entries()).sort((a, b) => b[1] - a[1])
    const idx = sorted.findIndex(([id]) => id === user.id)
    leaderboardPosition = idx >= 0 ? idx + 1 : null
  }

  return (
    <DashboardClient
      profile={profile}
      totalCheckins={totalCheckins ?? 0}
      recentCheckins={(recentCheckins ?? []) as unknown as RecentCheckin[]}
      nextEvent={nextEvent ?? null}
      hasRsvp={hasRsvp}
      leaderboardPosition={leaderboardPosition}
    />
  )
}

export interface RecentCheckin {
  id: string
  checked_in_at: string
  event_id: string
  events: { title: string; date: string } | null
}
