import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

/** Anon client — used only for public reads */
function makeAnonSupabase() {
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

// GET: List all gallery events with photo counts (public — anon key is fine for reads)
export async function GET() {
  const supabase = makeAnonSupabase()

  const { data: events, error } = await supabase
    .from('events')
    .select('id, title, title_pt, date, location, location_pt, created_at')
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Try to fetch cover_photo_url — silently ignore if the column doesn't exist yet
  const coverMap: Record<string, string | null> = {}
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
export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const title = (body.title || body.name || '').trim()
  const date = body.date
  const location = (body.location || '').trim()

  if (!title || !date || !location) {
    return NextResponse.json(
      { error: 'Missing required fields: title, date, location' },
      { status: 400 }
    )
  }

  const dateValue = date.includes('T') ? date : `${date}T00:00:00Z`

  // Use service_role client to bypass the "insert with check (false)" RLS policy
  const adminDb = createAdminClient()
  const { data: inserted, error: insertError } = await adminDb
    .from('events')
    .insert({ title, date: dateValue, location, is_active: false })
    .select('id, title, title_pt, date, location, location_pt, created_at')
    .single()

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  // Try to read cover_photo_url if the column exists
  let cover_photo_url: string | null = null
  const { data: coverRow } = await adminDb
    .from('events')
    .select('cover_photo_url')
    .eq('id', inserted.id)
    .single()
  if (coverRow) {
    cover_photo_url = (coverRow as { cover_photo_url?: string | null }).cover_photo_url ?? null
  }

  return NextResponse.json(
    { event: { ...inserted, cover_photo_url, photo_count: 0 } },
    { status: 201 }
  )
}

// DELETE: Delete a gallery event (admin only)
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 })

  const adminDb = createAdminClient()
  const { error } = await adminDb.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
