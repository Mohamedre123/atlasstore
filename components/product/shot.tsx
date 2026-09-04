'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Watermark } from '@/components/brand/logo'

/* ============================================================
   صورة المنتج
   ------------------------------------------------------------
   بتقعد على «لوح» فاتح (كلاس .plate) فالمنتج بيبان زي ما هو
   نضيف. لو المنتج لسه من غير صور — أو الرابط نفسه مكسور، وده
   بيحصل مع صور المورّدين — بنعرض علامة المتجر بدل المربع
   المكسور.
   ============================================================ */
export function Shot({
  src,
  alt,
  sizes = '(max-width: 640px) 62vw, (max-width: 1024px) 40vw, 24vw',
  priority = false,
  className = '',
  unoptimized = false,
}: {
  src?: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
  /** للصور اللي جاية من سيرفر بره — بيوفّر إعادة المعالجة */
  unoptimized?: boolean
}) {
  const [broken, setBroken] = useState(false)
  const img = useRef<HTMLImageElement>(null)

  /**
   * بنسمع لخطأ الصورة من العنصر نفسه مش من رياكت.
   * رياكت بيوصّل onError عن طريق نظام أحداث بيتركّب وقت
   * الهيدريشن، والصور اللي بتقع قبل كده (أو اللي بتتحمّل كسول
   * وتقع بعدين) بيضيع خطأها — جرّبناها على الموقع وما اشتغلتش.
   * المستمع المباشر ده بيمسك الحالتين.
   */
  useEffect(() => {
    setBroken(false)

    const el = img.current
    if (!el) return

    /* وقعت خلاص قبل ما نوصل هنا */
    if (el.complete && el.naturalWidth === 0) {
      setBroken(true)
      return
    }

    const fail = () => setBroken(true)
    el.addEventListener('error', fail)
    return () => el.removeEventListener('error', fail)
  }, [src])

  if (src && !broken) {
    return (
      <Image
        ref={img}
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={unoptimized}
        className={`object-cover ${className}`}
      />
    )
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="absolute inset-0 flex items-center justify-center bg-plate2"
    >
      <Watermark className="h-[52%] w-auto" opacity={0.16} />
    </div>
  )
}
