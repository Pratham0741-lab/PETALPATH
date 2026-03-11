import type { Metadata, Viewport } from 'next'
import { Nunito, Geist } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { cn } from "@/lib/utils";
import ClickSparkProvider from '@/components/ClickSparkProvider'

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-nunito',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PetalPath — Learning Through Play',
  description: 'A playful early childhood learning platform for children aged 2-6. Interactive video sessions, speaking activities, and adaptive learning.',
  keywords: ['early childhood', 'learning', 'kids', 'education', 'preschool', 'interactive'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B9D',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="font-nunito antialiased">
        <ClickSparkProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ClickSparkProvider>
      </body>
    </html>
  )
}
