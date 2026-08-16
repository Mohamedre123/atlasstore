'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Category } from '@/lib/types'
import { ArrowLeftIcon } from './icons'
import { pluralize } from '@/lib/format'

/* ------------------------------------------------------------
   كروت الأقسام.
   • الفون: كاروسيل صف واحد بالسحب
   • الكمبيوتر: ٣ أعمدة
   الصور بتتعرض كاملة (object-contain) على خلفية كحلي عشان صور
   المنتجات ماتتقصّش.
   ------------------------------------------------------------ */
export function CategoryRail({
  categories,
  counts,
}: {
  categories: Category[]
  counts: Record<string, number>
}) {
  return (
    <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:px-0">
      {categories.map((category, i) => (
        <Link
          key={category.slug}
          href={`/category/${category.slug}`}
          data-reveal=""
          style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
          className="cat-card group relative w-[72vw] shrink-0 snap-start overflow-hidden rounded-[4px] bg-brand-950 sm:w-[46vw] lg:w-auto"
        >
          <div className="relative aspect-[4/5]">
            {category.image && (
              <div className="absolute inset-0 p-4 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 1024px) 72vw, 33vw"
                  className="object-contain p-2"
                />
              </div>
            )}

            {/* تعتيم سفلي عشان النص يبان */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-950 via-brand-950/70 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 lg:p-5">
              <div>
                <p className="font-mono mb-1 text-[9px] uppercase tracking-[0.18em] text-brand-300">
                  {String(i + 1).padStart(2, '0')} —{' '}
                  {pluralize(counts[category.slug] ?? 0, 'منتج واحد', 'منتجان', 'منتجات')}
                </p>
                <h3 className="font-display text-[17px] font-extrabold text-white lg:text-[20px]">
                  {category.name}
                </h3>
                {category.description && (
                  <p className="mt-1 hidden max-w-[30ch] text-[11.5px] leading-relaxed text-white/60 lg:block">
                    {category.description}
                  </p>
                )}
              </div>

              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[3px] border border-white/30 text-white transition-all duration-300 group-hover:border-brand-400 group-hover:bg-brand-400 group-hover:text-brand-950">
                <ArrowLeftIcon className="h-4 w-4" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
