import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
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

// POST: Ensure the event-photos bucket exists (admin only, idempotent)
export async function POST() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminDb = createAdminClient()

  // Check if bucket already exists
  const { data: buckets, error: listError } = await adminDb.storage.listBuckets()
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const exists = (buckets || []).some(b => b.id === 'event-photos')
  if (exists) return NextResponse.json({ success: true, created: false })

  // Create the public bucket
  const { error: createError } = await adminDb.storage.createBucket('event-photos', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
    fileSizeLimit: 10485760, // 10 MB
  })

  if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })

  return NextResponse.json({ success: true, created: true })
}
