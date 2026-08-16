'use client'

import Image from 'next/image'
import Link from 'next/link'
import { pluralize } from '@/lib/format'
import type { Category } from '@/lib/types'
import { ArrowLeftIcon } from './icons'

/* ------------------------------------------------------------
   كروت الأقسام — خلفية فاتحة زي المتجر الأصلي.
   • الفون: كاروسيل صف واحد بالسحب
   • الكمبيوتر: ٣ أعمدة
   الصور بتتعرض كاملة (object-contain) عشان ما تتقصّش.
   ------------------------------------------------------------ */
export function CategoryRail({
  categories,
  counts,
}: {
  categories: Category[]
  counts: Record<string, number>
}) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:overflow-visible lg:px-0">
      {categories.map((category, i) => (
        <Link
          key={category.slug}
          href={`/category/${category.slug}`}
          data-reveal=""
          style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
          className="group relative w-[74vw] shrink-0 snap-start sm:w-[48vw] lg:w-auto"
        >
          <div className="pc__frame relative aspect-[4/5] overflow-hidden bg-sand">
            {category.image && (
              <div className="pc__slide absolute inset-0 p-6">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1024px) 74vw, 33vw"
                  className="object-contain p-2"
                />
              </div>
            )}

            {/* شارة العدد */}
            <span className="font-mono absolute right-4 top-4 rounded-full bg-white/85 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-brand-700 backdrop-blur">
              {pluralize(counts[category.slug] ?? 0, 'منتج واحد', 'منتجان', 'منتجات')}
            </span>

            {/* شريط سفلي أبيض */}
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-[12px] bg-white/92 px-4 py-3 shadow-[0_10px_28px_-16px_rgba(14,23,32,0.4)] backdrop-blur transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:bg-white">
              <div className="min-w-0">
                <h3 className="font-display truncate text-[16px] font-extrabold text-ink lg:text-[18px]">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-0.5 truncate text-[11px] text-muted">
                    {category.description}
                  </p>
                )}
              </div>

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sand text-ink transition-all duration-300 group-hover:bg-brand-400">
                <ArrowLeftIcon className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
