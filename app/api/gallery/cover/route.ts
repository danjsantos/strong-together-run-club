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

// PUT: Update the cover photo URL for an event (admin only)
export async function PUT(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { event_id, cover_photo_url } = await request.json()
  if (!event_id) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })

  const adminDb = createAdminClient()
  const { data, error } = await adminDb
    .from('events')
    .update({ cover_photo_url: cover_photo_url || null })
    .eq('id', event_id)
    .select('id, cover_photo_url')
    .single()

  if (error) {
    if (error.message.includes('cover_photo_url does not exist')) {
      return NextResponse.json(
        { error: 'Run migration 001_gallery_feature.sql in Supabase to enable cover photos.' },
        { status: 422 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ event: data })
}
