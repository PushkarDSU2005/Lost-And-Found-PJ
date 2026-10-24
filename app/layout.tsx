import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { Suspense } from 'react'
import './globals.css'
import { Navbar } from '@/components/nav/Navbar'
import { BottomNav } from '@/components/nav/BottomNav'
import { Footer } from '@/components/nav/Footer'
import { ToastProvider } from '@/components/ToastProvider'
import { NotificationBell } from '@/components/nav/NotificationBell'

// ─── Bricolage Grotesque — display font (luggage tag / stamp warmth) ───────────
const fontDisplay = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-display',
  display: 'swap',
  preload: true,
})

// ─── DM Sans — body font (friendly, fast reading) ────────────────────────────
const fontBody = DM_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-body',
  display: 'swap',
  preload: true,
})

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'Campus Lost & Found',
    template: '%s | Campus Lost & Found',
  },
  description:
    'Find your lost items and help others reunite with theirs on campus. Safe, easy, and community-driven lost and found platform.',
  keywords: ['lost', 'found', 'campus', 'items', 'report', 'claim', 'reunite', 'student', 'college'],
  authors: [{ name: 'Campus IT Services' }],
  creator: 'Campus IT Services',
  applicationName: 'Campus Lost & Found',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Lost & Found',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: 'Campus Lost & Found',
    description: 'Find your lost items and help others reunite with theirs on campus.',
    type: 'website',
    siteName: 'Campus Lost & Found',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Campus Lost & Found',
    description: 'Find your lost items and help others reunite with theirs on campus.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#E4572E' },
    { media: '(prefers-color-scheme: dark)',  color: '#B23A17' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

// ─── Root layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body className="min-h-screen font-sans antialiased bg-background text-foreground">
        {/* Skip-to-content link for keyboard / screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>

        <Navbar
          bellSlot={
            <Suspense fallback={null}>
              <NotificationBell />
            </Suspense>
          }
        />

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <Footer />
        <BottomNav />
        <ToastProvider />
      </body>
    </html>
  )
}
