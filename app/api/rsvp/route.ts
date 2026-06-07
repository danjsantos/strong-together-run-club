import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/supabase/is-admin'
import { createAdminClient } from '@/lib/supabase/admin'


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

export async function GET(request: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminUser = await requireAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const eventId = request.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  // Use the service-role client so RLS does not hide RSVPs
  const adminClient = createAdminClient()
  const { data: rsvps, error } = await adminClient
    .from('rsvps')
    .select('name, email, created_at')
    .eq('event_id', eventId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ rsvps })
}

export async function POST(request: NextRequest) {
  const supabase = makeSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Must be logged in to RSVP' }, { status: 401 })
  }

  const body = await request.json()
  const { eventId } = body
  let { name } = body

  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  // Auto-fill name from profile if not provided
  if (!name?.trim()) {
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('display_name, name')
      .eq('id', user.id)
      .single()
    name = profileRow?.display_name || profileRow?.name || user.user_metadata?.full_name || user.email || 'Runner'
  }

  // Check event exists and is upcoming
  const { data: event } = await supabase
    .from('events')
    .select('id, date')
    .eq('id', eventId)
    .eq('is_active', true)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  if (new Date(event.date) < new Date()) {
    return NextResponse.json({ error: 'Event has already passed' }, { status: 400 })
  }

  const { error } = await supabase.from('rsvps').insert({
    event_id: eventId,
    user_id: user.id,
    name: name.trim(),
    email: user.email,
  })

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Already RSVPed' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
