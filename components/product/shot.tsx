import Image from 'next/image'
import { Watermark } from '@/components/brand/logo'

/* ============================================================
   صورة المنتج
   ------------------------------------------------------------
   بتقعد على «لوح» فاتح (كلاس .plate) فالمنتج بيبان زي ما هو
   نضيف. لو المنتج لسه من غير صور بنعرض علامة المتجر بدل
   مربع مكسور.
   ============================================================ */
export function Shot({
  src,
  alt,
  sizes = '(max-width: 640px) 62vw, (max-width: 1024px) 40vw, 24vw',
  priority = false,
  className = '',
}: {
  src?: string
  alt: string
  sizes?: string
  priority?: boolean
  className?: string
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
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
