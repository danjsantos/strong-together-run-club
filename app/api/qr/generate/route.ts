import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { requireAdmin } from '@/lib/supabase/is-admin'

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

  // Token is valid from 5:00 AM to 2:00 PM on the event day.
  // We encode the eventId and an expiry timestamp inside the JWT.
  // The expiry is set to 2:00 PM today.
  const now = new Date()
  const expiry = new Date(now)
  expiry.setHours(14, 0, 0, 0) // 2:00 PM same day

  // If it's already past 2 PM, set expiry to 2 PM tomorrow
  if (now >= expiry) {
    expiry.setDate(expiry.getDate() + 1)
  }

  const token = await new SignJWT({ eventId, type: 'checkin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiry.getTime() / 1000))
    .sign(QR_SECRET)

  // The QR code will encode a URL that the participant's browser opens
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'https://strongtogetherrunclub.com'
  const qrUrl = `${baseUrl}/checkin?token=${token}`

  return NextResponse.json({ token, qrUrl })
}
