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

// GET: List photos for a specific event (public)
export async function GET(request: NextRequest) {
  const supabase = makeSupabase()
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
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { event_id, photo_url, caption } = body

  if (!event_id || !photo_url) {
    return NextResponse.json({ error: 'Missing required fields: event_id, photo_url' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('event_photos')
    .insert({ event_id, photo_url, caption: caption || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ photo: data }, { status: 201 })
}

// DELETE: Delete a photo record and storage object (admin only)
export async function DELETE(request: NextRequest) {
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, photo_url } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing photo id' }, { status: 400 })

  // Delete from storage if URL is from our bucket
  if (photo_url) {
    try {
      const url = new URL(photo_url)
      const pathParts = url.pathname.split('/event-photos/')
      if (pathParts.length > 1) {
        const storagePath = pathParts[1]
        await supabase.storage.from('event-photos').remove([storagePath])
      }
    } catch {
      // Ignore storage deletion errors — proceed with DB deletion
    }
  }

  const { error } = await supabase.from('event_photos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
