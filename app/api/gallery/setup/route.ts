import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

// POST: Ensure the event-photos bucket exists and schema is up to date (admin only, idempotent)
export async function POST() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminDb = createAdminClient()

  // ── 1. Ensure storage bucket exists ──────────────────────────────────────
  const { data: buckets, error: listError } = await adminDb.storage.listBuckets()
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const bucketExists = (buckets || []).some(b => b.id === 'event-photos')
  if (!bucketExists) {
    const { error: createError } = await adminDb.storage.createBucket('event-photos', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'],
      fileSizeLimit: 10485760, // 10 MB
    })
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })
  }

  // ── 2. Check that sort_order column exists on event_photos ────────────────
  const { error: colCheckError } = await adminDb
    .from('event_photos')
    .select('sort_order')
    .limit(1)

  const sortOrderMissing = colCheckError?.code === '42703'

  return NextResponse.json({
    success: true,
    created: !bucketExists,
    sort_order_missing: sortOrderMissing,
    ...(sortOrderMissing && {
      migration_sql:
        'ALTER TABLE event_photos ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;',
    }),
  })
}
