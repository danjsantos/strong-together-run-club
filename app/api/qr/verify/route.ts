import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const QR_SECRET = new TextEncoder().encode(
  process.env.QR_SECRET || 'strong-together-qr-secret-change-in-production'
)

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

  const { token } = await request.json()
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  // Verify the JWT — expiry is enforced by jose automatically
  let payload: { eventId: string; type: string }
  try {
    const result = await jwtVerify(token, QR_SECRET)
    payload = result.payload as { eventId: string; type: string }
  } catch {
    return NextResponse.json({ error: 'Invalid or expired QR code' }, { status: 400 })
  }

  if (payload.type !== 'checkin' || !payload.eventId) {
    return NextResponse.json({ error: 'Invalid QR code type' }, { status: 400 })
  }

  const { eventId } = payload

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

  // Check-in is only allowed on the day of the event (ET timezone)
  const TZ = 'America/New_York'
  const eventDate = new Date(event.date)
  const today = new Date()

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-CA', { timeZone: TZ }) // 'YYYY-MM-DD'

  const sameDay = fmtDate(eventDate) === fmtDate(today)

  if (!sameDay) {
    return NextResponse.json({ error: 'Check-in is only available on the day of the event' }, { status: 400 })
  }

  // Insert check-in
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

  // Award badges after check-in
  await awardBadges(supabase, user.id)

  return NextResponse.json({ success: true }, { status: 201 })
}

async function awardBadges(supabase: ReturnType<typeof makeSupabase>, userId: string) {
  const BADGE_MILESTONES = [
    { id: 'first_steps', threshold: 1 },
    { id: 'consistent_runner', threshold: 5 },
    { id: 'strong_together', threshold: 10 },
    { id: 'dedicated', threshold: 25 },
    { id: 'community_champion', threshold: 50 },
  ]

  const { count } = await supabase
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', userId)

  const totalCheckins = count ?? 0

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('badges')
    .eq('id', userId)
    .single()

  const currentBadges: string[] = Array.isArray(profileRow?.badges) ? profileRow.badges : []
  const newBadges = BADGE_MILESTONES
    .filter((b) => totalCheckins >= b.threshold && !currentBadges.includes(b.id))
    .map((b) => b.id)

  if (newBadges.length > 0) {
    await supabase
      .from('profiles')
      .update({ badges: [...currentBadges, ...newBadges] })
      .eq('id', userId)
  }
}
