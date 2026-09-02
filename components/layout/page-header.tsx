import Link from 'next/link'
import { Watermark } from '@/components/brand/logo'
import { revealDelay } from '@/lib/motion'

/* ============================================================
   رأس الصفحات الداخلية
   ------------------------------------------------------------
   مسار تنقّل + لايبل إنجليزي + عنوان كبير، وشفق خفيف في
   الخلفية عشان الصفحة ما تبدأش جافة.
   ============================================================ */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs = [],
  aside,
}: {
  eyebrow: string
  title: string
  description?: string
  breadcrumbs?: { href: string; label: string }[]
  aside?: React.ReactNode
}) {
  return (
    <header className="relative overflow-hidden border-b border-white/8">
      <span
        aria-hidden="true"
        className="aurora aurora-b -right-20 -top-28 h-[320px] w-[320px] opacity-40"
      />
      <Watermark
        className="pointer-events-none absolute -left-12 -top-10 h-[260px] w-auto"
        opacity={0.045}
      />

      <div className="shell relative py-9 lg:py-14">
        {/* --- المسار --- */}
        <nav aria-label="مسار التنقل" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-[11.5px] text-mist">
            <li>
              <Link href="/" className="transition-colors hover:text-brand-300">
                الرئيسية
              </Link>
            </li>
            {breadcrumbs.map((crumb) => (
              <li key={crumb.href} className="flex items-center gap-2">
                <span className="text-white/20">/</span>
                <Link
                  href={crumb.href}
                  className="transition-colors hover:text-brand-300"
                >
                  {crumb.label}
                </Link>
              </li>
            ))}
            <li className="flex items-center gap-2">
              <span className="text-white/20">/</span>
              <span className="line-clamp-1 font-bold text-foam">{title}</span>
            </li>
          </ol>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[58ch]">
            <p data-reveal="" className="tag">
              {eyebrow}
            </p>
            <h1
              data-reveal=""
              style={revealDelay(70)}
              className="display mt-3 text-[clamp(1.6rem,4.6vw,2.6rem)]"
            >
              {title}
            </h1>
            {description && (
              <p
                data-reveal=""
                style={revealDelay(140)}
                className="mt-3.5 text-[13.5px] leading-[2] text-mist"
              >
                {description}
              </p>
            )}
          </div>

          {aside && (
            <div data-reveal="" style={revealDelay(200)} className="shrink-0">
              {aside}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
