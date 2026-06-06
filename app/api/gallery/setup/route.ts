import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

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
