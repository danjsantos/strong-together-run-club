import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

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

async function requireAdmin(supabase: ReturnType<typeof makeSupabase>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (!adminEmails.includes(user.email || '')) return null
  return user
}

// GET: List all gallery events with photo counts (public)
export async function GET() {
  const supabase = makeSupabase()

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, title_pt, date, location, location_pt, cover_photo_url, created_at')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get photo counts per event
  const eventIds = (events || []).map(e => e.id)
  let photoCounts: Record<string, number> = {}
  if (eventIds.length > 0) {
    const { data: photoData } = await supabase
      .from('event_photos')
      .select('event_id')
      .in('event_id', eventIds)
    if (photoData) {
      photoData.forEach(p => {
        photoCounts[p.event_id] = (photoCounts[p.event_id] || 0) + 1
      })
    }
  }

  const eventsWithCounts = (events || []).map(e => ({
    ...e,
    photo_count: photoCounts[e.id] || 0,
  }))

  return NextResponse.json({ events: eventsWithCounts })
}

// POST: Create a new gallery event (admin only)
export async function POST(request: NextRequest) {
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { name, date, location } = body

  if (!name?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: 'Missing required fields: name, date, location' }, { status: 400 })
  }

  // We store gallery events in the existing events table with a name mapping
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: name.trim(),
      date,
      location: location.trim(),
      is_active: false, // gallery-only events don't show in next-run
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ event: data }, { status: 201 })
}

// DELETE: Delete a gallery event (admin only)
export async function DELETE(request: NextRequest) {
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 })

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
