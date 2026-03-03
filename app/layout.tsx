import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '야자 관리 시스템',
  description: '2학년 야자 참여 현황 관리',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
  openGraph: {
    title: '야자 관리 시스템',
    description: '2학년 야자 참여 현황 관리',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: '야자 관리 시스템',
    description: '2학년 야자 참여 현황 관리',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
