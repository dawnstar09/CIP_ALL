import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '야자 관리 시스템',
  description: '2학년 야자 참여 현황 관리',
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
