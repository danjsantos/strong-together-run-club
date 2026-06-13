import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'

// DELETE /api/admin/checkin — remove a specific check-in by profile_id + event_id
export async function DELETE(request: NextRequest) {
  const adminUser = await requireAdmin()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { profileId, eventId } = await request.json()
  if (!profileId || !eventId) {
    return NextResponse.json({ error: 'Missing profileId or eventId' }, { status: 400 })
  }

  const adminDb = createAdminClient()

  // First, get the profile's current badges and checkin count to potentially revoke first_steps
  const { count: checkinCount } = await adminDb
    .from('checkins')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', profileId)

  const { error } = await adminDb
    .from('checkins')
    .delete()
    .eq('profile_id', profileId)
    .eq('event_id', eventId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // If this was their only check-in, remove first_steps badge
  if ((checkinCount ?? 0) <= 1) {
    const { data: profileRow } = await adminDb
      .from('profiles')
      .select('badges')
      .eq('id', profileId)
      .single()

    if (profileRow?.badges) {
      const updatedBadges = (profileRow.badges as string[]).filter(
        (b: string) => b !== 'first_steps'
      )
      await adminDb
        .from('profiles')
        .update({ badges: updatedBadges })
        .eq('id', profileId)
    }
  }

  return NextResponse.json({ success: true })
}
