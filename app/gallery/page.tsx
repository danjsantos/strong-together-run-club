import type { Metadata } from 'next'
import GalleryHeader from '@/components/gallery/GalleryHeader'
import GalleryPageClient from '@/components/gallery/GalleryPageClient'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Photos from our runs and events — Strong Together Run Club, Myrtle Beach.',
}

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-brand-dark pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <GalleryHeader />
        <GalleryPageClient />
      </div>
    </div>
  )
}
