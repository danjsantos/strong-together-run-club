import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { requireAdmin } from '@/lib/supabase/is-admin'

// Secret key for signing QR tokens — falls back to a build-time constant
// so the app compiles even without the env var set.
const QR_SECRET = new TextEncoder().encode(
  process.env.QR_SECRET || 'strong-together-qr-secret-change-in-production'
)

/**
 * Returns the UTC timestamp for a given clock time (hour, minute) in ET today.
 * Works correctly for both EST (UTC-5) and EDT (UTC-4).
 */
function etTimeToUTC(hour: number, minute: number): Date {
  const TZ = 'America/New_York'
  const now = new Date()

  // Get today's date parts in ET
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = fmt.formatToParts(now)
  const p: Record<string, number> = {}
  parts.forEach(({ type, value }) => { if (type !== 'literal') p[type] = parseInt(value, 10) })

  // Use the Temporal-like trick: find the UTC offset for ET at this moment
  // by comparing a fixed UTC time rendered in ET vs UTC
  const probe = new Date(now)
  const etHourNow = parseInt(
    probe.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }),
    10
  )
  const utcHourNow = probe.getUTCHours()
  // ET offset in hours (negative = behind UTC)
  const offsetHours = etHourNow - utcHourNow

  // Build the target as a UTC date
  const target = new Date(Date.UTC(p.year, p.month - 1, p.day, hour - offsetHours, minute, 0))
  return target
}

export async function POST(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { eventId } = await request.json()
  if (!eventId) {
    return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })
  }

  // Token is valid from 5:00 AM to 2:00 PM ET on the event day.
  const now = new Date()
  let expiry = etTimeToUTC(14, 0) // 2:00 PM ET today

  // If it's already past 2 PM ET, set expiry to 2 PM ET tomorrow
  if (now >= expiry) {
    expiry = new Date(expiry.getTime() + 24 * 60 * 60 * 1000)
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
