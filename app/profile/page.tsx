import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My Profile' }

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/profile')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name, email, avatar_url, display_name, bio, badges')
    .eq('id', user.id)
    .single()

  const { data: checkins } = await supabase
    .from('checkins')
    .select('id, checked_in_at, event_id, events(id, title, date, location)')
    .eq('profile_id', user.id)
    .order('checked_in_at', { ascending: false })
    .limit(20)

  return (
    <ProfileClient
      profile={profile ?? { id: user.id, name: user.user_metadata?.full_name ?? null, email: user.email ?? null, avatar_url: user.user_metadata?.avatar_url ?? null, display_name: null, bio: null, badges: [] }}
      checkins={(checkins ?? []) as unknown as CheckinWithEvent[]}
    />
  )
}

export interface CheckinWithEvent {
  id: string
  checked_in_at: string
  event_id: string
  events: {
    id: string
    title: string
    date: string
    location: string
  } | null
}
