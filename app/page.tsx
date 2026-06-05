import { createClient } from '@/lib/supabase/server'
import HeroSection from '@/components/HeroSection'
import StatsSection from '@/components/StatsSection'
import NextRunPreview from '@/components/NextRunPreview'
import PhotoGallery from '@/components/PhotoGallery'

export default async function HomePage() {
  const supabase = createClient()

  // Step 1: get next active event
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
    { data: rawPhotos, error: photosError },
    { count: totalRsvps },
    { count: nextEventRsvps },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    // Simple query — no join, avoids foreign key resolution issues
    supabase
      .from('event_photos')
      .select('id, photo_url, caption, event_id')
      .order('uploaded_at', { ascending: false })
      .limit(9),
    supabase.from('rsvps').select('*', { count: 'exact', head: true }),
    nextEvent
      ? supabase
          .from('rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', nextEvent.id)
      : Promise.resolve({ count: 0, data: null, error: null }),
  ])

  if (photosError) {
    console.error('[HomePage] event_photos query error:', photosError.message)
  }

  // Fetch event titles for the photos (for hover captions)
  const eventIds = Array.from(new Set((rawPhotos || []).map((p: { event_id: string }) => p.event_id)))
  let eventTitleMap: Record<string, { title: string; title_pt: string | null }> = {}
  if (eventIds.length > 0) {
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, title, title_pt')
      .in('id', eventIds)
    if (eventsData) {
      eventsData.forEach((e: { id: string; title: string; title_pt: string | null }) => {
        eventTitleMap[e.id] = { title: e.title, title_pt: e.title_pt }
      })
    }
  }

  // Map to PhotoGallery's expected shape
  const photos = (rawPhotos || []).map((p: {
    id: string
    photo_url: string
    caption: string | null
    event_id: string
  }) => ({
    id: p.id,
    url: p.photo_url,
    alt: p.caption ?? null,
    events: eventTitleMap[p.event_id] ?? null,
  }))

  return (
    <>
      <HeroSection />
      <StatsSection memberCount={memberCount || 0} totalRsvps={totalRsvps || 0} />
      {nextEvent && (
        <NextRunPreview event={nextEvent} rsvpCount={nextEventRsvps || 0} />
      )}
      <PhotoGallery photos={photos} />
    </>
  )
}
