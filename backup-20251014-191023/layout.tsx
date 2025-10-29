import type { Metadata } from 'next'
import { Caveat } from 'next/font/google'
import './globals.css'
import { DevControlsProvider, DevToolbar } from '@/components/dev/DevToolbar'
import AuthProvider from '@/src/components/AuthProvider'

const caveat = Caveat({ weight: ['600','700'], subsets: ['latin'], variable: '--font-caveat' })

export const metadata: Metadata = {
  title: 'Rizzify - AI Dating Photos That Get Matches | Tinder, Bumble, Hinge',
  description: 'Get 40-80 magazine-style AI dating photos tuned for Tinder, Bumble, and Hinge. Typically 5-15 min delivery. Looks like you. One free rerun.',
  keywords: 'AI dating photos, Tinder photos, Bumble photos, Hinge photos, dating profile pictures, AI headshots, professional dating photos',
  authors: [{ name: 'Rizzify' }],
  creator: 'Rizzify',
  publisher: 'Rizzify',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rizzify.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Rizzify - AI Dating Photos That Get 3x More Matches',
    description: 'Get 40-80 magazine-style AI dating photos tuned for Tinder, Bumble, and Hinge. 5-15 min delivery. Looks exactly like you.',
    url: 'https://rizzify.com',
    siteName: 'Rizzify',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Rizzify AI Dating Photos',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rizzify - AI Dating Photos That Get Matches',
    description: 'Get 40-80 magazine-style AI dating photos for Tinder, Bumble & Hinge. 5-15 min delivery.',
    images: ['/og-image.jpg'],
    creator: '@rizzify',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'google-site-verification-key',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={caveat.variable}>
      <body className="antialiased">
        <AuthProvider>
          <DevControlsProvider>
            {children}
            <DevToolbar />
          </DevControlsProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

