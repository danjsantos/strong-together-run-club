import { Suspense } from 'react'
import CheckInPageClient from './CheckInPageClient'

export const metadata = { title: 'Check In' }

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white/50 text-sm">Loading...</div>
      </div>
    }>
      <CheckInPageClient />
    </Suspense>
  )
}
