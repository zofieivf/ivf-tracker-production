import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { AuthWrapper } from '@/components/auth/auth-wrapper'
import './globals.css'

export const metadata: Metadata = {
  title: 'IVF Tracker',
  description: 'Track your IVF journey with detailed cycle management, medication schedules, and outcome analysis',
  generator: 'Next.js',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </body>
    </html>
  )
}
