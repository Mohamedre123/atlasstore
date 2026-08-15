'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/lib/cart'
import { discountPercent, formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'
import { ProductImage } from './product-image'
import { ArrowLeftIcon, CheckIcon, PlusIcon } from './icons'

/* ------------------------------------------------------------
   كارت المنتج.
   بدون إطار ولا ظل — الصورة نفسها هي الكارت، والنص تحتها.
   على الديسكتوب: الصورة التانية بتظهر بالتلاشي + زرار إضافة سريع بيطلع من تحت.
   ------------------------------------------------------------ */
export function ProductCard({
  product,
  index = 0,
  priority = false,
}: {
  product: Product
  /** للتتابع في حركة الظهور */
  index?: number
  priority?: boolean
}) {
  const { addItem } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const discount = discountPercent(product.price, product.compareAtPrice)
  const secondImage = product.images[1]
  const soldOut = product.inStock === false
  const colorGroup = product.variants?.find((v) => v.name === 'اللون')

  /* المنتج اللي له متغيرات لازم يتفتح عشان العميل يختار المقاس */
  const needsChoice = Boolean(product.variants?.length)

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (soldOut) return
    addItem(product, {}, 1)
    setJustAdded(true)
    window.setTimeout(() => setJustAdded(false), 1600)
  }

  return (
    <article
      data-reveal=""
      style={{ '--reveal-delay': `${Math.min(index, 7) * 70}ms` } as React.CSSProperties}
      className="group relative"
    >
      <Link href={`/product/${product.slug}`} className="block">
        {/* --- الصورة --- */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand">
          <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.045]">
            <ProductImage
              src={product.images[0]}
              alt={product.name}
              seed={product.id}
              priority={priority}
            />
          </div>

          {/* الصورة التانية بتتلاشى فوق الأولى */}
          {secondImage && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <ProductImage src={secondImage} alt={product.name} seed={product.id + 'b'} />
            </div>
          )}

          {/* --- الشارات --- */}
          <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
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
          </div>

          {soldOut && (
            <div className="absolute inset-0 flex items-center justify-center bg-ivory/75 backdrop-blur-[1px]">
              <span className="font-mono border border-brand-950 bg-ivory px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-950">
                Sold Out
              </span>
            </div>
          )}

          {/* --- زرار الإضافة السريعة (ديسكتوب فقط) --- */}
          {!soldOut && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden translate-y-full p-3 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0 lg:block">
              {needsChoice ? (
                <span className="pointer-events-auto flex w-full items-center justify-center gap-2 bg-brand-950/95 py-3 text-[12px] font-bold text-white backdrop-blur transition-colors hover:bg-brand-900">
                  اختر المقاس
                  <ArrowLeftIcon className="h-4 w-4" />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={quickAdd}
                  className="pointer-events-auto flex w-full items-center justify-center gap-2 bg-brand-950/95 py-3 text-[12px] font-bold text-white backdrop-blur transition-colors hover:bg-brand-900"
                >
                  {justAdded ? (
                    <>
                      <CheckIcon className="h-4 w-4" />
                      اتضاف للسلة
                    </>
                  ) : (
                    <>
                      <PlusIcon className="h-4 w-4" />
                      إضافة سريعة
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* --- البيانات --- */}
        <div className="pt-3">
          <h3 className="line-clamp-2 text-[13px] font-bold leading-[1.6] text-ink transition-colors group-hover:text-brand-700 lg:text-[13.5px]">
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

          {/* الألوان المتاحة */}
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
   جريد المنتجات — نفس الأعمدة في كل الصفحات
   ------------------------------------------------------------ */
export function ProductGrid({
  products,
  priorityCount = 0,
}: {
  products: Product[]
  /** أول كام صورة تتحمّل بأولوية */
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
