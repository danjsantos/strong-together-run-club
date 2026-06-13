import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { requireAdmin } from '@/lib/supabase/is-admin'
import { createAdminClient } from '@/lib/supabase/admin'

// Secret key for signing QR tokens — falls back to a build-time constant
// so the app compiles even without the env var set.
const QR_SECRET = new TextEncoder().encode(
  process.env.QR_SECRET || 'strong-together-qr-secret-change-in-production'
)

export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { eventId } = await request.json()
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  // Fetch the event to get its actual date/time
  const adminDb = createAdminClient()
  const { data: event } = await adminDb
    .from('events')
    .select('id, date')
    .eq('id', eventId)
    .single()

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // Token is valid from now until 3 hours after the event start time.
  // This ensures the QR works during the entire run and a bit after.
  const eventDate = new Date(event.date)
  const expiry = new Date(eventDate.getTime() + 3 * 60 * 60 * 1000) // event time + 3 hours

  // If the event is in the past and expiry has already passed, extend to end of today
  const now = new Date()
  const finalExpiry = expiry < now
    ? new Date(now.getTime() + 4 * 60 * 60 * 1000) // 4 hours from now as fallback
    : expiry

  const token = await new SignJWT({ eventId, type: 'checkin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(finalExpiry.getTime() / 1000))
    .sign(QR_SECRET)

  // The QR code will encode a URL that the participant's browser opens
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://strongtogetherrunclub.com'
  const qrUrl = `${baseUrl}/checkin?token=${token}`

  // Return event time info so the UI can display accurate validity window
  return NextResponse.json({ token, qrUrl, eventDate: event.date, expiresAt: finalExpiry.toISOString() })
}
