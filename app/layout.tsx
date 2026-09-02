import type { Metadata, Viewport } from 'next'
import { Alexandria, Cairo, Space_Grotesk } from 'next/font/google'
import './globals.css'

import { CartDrawer } from '@/components/cart/cart-drawer'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Ticker } from '@/components/layout/ticker'
import { MetaPixel } from '@/components/analytics/meta-pixel'
import { WhatsAppFloat } from '@/components/layout/whatsapp-float'
import { RevealObserver } from '@/components/ui/reveal'
import { site } from '@/data/site'
import { CartProvider } from '@/lib/cart'

/* ------------------------------------------------------------
   الخطوط
   • Cairo      → نص الموقع كله (عربي وإنجليزي)
   • Alexandria → العناوين — هندسي وواضح على الشاشات الصغيرة
   • Space Grotesk → اللايبلات اللاتينية والأرقام
   ------------------------------------------------------------ */
const body = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-body',
  display: 'swap',
})

const display = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const label = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-label',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.nameFull} — ${site.tagline}`,
    template: `%s | ${site.nameFull}`,
  },
  description: site.description,
  applicationName: site.nameFull,
  keywords: [
    'ملابس رجالي',
    'تيشرتات رجالي',
    'ترينجات',
    'عبايات رجالي',
    'متجر ملابس مصر',
    'الدفع عند الاستلام',
    'ATLAS Store',
  ],
  openGraph: {
    title: `${site.nameFull} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.nameFull,
    locale: 'ar_EG',
    type: 'website',
    images: [{ url: site.logoLockup, width: 848, height: 893, alt: site.nameFull }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.nameFull} — ${site.tagline}`,
    description: site.description,
    images: [site.logoLockup],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}

export const viewport: Viewport = {
  themeColor: '#04091a',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

/* بيانات المتجر لجوجل — بتظهر في نتايج البحث */
const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: site.nameFull,
  description: site.description,
  url: site.url,
  logo: `${site.url}${site.logoLockup}`,
  image: `${site.url}${site.logoLockup}`,
  telephone: `+2${site.contact.phone}`,
  email: site.contact.email,
  address: { '@type': 'PostalAddress', addressCountry: 'EG' },
  areaServed: 'EG',
  currenciesAccepted: 'EGP',
  paymentAccepted: 'Cash on Delivery',
  sameAs: [site.social.instagram, site.social.facebook, site.social.tiktok].filter(
    Boolean
  ),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${body.variable} ${display.variable} ${label.variable}`}
    >
      <body className="flex min-h-screen flex-col antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />

        <CartProvider>
          <RevealObserver />

          {/* تخطي للمحتوى — لمستخدمي لوحة المفاتيح */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:right-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-brand-500 focus:px-5 focus:py-2.5 focus:text-[13px] focus:font-bold focus:text-ink"
          >
            تخطي إلى المحتوى
          </a>

          <Ticker />
          <Header />

          <main id="main" className="flex-1">
            {children}
          </main>

          <Footer />
          <CartDrawer />
          <WhatsAppFloat />
          <MetaPixel />
        </CartProvider>
      </body>
    </html>
  )
}
