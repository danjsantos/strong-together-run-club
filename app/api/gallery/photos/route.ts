import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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

async function requireAdmin() {
  const supabase = makeAnonSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (!adminEmails.includes(user.email || '')) return null
  return user
}

// GET: List photos for a specific event (public — anon key is fine)
export async function GET(request: NextRequest) {
  const supabase = makeAnonSupabase()
  const { searchParams } = new URL(request.url)
  const eventId = searchParams.get('eventId')

  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const { data, error } = await supabase
    .from('event_photos')
    .select('id, event_id, photo_url, caption, uploaded_at')
    .eq('event_id', eventId)
    .order('uploaded_at', { ascending: true })

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

  // Use service_role to bypass the "insert with check (false)" RLS policy
  const adminDb = createAdminClient()
  const { data, error } = await adminDb
    .from('event_photos')
    .insert({ event_id, photo_url, caption: caption || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ photo: data }, { status: 201 })
}

// DELETE: Delete a photo record and its storage object (admin only)
export async function DELETE(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, photo_url } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing photo id' }, { status: 400 })

  const adminDb = createAdminClient()

  // Delete from storage first (best-effort)
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

  // Delete the DB record using service_role to bypass RLS
  const { error } = await adminDb.from('event_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
