import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/supabase/is-admin'

function makeSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

export async function POST(request: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Must be logged in to check in' }, { status: 401 })
  }

  const body = await request.json()
  const { eventId } = body

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  // Verify event exists and is active
  const { data: event } = await supabase
    .from('events')
    .select('id, date')
    .eq('id', eventId)
    .eq('is_active', true)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Check-in is only allowed on the day of the event
  const eventDate = new Date(event.date)
  const today = new Date()
  const sameDay =
    eventDate.getFullYear() === today.getFullYear() &&
    eventDate.getMonth() === today.getMonth() &&
    eventDate.getDate() === today.getDate()

  if (!sameDay) {
    return NextResponse.json({ error: 'Check-in is only available on the day of the event' }, { status: 400 })
  }

  // Ensure user has an RSVP for this event
  const { data: rsvp } = await supabase
    .from('rsvps')
    .select('id')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single()

  if (!rsvp) {
    return NextResponse.json({ error: 'You must RSVP before checking in' }, { status: 403 })
  }

  const { error } = await supabase.from('checkins').insert({
    profile_id: user.id,
    event_id: eventId,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already checked in' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const supabase = makeSupabase()
  const eventId = request.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const { data: { user } } = await supabase.auth.getUser()

  // Admin: return full checkin list with profile info
  const adminUser = await requireAdmin()

  if (adminUser) {
    const { data: checkins, error } = await supabase
      .from('checkins')
      .select('profile_id, checked_in_at, profiles(name, display_name)')
      .eq('event_id', eventId)
      .order('checked_in_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ checkins: checkins ?? [] })
  }

  // Regular user: just return their own check-in status
  if (!user) return NextResponse.json({ checkedIn: false, count: 0 })

  const [{ data: checkin }, { count }] = await Promise.all([
    supabase
      .from('checkins')
      .select('id')
      .eq('event_id', eventId)
      .eq('profile_id', user.id)
      .single(),
    supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),
  ])

  return NextResponse.json({ checkedIn: !!checkin, count: count ?? 0 })
}
