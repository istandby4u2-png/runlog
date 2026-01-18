import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navigation } from '@/components/Navigation'
import { Header } from '@/components/Header'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RunLog - 러닝코스 서비스',
  description: '러닝코스를 등록하고 공유하며, 매일의 러닝 기록을 업로드하세요',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 pb-20 pt-14">
          <Header />
          {children}
          <Navigation />
        </div>
      </body>
    </html>
  )
}
