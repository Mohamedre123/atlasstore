import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeftIcon } from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'
import type { Category } from '@/lib/types'

/* ============================================================
   كروت الأقسام
   ------------------------------------------------------------
   الصورة قاعدة على لوح فاتح وبتكبر بهدوء عند الهوفر، والاسم
   في شريط زجاجي تحت. أول كارت بياخد عمودين على الكمبيوتر
   عشان الشبكة ما تبقاش مملة.
   ============================================================ */
export function CategoryShowcase({
  categories,
  counts,
}: {
  categories: Category[]
  counts: Record<string, number>
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {categories.map((category, i) => {
        const wide = i === 0

        return (
          <Link
            key={category.slug}
            href={`/category/${category.slug}`}
            data-reveal=""
            style={revealDelay(i * 90)}
            className={`group relative ${wide ? 'lg:col-span-2 lg:row-span-1' : ''}`}
          >
            <div className="pcard rim h-full">
              <div
                className={`plate w-full ${
                  wide ? 'aspect-[4/3.4] lg:aspect-[16/10]' : 'aspect-[4/3.4] lg:aspect-[4/4.6]'
                }`}
              >
                {category.image && (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    sizes={
                      wide
                        ? '(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 46vw'
                        : '(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 23vw'
                    }
                    className="pshot object-contain p-6"
                  />
                )}

                <span className="chip chip-dark nums absolute right-3 top-3">
                  {counts[category.slug] ?? 0} قطعة
                </span>

                {/* شريط الاسم */}
                <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-2xl border border-ink/8 bg-white/85 px-4 py-3 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:bg-white">
                  <div className="min-w-0">
                    <h3 className="display truncate text-[16px] font-bold text-ink lg:text-[18px]">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-0.5 truncate text-[11px] text-ink/55">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-all duration-500 group-hover:bg-brand-800">
                    <ArrowLeftIcon className="h-4 w-4 transition-transform duration-500 group-hover:-translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
