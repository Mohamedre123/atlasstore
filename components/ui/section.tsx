import Link from 'next/link'
import { ArrowLeftIcon } from './icons'
import { revealDelay } from '@/lib/motion'

/* ============================================================
   عنوان القسم
   ------------------------------------------------------------
   رقم بخط لاتيني رفيع + لايبل إنجليزي + عنوان عربي كبير،
   وتحته خط بيتمد من اليمين للشمال أول ما القسم يدخل الشاشة.
   ============================================================ */
export function SectionHead({
  index,
  eyebrow,
  title,
  description,
  href,
  hrefLabel = 'عرض الكل',
  align = 'start',
  className = '',
}: {
  index?: string
  eyebrow: string
  title: React.ReactNode
  description?: string
  href?: string
  hrefLabel?: string
  align?: 'start' | 'center'
  className?: string
}) {
  const centered = align === 'center'

  return (
    <div className={`mb-8 lg:mb-12 ${className}`}>
      <div
        className={`flex flex-wrap items-end gap-x-6 gap-y-4 ${
          centered ? 'justify-center text-center' : 'justify-between'
        }`}
      >
        <div className={centered ? 'mx-auto max-w-[62ch]' : 'max-w-[62ch]'}>
          <div
            data-reveal=""
            className={`flex items-center gap-3 ${centered ? 'justify-center' : ''}`}
          >
            {index && (
              <span className="font-[family-name:var(--font-label)] text-[10.5px] font-semibold text-brand-500/80">
                {index}
              </span>
            )}
            <span className="tag">{eyebrow}</span>
          </div>

          <h2
            data-reveal=""
            style={revealDelay(70)}
            className="display mt-3 text-[clamp(1.5rem,4.4vw,2.5rem)]"
          >
            {title}
          </h2>

          {description && (
            <p
              data-reveal=""
              style={revealDelay(140)}
              className="mt-3 text-[13.5px] leading-[1.95] text-mist"
            >
              {description}
            </p>
          )}
        </div>

        {href && (
          <Link
            href={href}
            data-reveal=""
            style={revealDelay(180)}
            className="btn btn-ghost btn-sm shrink-0"
          >
            <span>{hrefLabel}</span>
            <ArrowLeftIcon className="btn-arrow h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div
        data-reveal="line"
        style={revealDelay(220)}
        className="hairline mt-7"
        aria-hidden="true"
      />
    </div>
  )
}

/* ------------------------------------------------------------
   غلاف قسم بمسافات موحّدة
   ------------------------------------------------------------ */
export function Band({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`shell band ${className}`}>
      {children}
    </section>
  )
}
