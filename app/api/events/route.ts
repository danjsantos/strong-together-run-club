import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

export async function POST(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, title_pt, description, description_pt, date, location, location_pt, google_maps_url, google_maps_embed, is_active } = body

  if (!title?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Use service_role client to bypass RLS for the insert
  const adminDb = createAdminClient()
  const { data, error } = await adminDb.from('events').insert({
    title: title.trim(),
    title_pt: title_pt?.trim() || null,
    description: description?.trim() || null,
    description_pt: description_pt?.trim() || null,
    date,
    location: location.trim(),
    location_pt: location_pt?.trim() || null,
    google_maps_url: google_maps_url?.trim() || null,
    google_maps_embed: google_maps_embed?.trim() || null,
    is_active: is_active ?? true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ event: data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, title, title_pt, description, description_pt, date, location, location_pt, google_maps_url, google_maps_embed, is_active } = body

  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 })

  const adminDb = createAdminClient()
  const { data, error } = await adminDb
    .from('events')
    .update({
      title: title?.trim(),
      title_pt: title_pt?.trim() || null,
      description: description?.trim() || null,
      description_pt: description_pt?.trim() || null,
      date,
      location: location?.trim(),
      location_pt: location_pt?.trim() || null,
      google_maps_url: google_maps_url?.trim() || null,
      google_maps_embed: google_maps_embed?.trim() || null,
      is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ event: data })
}

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
