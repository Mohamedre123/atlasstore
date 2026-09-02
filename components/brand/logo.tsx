import Image from 'next/image'
import Link from 'next/link'
import { site } from '@/data/site'

/* ============================================================
   لوجو ATLAS
   ------------------------------------------------------------
   العلامة نفسها ذيل حوت بيتحوّل لحرف A بتدرّج من الكحلي
   العميق للسماوي المضيء. بنعرضها كصورة PNG بخلفية شفافة عشان
   التدرّج يفضل بنفس تفاصيله بالظبط زي الملف الأصلي.

   variant:
   • mark  → العلامة لوحدها (الهيدر على الفون، الأيقونات)
   • full  → العلامة + كلمة ATLAS مكتوبة جنبها (الافتراضي)
   • stack → العلامة فوق والكلمة تحت (الفوتر وصفحة الدخول)
   ============================================================ */

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const SIZES: Record<Size, { mark: number; word: string; sub: string }> = {
  xs: { mark: 26, word: 'text-[14px]', sub: 'text-[7px]' },
  sm: { mark: 32, word: 'text-[17px]', sub: 'text-[8px]' },
  md: { mark: 40, word: 'text-[21px]', sub: 'text-[9px]' },
  lg: { mark: 56, word: 'text-[28px]', sub: 'text-[10px]' },
  xl: { mark: 84, word: 'text-[40px]', sub: 'text-[12px]' },
}

export function Logo({
  size = 'md',
  variant = 'full',
  href = '/',
  className = '',
}: {
  size?: Size
  variant?: 'mark' | 'full' | 'stack'
  href?: string | null
  className?: string
}) {
  const s = SIZES[size]

  const mark = (
    <span
      className="relative block shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.08] group-hover:-rotate-3"
      style={{ width: s.mark, height: s.mark }}
    >
      <Image
        src={site.logo}
        alt=""
        fill
        sizes="96px"
        priority
        className="object-contain"
      />
    </span>
  )

  const word = (
    <span className="flex flex-col leading-none">
      <span
        className={`display font-bold tracking-[0.16em] text-foam ${s.word}`}
        style={{ letterSpacing: '0.16em' }}
      >
        ATLAS
      </span>
      <span
        className={`mt-1.5 font-[family-name:var(--font-label)] uppercase tracking-[0.42em] text-brand-300/70 ${s.sub}`}
      >
        Store
      </span>
    </span>
  )

  const content =
    variant === 'mark' ? (
      <span className={`group inline-flex ${className}`}>{mark}</span>
    ) : variant === 'stack' ? (
      <span className={`group inline-flex flex-col items-center gap-3 ${className}`}>
        {mark}
        {word}
      </span>
    ) : (
      <span className={`group inline-flex items-center gap-2.5 ${className}`}>
        {mark}
        {word}
      </span>
    )

  if (!href) return content

  return (
    <Link href={href} aria-label={`${site.nameFull} — الصفحة الرئيسية`}>
      {content}
    </Link>
  )
}

/* ------------------------------------------------------------
   العلامة كخلفية مائية — بتدّي عمق للأقسام من غير ما تشوّش
   ------------------------------------------------------------ */
export function Watermark({
  className = '',
  opacity = 0.06,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none block ${className}`}
      style={{ opacity }}
    >
      <Image
        src={site.logo}
        alt=""
        width={520}
        height={520}
        className="h-full w-full object-contain"
      />
    </span>
  )
}
