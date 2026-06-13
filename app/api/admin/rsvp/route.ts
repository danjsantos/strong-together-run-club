import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

// DELETE /api/admin/rsvp — remove a specific RSVP by email + event_id
export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, eventId } = await request.json()
  if (!email || !eventId) {
    return NextResponse.json({ error: 'Missing email or eventId' }, { status: 400 })
  }

  const adminDb = createAdminClient()
  const { error } = await adminDb
    .from('rsvps')
    .delete()
    .eq('email', email)
    .eq('event_id', eventId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
