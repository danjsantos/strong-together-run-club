import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

// Allowed MIME types for the event-photos bucket.
// Includes HEIC and HEIF (iPhone default formats) plus common web formats.
// Note: the client-side upload converts everything to JPEG before uploading,
// so in practice only image/jpeg will arrive — but we keep the full list as
// a safety net for direct uploads.
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/avif',
]

// 50 MB limit — the client converts and compresses before uploading, so
// real uploads will be much smaller, but this avoids surprises for large
// originals on slow connections.
const FILE_SIZE_LIMIT = 52428800

// POST: Ensure the event-photos bucket exists and is correctly configured (admin only, idempotent)
export async function POST() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const adminDb = createAdminClient()

  // ── 1. Ensure storage bucket exists and has correct settings ─────────────
  const { data: buckets, error: listError } = await adminDb.storage.listBuckets()
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 })

  const bucketExists = (buckets || []).some(b => b.id === 'event-photos')

  if (!bucketExists) {
    const { error: createError } = await adminDb.storage.createBucket('event-photos', {
      public: true,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: FILE_SIZE_LIMIT,
    })
    if (createError) return NextResponse.json({ error: createError.message }, { status: 500 })
  } else {
    // Update existing bucket to ensure MIME types and size limit are current.
    // This is a no-op if the settings are already correct.
    await adminDb.storage.updateBucket('event-photos', {
      public: true,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: FILE_SIZE_LIMIT,
    })
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
