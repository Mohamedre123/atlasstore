import Image from 'next/image'
import Link from 'next/link'
import { site } from '@/data/site'

/* ------------------------------------------------------------
   اللوجو + الاسم.
   الصورة بتتقرا من site.logo — بدّل الملف في مجلد public وخلاص.
   ------------------------------------------------------------ */
export function Logo({
  size = 'md',
  invert = false,
  href = '/',
}: {
  size?: 'sm' | 'md' | 'lg'
  /** نسخة بيضا للاستخدام على خلفية كحلي */
  invert?: boolean
  href?: string | null
}) {
  const dims = {
    sm: { box: 28, title: 'text-[15px]', sub: 'text-[8px]' },
    md: { box: 38, title: 'text-[19px]', sub: 'text-[9px]' },
    lg: { box: 52, title: 'text-[26px]', sub: 'text-[11px]' },
  }[size]

  const content = (
    <span className="group inline-flex items-center gap-2.5">
      <span
        className="relative shrink-0 transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105"
        style={{ width: dims.box, height: dims.box }}
      >
        <Image
          src={site.logo}
          alt=""
          fill
          sizes="52px"
          className="object-contain"
          priority
        />
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-[-0.02em] ${dims.title} ${
            invert ? 'text-white' : 'text-brand-950'
          }`}
        >
          ATLAS
        </span>
        <span
          className={`font-mono mt-1 uppercase tracking-[0.34em] ${dims.sub} ${
            invert ? 'text-brand-300' : 'text-brand-700'
          }`}
        >
          Store
        </span>
      </span>
    </span>
  )

  if (!href) return content

  return (
    <Link href={href} aria-label={`${site.name} — الصفحة الرئيسية`}>
      {content}
    </Link>
  )
}

/* ------------------------------------------------------------
   سيلويت الحوت — علامة مائية بتتكرر في أركان الأقسام.
   نفس مسارات اللوجو بلون واحد شفاف.
   ------------------------------------------------------------ */
export function WhaleWatermark({
  className = '',
  opacity = 0.05,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      style={{ opacity }}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M64 143c-11 5-24 13-33 24 12-2 24-6 34-12z" />
      <path d="M62 150c-5 10-8 21-7 32 7-8 12-18 15-28z" />
      <path d="M112 108c-9 10-14 23-15 36 9-8 17-19 23-30z" />
      <path d="M63 148c15-25 33-45 55-64 17-15 35-27 54-33 5-2 9 2 7 7-8 20-20 39-36 56-19 19-42 34-67 42-5 2-11-3-13-8z" />
    </svg>
  )
}
