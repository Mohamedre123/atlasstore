'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { discountPercent, formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'
import { ProductImage } from './product-image'
import { ArrowLeftIcon } from './icons'

/* ------------------------------------------------------------
   كارت المنتج.
   • الماوس فوق الكارت → الصور بتتبدّل واحدة ورا التانية بتلاشي
     ناعم (كل صور المنتج مش صورتين بس)
   • الكارت بيطلع لفوق شوية والصورة بتكبر ببطء
   • على اللمس: أول لمسة بتبدأ التبديل، والتاني بتفتح المنتج
   ------------------------------------------------------------ */

const SLIDE_MS = 900

export function ProductCard({
  product,
  index = 0,
  priority = false,
}: {
  product: Product
  index?: number
  priority?: boolean
}) {
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)
  const timerRef = useRef<number | null>(null)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.inStock === false
  const colorGroup = product.variants?.find((v) => v.name === 'اللون')

  /* أول ٤ صور بس — كفاية للمعاينة ومش بتتقّل الصفحة */
  const gallery = product.images.slice(0, 4)
  const hasGallery = gallery.length > 1

  /* تبديل الصور طول ما الماوس فوق الكارت */
  useEffect(() => {
    if (!hovering || !hasGallery) return

    timerRef.current = window.setInterval(() => {
      setActive((i) => (i + 1) % gallery.length)
    }, SLIDE_MS)

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [hovering, hasGallery, gallery.length])

  /* الرجوع للصورة الأولى بهدوء بعد ما الماوس يمشي */
  useEffect(() => {
    if (hovering) return
    const t = window.setTimeout(() => setActive(0), 220)
    return () => window.clearTimeout(t)
  }, [hovering])

  return (
    <article
      data-reveal=""
      style={{ '--reveal-delay': `${Math.min(index, 7) * 70}ms` } as React.CSSProperties}
      className="group relative"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onTouchStart={() => setHovering(true)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* --- الصورة --- */}
        <div className="pc__frame relative aspect-[3/4] w-full overflow-hidden bg-white">
          {gallery.map((src, i) => (
            <div
              key={i}
              className="pc__slide absolute inset-0"
              style={{ opacity: i === active ? 1 : 0 }}
              aria-hidden={i !== active}
            >
              <ProductImage
                src={src}
                alt={i === 0 ? product.name : ''}
                seed={product.id + i}
                priority={priority && i === 0}
              />
            </div>
          ))}

          {/* --- الشارات --- */}
          <div className="pointer-events-none absolute inset-x-2.5 top-2.5 flex flex-col items-start gap-1.5">
            {discount !== null && !soldOut && (
              <span className="font-mono bg-sale px-2 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                -{discount}%
              </span>
            )}
            {product.badge && !soldOut && (
              <span className="bg-brand-950 px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                {product.badge}
              </span>
            )}
          </div>

          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/75">
              <span className="font-mono border border-brand-950 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-950">
                Sold Out
              </span>
            </div>
          )}

          {/* --- مؤشر الصور --- */}
          {hasGallery && (
            <div className="pointer-events-none absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5 opacity-0 transition-opacity duration-400 group-hover:opacity-100">
              {gallery.map((_, i) => (
                <span
                  key={i}
                  className={`h-[3px] rounded-full transition-all duration-400 ${
                    i === active ? 'w-5 bg-brand-950' : 'w-2 bg-brand-950/25'
                  }`}
                />
              ))}
            </div>
          )}

          {/* --- شريط سفلي بيطلع من تحت --- */}
          {!soldOut && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full items-center justify-center gap-2 bg-brand-950/95 py-2.5 text-[11.5px] font-bold text-white backdrop-blur transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 lg:flex">
              عرض المنتج
              <ArrowLeftIcon className="h-3.5 w-3.5" />
            </div>
          )}
        </div>

        {/* --- البيانات --- */}
        <div className="pt-3">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.6] text-ink transition-colors duration-300 group-hover:text-brand-700 lg:text-[13.5px]">
            {product.name}
          </h3>

          {product.shortDescription && (
            <p className="mt-1 line-clamp-1 text-[11px] text-muted lg:text-[11.5px]">
              {product.shortDescription}
            </p>
          )}

          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="nums text-[13.5px] font-extrabold text-brand-950 lg:text-[14px]">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="nums text-[11px] text-muted line-through decoration-muted/50">
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
          </div>

          {colorGroup && colorGroup.options.length > 1 && (
            <p className="nums mt-1 text-[10.5px] text-muted">
              {colorGroup.options.length} ألوان متاحة
            </p>
          )}
        </div>
      </Link>
    </article>
  )
}

/* ------------------------------------------------------------
   جريد المنتجات
   ------------------------------------------------------------ */
export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: Product[]
  priorityCount?: number
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-8 sm:gap-x-5 lg:grid-cols-3 lg:gap-y-10 xl:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          priority={i < priorityCount}
        />
      ))}
    </div>
  )
}
