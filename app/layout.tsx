import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans_Arabic, Tajawal } from 'next/font/google'
import './globals.css'

import { CartDrawer } from '@/components/cart-drawer'
import { Footer } from '@/components/footer'
import { Header } from '@/components/header'
import { MetaPixel } from '@/components/meta-pixel'
import { RevealObserver } from '@/components/reveal'
import { WhatsAppFloat } from '@/components/whatsapp-float'
import { site } from '@/data/site'
import { CartProvider } from '@/lib/cart'

/* --- الخطوط: عربي للنص، تجوال للعناوين، مونو للّايبلات اللاتينية --- */
const body = IBM_Plex_Sans_Arabic({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})

const display = Tajawal({
  subsets: ['arabic', 'latin'],
  weight: ['700', '800', '900'],
  variable: '--font-display',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: 'ar_EG',
    type: 'website',
  },
  robots: { index: true, follow: true },
  icons: { icon: site.logo },
}

export const viewport: Viewport = {
  themeColor: '#0A1F3A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${body.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="min-h-screen antialiased">
        <CartProvider>
          <RevealObserver />

          {/* تخطي للمحتوى — لمستخدمي لوحة المفاتيح */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-[100] focus:bg-brand-950 focus:px-4 focus:py-2 focus:text-white"
          >
            تخطي إلى المحتوى
          </a>

          <Header />
          <main id="main">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppFloat />
          <MetaPixel />
        </CartProvider>
      </body>
    </html>
  )
}
