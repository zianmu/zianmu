import type { Metadata, Viewport } from 'next'
import { Sarabun } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const sarabun = Sarabun({ 
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans'
})

export const metadata: Metadata = {
  title: 'ระบบจัดการผ้าลินิน | Linen Management',
  description: 'ระบบจัดการผ้าลินินสำหรับโรงพยาบาล - Hospital Linen Management System',
}

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className="bg-background">
      <body className={`${sarabun.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
