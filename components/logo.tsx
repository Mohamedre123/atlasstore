import Image from 'next/image'
import Link from 'next/link'
import { site } from '@/data/site'

/* ------------------------------------------------------------
   لوجو المتجر الأصلي (حوت بخلفية شفافة).
   بيعوم لفوق وتحت بحركة هادية عشان الموقع يبان حيّ.
   ------------------------------------------------------------ */
export function Logo({
  size = 'md',
  invert = false,
  href = '/',
}: {
  size?: 'sm' | 'md' | 'lg'
  /** نسخة فاتحة للاستخدام على خلفية كحلي */
  invert?: boolean
  href?: string | null
}) {
  const dims = {
    sm: { box: 32, title: 'text-[15px]', sub: 'text-[8px]' },
    md: { box: 42, title: 'text-[19px]', sub: 'text-[9px]' },
    lg: { box: 58, title: 'text-[26px]', sub: 'text-[11px]' },
  }[size]

  const content = (
    <span className="group inline-flex items-center gap-2.5">
      <span
        className="logo-float relative shrink-0"
        style={{ width: dims.box, height: dims.box }}
      >
        <Image
          src={site.logo}
          alt=""
          fill
          sizes="58px"
          priority
          className="object-contain"
        />
      </span>

      <span className="flex flex-col leading-none">
        <span
          className={`font-display font-extrabold tracking-[-0.02em] ${dims.title} ${
            invert ? 'text-white' : 'text-ink'
          }`}
        >
          ATLAS<span className="text-brand-500">s</span>
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
   اللوجو كعلامة مائية في خلفيات الأقسام
   ------------------------------------------------------------ */
export function WhaleWatermark({
  className = '',
  opacity = 0.05,
}: {
  className?: string
  opacity?: number
}) {
  return (
    <span
      className={`pointer-events-none block ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      <Image
        src={site.logo}
        alt=""
        width={400}
        height={400}
        className="h-full w-full object-contain"
      />
    </span>
  )
}
