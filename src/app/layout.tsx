import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { DotProvider } from '@/lib/dot-store'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Dot — Learn by Teaching',
  description: 'Teach a turtle robot algebra and watch it learn',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <DotProvider>{children}</DotProvider>
      </body>
    </html>
  )
}
