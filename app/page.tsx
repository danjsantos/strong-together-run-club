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
    { data: eventPhotos },
    { count: totalRsvps },
    { count: nextEventRsvps },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    // Fetch latest photos from event_photos, joining the event title for the caption
    supabase
      .from('event_photos')
      .select('id, photo_url, caption, event_id, events(title, title_pt)')
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

  // Map event_photos shape → PhotoGallery's expected { id, url, alt, events } shape
  // Supabase returns joined relations as arrays; we normalise to a single object.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const photos = ((eventPhotos || []) as any[]).map((p) => ({
    id: p.id as string,
    url: p.photo_url as string,
    alt: (p.caption as string | null) ?? null,
    events: Array.isArray(p.events)
      ? (p.events[0] as { title: string; title_pt: string | null } | undefined) ?? null
      : (p.events as { title: string; title_pt: string | null } | null) ?? null,
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
