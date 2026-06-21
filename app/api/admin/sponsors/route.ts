import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

const COLS = 'id, name, logo_url, link_url, active, sort_order, created_at'

export async function GET() {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('sponsors')
    .select(COLS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sponsors: data ?? [] })
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const db = createAdminClient()
  const { data, error } = await db
    .from('sponsors')
    .insert({
      name,
      logo_url: body.logo_url?.trim() || null,
      link_url: body.link_url?.trim() || null,
      active: typeof body.active === 'boolean' ? body.active : true,
      sort_order: typeof body.sort_order === 'number' ? body.sort_order : 0,
    })
    .select(COLS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sponsor: data }, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const id = body.id
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string') updates.name = body.name.trim()
  if ('logo_url' in body) updates.logo_url = body.logo_url?.trim() || null
  if ('link_url' in body) updates.link_url = body.link_url?.trim() || null
  if (typeof body.active === 'boolean') updates.active = body.active
  if (typeof body.sort_order === 'number') updates.sort_order = body.sort_order

  const db = createAdminClient()
  const { data, error } = await db
    .from('sponsors')
    .update(updates)
    .eq('id', id)
    .select(COLS)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sponsor: data })
}

export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const db = createAdminClient()
  const { error } = await db.from('sponsors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
