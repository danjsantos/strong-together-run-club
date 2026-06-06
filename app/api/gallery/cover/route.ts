import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

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
