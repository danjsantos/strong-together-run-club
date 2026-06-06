import { createClient } from '@/lib/supabase/server'
import LeaderboardClient from './LeaderboardClient'

export const metadata = { title: 'Leaderboard' }

export interface LeaderboardEntry {
  profile_id: string
  display_name: string | null
  name: string | null
  avatar_url: string | null
  run_count: number
}

async function getLeaderboard(supabase: ReturnType<typeof createClient>, period: 'monthly' | 'yearly' | 'all') {
  let query = supabase
    .from('checkins')
    .select('profile_id, profiles(id, name, display_name, avatar_url)')

  if (period === 'monthly') {
    const start = new Date()
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    query = query.gte('checked_in_at', start.toISOString())
  } else if (period === 'yearly') {
    const start = new Date()
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)
    query = query.gte('checked_in_at', start.toISOString())
  }

  const { data, error } = await query

  if (error || !data) return []

  // Aggregate by profile
  const map = new Map<string, LeaderboardEntry>()
  for (const row of data) {
    const p = (row.profiles as unknown) as { id: string; name: string | null; display_name: string | null; avatar_url: string | null } | null
    if (!p) continue
    if (map.has(p.id)) {
      map.get(p.id)!.run_count++
    } else {
      map.set(p.id, {
        profile_id: p.id,
        display_name: p.display_name,
        name: p.name,
        avatar_url: p.avatar_url,
        run_count: 1,
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.run_count - a.run_count)
}

export default async function LeaderboardPage() {
  const supabase = createClient()

  const [monthly, yearly, allTime, { data: { user } }] = await Promise.all([
    getLeaderboard(supabase, 'monthly'),
    getLeaderboard(supabase, 'yearly'),
    getLeaderboard(supabase, 'all'),
    supabase.auth.getUser(),
  ])

  return (
    <LeaderboardClient
      monthly={monthly}
      yearly={yearly}
      allTime={allTime}
      currentUserId={user?.id ?? null}
    />
  )
}
