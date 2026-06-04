import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/HeroSection'
import StatsSection from '@/components/StatsSection'
import NextRunPreview from '@/components/NextRunPreview'
import PhotoGallery from '@/components/PhotoGallery'


export default async function HomePage() {
  const supabase = createClient()

  // Step 1: get next event ID (needed to query its RSVP count)
  const { data: nextEvent } = await supabase
    .from('events')
    .select('id, title, title_pt, date, location, location_pt, google_maps_url')
    .gte('date', new Date().toISOString())
    .eq('is_active', true)
    .order('date', { ascending: true })
    .limit(1)
    .single()

  // Step 2: remaining queries in parallel
  const [
    { count: memberCount },
    { data: photos },
    { count: totalRsvps },
    { count: nextEventRsvps },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('photos')
      .select('id, url, alt, events(title, title_pt)')
      .order('created_at', { ascending: false })
      .limit(9),
    supabase.from('rsvps').select('*', { count: 'exact', head: true }),
    nextEvent
      ? supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', nextEvent.id)
      : Promise.resolve({ count: 0, data: null, error: null }),
  ])

  return (
    <>
      <HeroSection />
      <StatsSection memberCount={memberCount || 0} totalRsvps={totalRsvps || 0} />
      {nextEvent && (
        <NextRunPreview event={nextEvent} rsvpCount={nextEventRsvps || 0} />
      )}
      <PhotoGallery photos={(photos as any) || []} />
    </>
  )
}
