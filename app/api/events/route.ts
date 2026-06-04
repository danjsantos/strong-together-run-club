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

export async function POST(request: NextRequest) {
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, title_pt, description, description_pt, date, location, location_pt, google_maps_url, google_maps_embed, is_active } = body

  if (!title?.trim() || !date || !location?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase.from('events').insert({
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
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, title, title_pt, description, description_pt, date, location, location_pt, google_maps_url, google_maps_embed, is_active } = body

  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 })

  const { data, error } = await supabase
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
  const supabase = makeSupabase()
  const user = await requireAdmin(supabase)
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 })

  const { error } = await supabase.from('events').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
