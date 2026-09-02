'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { Suspense, useEffect } from 'react'
import { META_PIXEL_ID, isPixelEnabled } from '@/lib/meta/config'

/* ============================================================
   Meta Pixel
   ------------------------------------------------------------
   بيتحمّل بعد ما الصفحة تخلص تحميل عشان ما يبطّأش الموقع،
   وبيسجّل PageView مع كل تنقّل بين الصفحات (Next.js تطبيق
   صفحة واحدة، فالتنقل مش بيعيد تحميل الصفحة).
   ============================================================ */
function PixelRouteTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!isPixelEnabled) return
    if (typeof window === 'undefined' || !window.fbq) return

    /* أول PageView بيتسجّل في السكريبت نفسه، ودي للتنقلات اللي بعدها */
    window.fbq('track', 'PageView')
  }, [pathname, searchParams])

  return null
}

export function MetaPixel() {
  if (!isPixelEnabled) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>

      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>

      <Suspense fallback={null}>
        <PixelRouteTracker />
      </Suspense>
    </>
  )
}
