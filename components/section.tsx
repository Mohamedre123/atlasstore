import Link from 'next/link'
import { ArrowLeftIcon } from './icons'
import { ProductCard } from './product-card'
import type { Product } from '@/lib/types'

/* ------------------------------------------------------------
   عنوان القسم — رقم بخط مونو + لايبل لاتيني + عنوان عربي
   ------------------------------------------------------------ */
export function SectionHeading({
  index,
  eyebrow,
  title,
  description,
  href,
  hrefLabel = 'عرض الكل',
}: {
  index: string
  eyebrow: string
  title: string
  description?: string
  href?: string
  hrefLabel?: string
}) {
  return (
    <div
      data-reveal=""
      className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-4 lg:mb-8 lg:pb-5"
    >
      <div className="flex items-baseline gap-3 sm:gap-4">
        <span className="font-mono shrink-0 text-[10px] text-brand-600">{index}</span>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="display mt-1.5 text-[clamp(1.15rem,3.4vw,1.65rem)]">{title}</h2>
          {description && (
            <p className="mt-1.5 max-w-[48ch] text-[12.5px] leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      {href && (
        <Link
          href={href}
          className="link-underline group flex shrink-0 items-center gap-1.5 text-[12px] font-bold text-brand-950"
        >
          {hrefLabel}
          <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
        </Link>
      )}
    </div>
  )
}

/* ------------------------------------------------------------
   غلاف قسم بمسافات موحّدة
   ------------------------------------------------------------ */
export function Section({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`container-x py-12 lg:py-16 ${className}`}>{children}</section>
  )
}

/* ------------------------------------------------------------
   عرض المنتجات:
   • الموبايل  → كاروسيل صف واحد بالسحب يمين/شمال مع إظهار طرف الكارت التالي
   • الديسكتوب → جريد عادي
   كله CSS خالص من غير جافاسكريبت، فبيشتغل فورًا وما بيتقلش الصفحة.
   ------------------------------------------------------------ */
export function ProductCarousel({
  products,
  columns = 4,
  priorityCount = 0,
}: {
  products: Product[]
  columns?: 3 | 4
  priorityCount?: number
}) {
  const gridCols = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'

  return (
    <div className="relative">
      <div
        className={`no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-1
                    sm:-mx-8 sm:px-8
                    lg:mx-0 lg:grid ${gridCols} lg:gap-6 lg:overflow-visible lg:px-0`}
      >
        {products.map((product, i) => (
          <div
            key={product.id}
            className="w-[63vw] shrink-0 snap-start sm:w-[42vw] md:w-[32vw] lg:w-auto lg:shrink"
          >
            <ProductCard product={product} index={i} priority={i < priorityCount} />
          </div>
        ))}
      </div>

      {/* تلميح السحب — موبايل فقط */}
      <p className="font-mono mt-3 flex items-center gap-1.5 text-[9.5px] uppercase tracking-[0.18em] text-muted lg:hidden">
        <ArrowLeftIcon className="h-3 w-3" />
        اسحب لعرض المزيد
      </p>
    </div>
  )
}
