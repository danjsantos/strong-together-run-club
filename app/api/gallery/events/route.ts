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

  // NOTE: cover_photo_url may not exist yet on older deployments.
  // We fetch it separately and fall back gracefully if the column is absent.
  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, title_pt, date, location, location_pt, created_at')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Try to fetch cover_photo_url — silently ignore if the column doesn't exist yet
  let coverMap: Record<string, string | null> = {}
  const { data: coverData } = await supabase
    .from('events')
    .select('id, cover_photo_url')
  if (coverData) {
    coverData.forEach((row: { id: string; cover_photo_url?: string | null }) => {
      coverMap[row.id] = row.cover_photo_url ?? null
    })
  }

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
    cover_photo_url: coverMap[e.id] ?? null,
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

  // Insert only the columns that are guaranteed to exist on all deployments.
  // cover_photo_url is added via migration; we skip it here to avoid errors
  // on databases that haven't run the migration yet.
  const { data: inserted, error: insertError } = await supabase
    .from('events')
    .insert({
      title,
      date: dateValue,
      location,
      is_active: false, // gallery-only events don't appear in the next-run feed
    })
    .select('id, title, title_pt, date, location, location_pt, created_at')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Try to read cover_photo_url if the column exists
  let cover_photo_url: string | null = null
  const { data: coverRow } = await supabase
    .from('events')
    .select('cover_photo_url')
    .eq('id', inserted.id)
    .single()
  if (coverRow) cover_photo_url = (coverRow as { cover_photo_url?: string | null }).cover_photo_url ?? null

  return NextResponse.json(
    { event: { ...inserted, cover_photo_url, photo_count: 0 } },
    { status: 201 }
  )
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
