import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/supabase/is-admin'
import { redirect } from 'next/navigation'
import SponsorsAdminClient from './SponsorsAdminClient'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Manage Sponsors' }

export interface Sponsor {
  id: string
  name: string
  logo_url: string | null
  link_url: string | null
  active: boolean
  sort_order: number
  created_at: string
}

export default async function SponsorsAdminPage() {
  const adminUser = await requireAdmin()
  if (!adminUser) redirect('/')

  const db = createAdminClient()
  const { data: sponsors } = await db
    .from('sponsors')
    .select('id, name, logo_url, link_url, active, sort_order, created_at')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  return <SponsorsAdminClient initialSponsors={(sponsors ?? []) as Sponsor[]} />
}
