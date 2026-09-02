'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowUpRightIcon } from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'
import { colorOf } from '@/lib/colors'
import { discountPercent, formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'
import { Shot } from './shot'

/* ============================================================
   كارت المنتج
   ------------------------------------------------------------
   • الكارت غامق، والصورة قاعدة على لوح فاتح — الصورة بتبان
     نضيفة والهوية بتفضل غامقة.
   • الماوس فوق الكارت → الصور بتتبدّل واحدة ورا التانية،
     الكارت بيطلع لفوق، وإطار بتدرّج اللوجو بيلمع حواليه،
     ولمعة بتعدّي على الصورة مرة واحدة.
   • على اللمس مفيش هوفر خالص — الضغطة بتفتح المنتج على طول.
   ============================================================ */

const SWAP_MS = 950

export function ProductCard({
  product,
  index = 0,
  priority = false,
  sizes,
}: {
  product: Product
  index?: number
  priority?: boolean
  sizes?: string
}) {
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(false)
  const timer = useRef<number | null>(null)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.inStock === false
  const colors = product.variants?.find((v) => v.name === 'اللون')?.options ?? []

  /* أول ٤ صور كفاية للمعاينة — الباقي بيتحمّل في صفحة المنتج */
  const gallery = product.images.slice(0, 4)
  const many = gallery.length > 1

  useEffect(() => {
    if (!hover || !many) return
    timer.current = window.setInterval(
      () => setActive((i) => (i + 1) % gallery.length),
      SWAP_MS
    )
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [hover, many, gallery.length])

  /* رجوع هادي للصورة الأولى بعد ما الماوس يمشي */
  useEffect(() => {
    if (hover) return
    const t = window.setTimeout(() => setActive(0), 240)
    return () => window.clearTimeout(t)
  }, [hover])

  return (
    <article
      data-reveal=""
      style={revealDelay(Math.min(index, 7) * 65)}
      className="group relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="pcard rim">
          {/* ---------- اللوح والصور ---------- */}
          <div className="plate aspect-[3/4] w-full">
            {gallery.map((src, i) => (
              <div
                key={i}
                aria-hidden={i !== active}
                className="pshot absolute inset-0"
                style={{ opacity: i === active ? 1 : 0 }}
              >
                <Shot
                  src={src}
                  alt={i === 0 ? product.name : ''}
                  sizes={sizes}
                  priority={priority && i === 0}
                />
              </div>
            ))}

            {/* الشارات */}
            <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-col items-start gap-1.5">
              {discount !== null && !soldOut && (
                <span className="chip chip-sale nums">خصم {discount}%</span>
              )}
              {product.badge && !soldOut && (
                <span className="chip chip-dark">{product.badge}</span>
              )}
            </div>

            {/* سهم بيظهر عند الهوفر */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 flex h-9 w-9 translate-y-3 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0 group-hover:opacity-100"
            >
              <ArrowUpRightIcon className="h-4 w-4" />
            </span>

            {soldOut && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/72">
                <span className="chip bg-ink text-white">خلص المخزون</span>
              </div>
            )}

            {/* مؤشر الصور */}
            {many && (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                {gallery.map((_, i) => (
                  <span
                    key={i}
                    className={`h-[3px] rounded-full transition-all duration-500 ${
                      i === active ? 'w-6 bg-ink' : 'w-2 bg-ink/25'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---------- البيانات ---------- */}
          <div className="px-2 pb-1 pt-3.5">
            <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.65] text-foam transition-colors duration-400 group-hover:text-brand-300 lg:text-[13.5px]">
              {product.name}
            </h3>

            {product.shortDescription && (
              <p className="mt-1 line-clamp-1 text-[11px] text-mist">
                {product.shortDescription}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="nums text-[14.5px] font-extrabold text-foam">
                  {formatPrice(product.price)}
                </span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="nums text-[11.5px] text-mist/70 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                )}
              </div>

              {colors.length > 1 && (
                <div className="flex items-center gap-1">
                  {colors.slice(0, 4).map((name) => {
                    const hex = colorOf(name)
                    return hex ? (
                      <span
                        key={name}
                        title={name}
                        className="swatch"
                        style={{ background: hex }}
                      />
                    ) : null
                  })}
                  {colors.length > 4 && (
                    <span dir="ltr" className="nums text-[10.5px] text-mist">
                      +{colors.length - 4}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}

/* ============================================================
   جريد المنتجات — عمودين على الفون، ٤ على الكمبيوتر
   ============================================================ */
export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: Product[]
  priorityCount?: number
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3.5 gap-y-9 sm:gap-x-5 lg:grid-cols-3 lg:gap-y-12 xl:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          priority={i < priorityCount}
          sizes="(max-width: 640px) 46vw, (max-width: 1024px) 31vw, 23vw"
        />
      ))}
    </div>
  )
}

/* ============================================================
   كاروسيل المنتجات
   ------------------------------------------------------------
   الفون → صف واحد بالسحب مع إظهار طرف الكارت اللي بعده
   الكمبيوتر → جريد عادي
   كله CSS، من غير جافاسكريبت، فبيشتغل من أول لحظة.
   ============================================================ */
export function ProductRail({
  products,
  columns = 4,
  priorityCount = 0,
}: {
  products: Product[]
  columns?: 3 | 4
  priorityCount?: number
}) {
  const cols = columns === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'

  return (
    <div
      className={`rail no-bar bleed pb-2 lg:grid ${cols} lg:gap-6 lg:overflow-visible`}
    >
      {products.map((product, i) => (
        <div
          key={product.id}
          className="w-[62vw] sm:w-[40vw] md:w-[31vw] lg:w-auto"
          style={{ scrollSnapAlign: 'start' }}
        >
          <ProductCard
            product={product}
            index={i}
            priority={i < priorityCount}
            sizes="(max-width: 640px) 62vw, (max-width: 1024px) 40vw, 24vw"
          />
        </div>
      ))}
    </div>
  )
}
