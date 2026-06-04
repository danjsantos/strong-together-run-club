import { createClient } from '@/lib/supabase/server'
import NextRunClient from './NextRunClient'


export default async function NextRunPage() {
  const supabase = createClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .gte('date', new Date().toISOString())
    .eq('is_active', true)
    .order('date', { ascending: true })
    .limit(1)
    .single()

  let rsvpCount = 0
  if (event) {
    const { count } = await supabase
      .from('rsvps')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
    rsvpCount = count || 0
  }

  return <NextRunClient event={event ?? null} initialRsvpCount={rsvpCount} />
}
