import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNav from './AdminNav'


export const metadata = { title: 'Admin' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirectTo=/admin')

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  if (!adminEmails.includes(user.email || '')) redirect('/')

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <AdminNav />
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
