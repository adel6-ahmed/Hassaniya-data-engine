// app/layout.tsx
import type { Metadata } from 'next'
import { Cairo, Amiri } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  variable: '--font-cairo',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const amiri = Amiri({
  subsets: ['arabic'],
  variable: '--font-amiri',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'منصة الحسانية | Hassaniya Dataset Platform',
  description: 'منصة بحثية لجمع وإدارة بيانات اللهجة الحسانية',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className={`${cairo.variable} ${amiri.variable} font-cairo antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}