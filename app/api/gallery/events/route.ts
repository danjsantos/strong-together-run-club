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
  const photoCounts: Record<string, number> = {}
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
// Accepts: { title, date (YYYY-MM-DD), location }
export async function POST(request: NextRequest) {
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  // Accept both `title` and legacy `name` from the client form
  const title = (body.title || body.name || '').trim()
  const date = body.date
  const location = (body.location || '').trim()

  if (!title || !date || !location) {
    return NextResponse.json(
      { error: 'Missing required fields: title, date, location' },
      { status: 400 }
    )
  }

  // The events table uses timestamptz for `date`.
  // If the client sends a plain date string (YYYY-MM-DD), append midnight UTC.
  const dateValue = date.includes('T') ? date : `${date}T00:00:00Z`

  const { data, error } = await supabase
    .from('events')
    .insert({
      title,
      date: dateValue,
      location,
      is_active: false, // gallery-only events don't appear in the next-run feed
    })
    .select('id, title, title_pt, date, location, location_pt, cover_photo_url, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ event: { ...data, photo_count: 0 } }, { status: 201 })
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
