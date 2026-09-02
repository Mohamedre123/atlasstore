'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeftIcon, ArrowRightIcon } from '@/components/ui/icons'
import { discountPercent } from '@/lib/format'
import type { Product } from '@/lib/types'
import { Shot } from './shot'

/* ============================================================
   معرض صور المنتج
   ------------------------------------------------------------
   • كل الصور متراكبة فوق بعض ومحمّلة من الأول، والتبديل
     بالشفافية بس — فالضغط على المصغّرة بيبدّل فورًا من غير
     انتظار تحميل.
   • على الكمبيوتر: تكبير بالماوس فوق الصورة (transform-origin
     بيتبع مكان المؤشر) + مصغّرات رأسية.
   • على الفون: سحب يمين وشمال بين الصور.
   ============================================================ */
export function Gallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0)
  const [zoom, setZoom] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const touchX = useRef<number | null>(null)

  const images = product.images.length ? product.images : ['']
  const discount = discountPercent(product.price, product.compareAtPrice)
  const soldOut = product.inStock === false

  const count = images.length

  const go = useCallback(
    (dir: 1 | -1) => setActive((i) => (i + dir + count) % count),
    [count]
  )

  /* الأسهم في لوحة المفاتيح — لما المعرض يكون مركّز عليه */
  useEffect(() => {
    const el = stage.current
    if (!el) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(1)
      if (e.key === 'ArrowRight') go(-1)
    }

    el.addEventListener('keydown', onKey)
    return () => el.removeEventListener('keydown', onKey)
  }, [go])

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stage.current
    if (!el || !zoom) return
    const rect = el.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    el.style.setProperty('--zx', `${x}%`)
    el.style.setProperty('--zy', `${y}%`)
  }

  return (
    <div className="flex min-w-0 flex-col-reverse gap-3 sm:flex-row-reverse sm:gap-4">
      {/* ---------- المصغّرات ---------- */}
      {images.length > 1 && (
        <div className="no-bar flex min-w-0 gap-2.5 overflow-x-auto sm:w-[78px] sm:shrink-0 sm:flex-col sm:overflow-visible">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`صورة ${i + 1} من ${images.length}`}
              aria-current={i === active}
              className={`plate relative aspect-[3/4] w-[62px] shrink-0 rounded-xl border-2 transition-all duration-400 sm:w-full ${
                i === active
                  ? 'border-brand-500 shadow-[var(--glow-sm)]'
                  : 'border-white/10 opacity-70 hover:opacity-100'
              }`}
            >
              <Shot src={img} alt="" sizes="78px" />
            </button>
          ))}
        </div>
      )}

      {/* ---------- الصورة الرئيسية ---------- */}
      <div className="min-w-0 flex-1">
        <div
          ref={stage}
          tabIndex={0}
          role="group"
          aria-label="صور المنتج"
          onMouseEnter={() => setZoom(true)}
          onMouseLeave={() => setZoom(false)}
          onMouseMove={onMove}
          onTouchStart={(e) => {
            touchX.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 48) go(dx > 0 ? -1 : 1)
            touchX.current = null
          }}
          className="plate group relative aspect-[3/4] w-full cursor-zoom-in select-none rounded-[20px]"
          style={{ '--zx': '50%', '--zy': '50%' } as React.CSSProperties}
        >
          {images.map((img, i) => (
            <div
              key={i}
              aria-hidden={i !== active}
              className="absolute inset-0 transition-opacity duration-400 ease-[cubic-bezier(0.19,1,0.22,1)]"
              style={{
                opacity: i === active ? 1 : 0,
                transform: zoom && i === active ? 'scale(1.85)' : 'scale(1)',
                transformOrigin: 'var(--zx) var(--zy)',
                transition:
                  'opacity 0.4s cubic-bezier(0.19,1,0.22,1), transform 0.5s cubic-bezier(0.19,1,0.22,1)',
              }}
            >
              <Shot
                src={img}
                alt={i === active ? product.name : ''}
                sizes="(max-width: 1024px) 100vw, 46vw"
                priority={i === 0}
              />
            </div>
          ))}

          {/* الشارات */}
          <div className="pointer-events-none absolute inset-x-4 top-4 z-10 flex flex-col items-start gap-2">
            {discount !== null && !soldOut && (
              <span className="chip chip-sale nums">خصم {discount}%</span>
            )}
            {product.badge && !soldOut && (
              <span className="chip chip-dark">{product.badge}</span>
            )}
          </div>

          {/* أسهم — كمبيوتر */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="الصورة السابقة"
                className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 lg:flex"
              >
                <ArrowRightIcon className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="الصورة التالية"
                className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink/80 text-white opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 lg:flex"
              >
                <ArrowLeftIcon className="h-4 w-4" />
              </button>
            </>
          )}

          {soldOut && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75">
              <span className="chip bg-ink px-5 py-2.5 text-[12px] text-white">
                خلص المخزون
              </span>
            </div>
          )}

          {/* عدّاد الصور — فون */}
          {images.length > 1 && (
            <span className="nums absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur lg:hidden">
              {active + 1} / {images.length}
            </span>
          )}
        </div>

        <p className="mt-3 hidden text-center text-[11px] text-mist lg:block">
          حرّك الماوس فوق الصورة للتكبير
        </p>
      </div>
    </div>
  )
}
