import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

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

// GET: List photos for a specific event (public — anon key is fine)
export async function GET(request: NextRequest) {
  const supabase = makeAnonSupabase()
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  // Try fetching with sort_order first; fall back to uploaded_at if the column doesn't exist yet
  let { data, error } = await supabase
    .from('event_photos')
    .select('id, event_id, photo_url, caption, uploaded_at, sort_order')
    .eq('event_id', eventId)
    .order('sort_order', { ascending: true })
    .order('uploaded_at', { ascending: true })

  if (error && (error.code === '42703' || error.message?.includes('sort_order'))) {
    // sort_order column not yet migrated — fall back to uploaded_at ordering
    const fallback = await supabase
      .from('event_photos')
      .select('id, event_id, photo_url, caption, uploaded_at')
      .eq('event_id', eventId)
      .order('uploaded_at', { ascending: true })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = (fallback.data as any) ?? null
    error = fallback.error
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ photos: data || [] })
}

// POST: Save photo metadata after upload (admin only)
export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { event_id, photo_url, caption } = body

  if (!event_id || !photo_url) {
    return NextResponse.json({ error: 'Missing required fields: event_id, photo_url' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  // Try inserting with sort_order first. If the column doesn't exist yet,
  // fall back to inserting without it — this makes the upload work regardless
  // of whether the migration has been applied.
  let insertError: { code?: string; message?: string } | null = null
  let insertData = null

  // Attempt 1: with sort_order
  try {
    const { data: existing } = await adminDb
      .from('event_photos')
      .select('sort_order')
      .eq('event_id', event_id)
      .order('sort_order', { ascending: false })
      .limit(1)

    const nextSortOrder = existing && existing.length > 0
      ? (existing[0].sort_order ?? 0) + 1
      : 0

    const result = await adminDb
      .from('event_photos')
      .insert({ event_id, photo_url, caption: caption || null, sort_order: nextSortOrder })
      .select()
      .single()

    insertData = result.data
    insertError = result.error
  } catch {
    insertError = { message: 'Unexpected error on insert with sort_order' }
  }

  // Attempt 2: without sort_order (column missing)
  if (insertError && (insertError.code === '42703' || insertError.message?.includes('sort_order'))) {
    const result = await adminDb
      .from('event_photos')
      .insert({ event_id, photo_url, caption: caption || null })
      .select()
      .single()

    insertData = result.data
    insertError = result.error
  }

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

  return NextResponse.json({ photo: insertData }, { status: 201 })
}

// PATCH: Reorder photos for an event (admin only)
export async function PATCH(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { orderedIds } = body as { orderedIds: string[] }

  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return NextResponse.json({ error: 'Missing or invalid orderedIds' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  const updates = orderedIds.map((id, index) =>
    adminDb
      .from('event_photos')
      .update({ sort_order: index })
      .eq('id', id)
  )

  const results = await Promise.all(updates)
  const failed = results.find(r => r.error)
  if (failed?.error) {
    return NextResponse.json({ error: failed.error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE: Delete a photo record and its storage object (admin only)
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, photo_url } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing photo id' }, { status: 400 })

  const adminDb = createAdminClient()

  if (photo_url) {
    try {
      const url = new URL(photo_url)
      const marker = '/object/public/event-photos/'
      const idx = url.pathname.indexOf(marker)
      if (idx !== -1) {
        const storagePath = decodeURIComponent(url.pathname.slice(idx + marker.length))
        await adminDb.storage.from('event-photos').remove([storagePath])
      }
    } catch {
      // Ignore storage errors — proceed with DB deletion
    }
  }

  const { error } = await adminDb.from('event_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
