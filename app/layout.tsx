import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { LanguageProvider } from '@/components/providers/LanguageProvider'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import NewsVideoModal from '@/components/NewsVideoModal'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.strongtogetherrunclub.com'),
  title: {
    default: 'Strong Together Run Club',
    template: '%s | Strong Together Run Club',
  },
  description: "Myrtle Beach's most welcoming running community. All paces, all ages, all welcome.",
  keywords: ['running club', 'Myrtle Beach', 'fitness', 'community', 'run'],
  openGraph: {
    title: 'Strong Together Run Club',
    description: "Myrtle Beach's most welcoming running community.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.strongtogetherrunclub.com',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strong Together Run Club',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <LanguageProvider>
          <Header />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <NewsVideoModal />
        </LanguageProvider>
      </body>
    </html>
  )
}
