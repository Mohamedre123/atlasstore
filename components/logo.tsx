import Link from 'next/link'
import { useId } from 'react'
import { site } from '@/data/site'

/* ------------------------------------------------------------
   الحوت مرسوم SVG بخلفية شفافة.
   ملف logo.webp خلفيته بيضا، فكان بيبان كمربع أبيض على أي خلفية
   غامقة (الفوتر، قايمة الموبايل، صفحة الدخول). ده بيحل المشكلة
   وكمان بيبقى أوضح على أي مقاس.
   ------------------------------------------------------------ */
export function WhaleMark({ className = '' }: { className?: string }) {
  const uid = useId().replace(/:/g, '')

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient
          id={`whale-${uid}`}
          x1="30"
          y1="180"
          x2="180"
          y2="45"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0B2542" />
          <stop offset="0.35" stopColor="#123A63" />
          <stop offset="0.68" stopColor="#1E8FC2" />
          <stop offset="1" stopColor="#35E0F2" />
        </linearGradient>
        <linearGradient
          id={`whaleFin-${uid}`}
          x1="90"
          y1="150"
          x2="130"
          y2="105"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0B2542" />
          <stop offset="1" stopColor="#1A5D85" />
        </linearGradient>
        <linearGradient
          id={`whaleBelly-${uid}`}
          x1="70"
          y1="150"
          x2="150"
          y2="80"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.10" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.34" />
        </linearGradient>
      </defs>

      {/* الذيل */}
      <path d="M64 143c-11 5-24 13-33 24 12-2 24-6 34-12z" fill={`url(#whale-${uid})`} />
      <path d="M62 150c-5 10-8 21-7 32 7-8 12-18 15-28z" fill={`url(#whale-${uid})`} />

      {/* الزعنفة */}
      <path
        d="M112 108c-9 10-14 23-15 36 9-8 17-19 23-30z"
        fill={`url(#whaleFin-${uid})`}
      />

      {/* الجسم */}
      <path
        d="M63 148c15-25 33-45 55-64 17-15 35-27 54-33 5-2 9 2 7 7-8 20-20 39-36 56-19 19-42 34-67 42-5 2-11-3-13-8z"
        fill={`url(#whale-${uid})`}
      />

      {/* إضاءة البطن */}
      <path
        d="M76 141c13-20 29-37 47-52 13-11 27-20 41-25-6 16-16 31-29 45-16 17-36 30-59 37z"
        fill={`url(#whaleBelly-${uid})`}
      />

      {/* خط الظهر */}
      <path
        d="M170 55c-9 20-22 39-38 55"
        stroke="#ffffff"
        strokeOpacity="0.42"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

/* ------------------------------------------------------------
   اللوجو + الاسم
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
    sm: { box: 30, title: 'text-[15px]', sub: 'text-[8px]' },
    md: { box: 40, title: 'text-[19px]', sub: 'text-[9px]' },
    lg: { box: 54, title: 'text-[26px]', sub: 'text-[11px]' },
  }[size]

  const content = (
    <span className="group inline-flex items-center gap-2.5">
      <WhaleMark
        className="shrink-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-6 group-hover:scale-110"
        {...{ style: { width: dims.box, height: dims.box } }}
      />

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
   سيلويت الحوت — علامة مائية بلون واحد
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
