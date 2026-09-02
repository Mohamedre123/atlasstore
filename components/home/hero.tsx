'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { Shot } from '@/components/product/shot'
import {
  ArrowLeftIcon,
  CashIcon,
  RefreshIcon,
  SparkIcon,
  TruckIcon,
} from '@/components/ui/icons'
import { site } from '@/data/site'
import { discountPercent, formatPrice } from '@/lib/format'
import type { Product } from '@/lib/types'

/* ============================================================
   الواجهة الرئيسية
   ------------------------------------------------------------
   مشهد بحري غامق: شفق متحرك في الخلفية، عنوان كبير بيتكشف
   سطر ورا سطر، وتلات قطع من المجموعة معلّقة على ألواح فاتحة
   بتتحرك مع الماوس ومع التمرير.

   البانرات القديمة مش مستخدمة هنا بقصد — الواجهة اتبنت من صور
   المنتجات نفسها، فأي منتج جديد بيغيّر الواجهة تلقائيًا من غير
   ما تعمل بانر بمقاسين كل مرة.
   ============================================================ */

const perkIcons = [CashIcon, TruckIcon, RefreshIcon, SparkIcon]

export function Hero({ showcase }: { showcase: Product[] }) {
  const stage = useRef<HTMLDivElement>(null)
  const { hero } = site

  /* بارالاكس خفيف مع الماوس — كمبيوتر بس */
  useEffect(() => {
    const el = stage.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (min-width: 1024px)').matches) return

    let frame = 0
    const onMove = (e: MouseEvent) => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width - 0.5
        const y = (e.clientY - rect.top) / rect.height - 0.5
        el.style.setProperty('--mx', String(x))
        el.style.setProperty('--my', String(y))
        frame = 0
      })
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', onMove)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const cards = showcase.slice(0, 3)

  return (
    <section
      ref={stage}
      aria-label="واجهة المتجر"
      className="relative overflow-hidden"
      style={{ '--mx': 0, '--my': 0 } as React.CSSProperties}
    >
      {/* ---------- الخلفية ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="aurora aurora-a -right-24 -top-32 h-[460px] w-[460px]" />
        <span className="aurora aurora-b -left-32 top-24 h-[520px] w-[520px]" />
        <span className="aurora aurora-c bottom-[-180px] right-1/3 h-[420px] w-[420px]" />
        <span className="gridlines" />
      </div>

      <div className="shell relative pb-14 pt-12 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ============ النص ============ */}
          <div className="relative z-10 text-center lg:text-right">
            <span
              data-reveal=""
              className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/8 px-4 py-2"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
              </span>
              <span className="tag !tracking-[0.2em]">{hero.eyebrow}</span>
            </span>

            <h1 className="display mt-6 text-[clamp(2.3rem,8.4vw,4.6rem)] leading-[1.12]">
              <span data-reveal="mask" className="block">
                <span>{hero.titleTop}</span>
              </span>
              <span
                data-reveal="mask"
                style={{ '--rd': '160ms' } as React.CSSProperties}
                className="block pb-2"
              >
                <span className="grad-text">{hero.titleAccent}</span>
              </span>
            </h1>

            <p
              data-reveal=""
              style={{ '--rd': '320ms' } as React.CSSProperties}
              className="mx-auto mt-5 max-w-[46ch] text-[14px] leading-[2.05] text-mist lg:mx-0"
            >
              {hero.subtitle}
            </p>

            <div
              data-reveal=""
              style={{ '--rd': '420ms' } as React.CSSProperties}
              className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <Link href={hero.href} className="btn btn-primary btn-lg">
                <span>{hero.cta}</span>
                <ArrowLeftIcon className="btn-arrow h-4 w-4" />
              </Link>
              <Link href="/#best" className="btn btn-ghost btn-lg">
                <span>{hero.ctaAlt}</span>
              </Link>
            </div>

            {/* شريط المزايا */}
            <div
              data-reveal=""
              style={{ '--rd': '520ms' } as React.CSSProperties}
              className="mt-10 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/8 pt-7 sm:grid-cols-4 lg:gap-x-4"
            >
              {site.perks.map((perk, i) => {
                const Icon = perkIcons[i] ?? SparkIcon
                return (
                  <div key={i} className="text-center lg:text-right">
                    <Icon className="mx-auto h-[18px] w-[18px] text-brand-400 lg:mx-0" />
                    <p className="mt-2 text-[12px] font-bold leading-snug">
                      {perk.title}
                    </p>
                    <p className="mt-1 hidden text-[10.5px] leading-relaxed text-mist sm:block">
                      {perk.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ============ القطع المعلّقة ============ */}
          <div className="relative z-10">
            <div className="relative mx-auto aspect-[4/4.4] w-full max-w-[520px] sm:aspect-[4/3.6] lg:aspect-[4/4.3]">
              {cards.map((product, i) => (
                <FloatCard key={product.id} product={product} slot={i} />
              ))}

              {/* هالة تحت الكروت */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 bottom-2 h-16 rounded-[50%] bg-brand-500/22 blur-3xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   كارت عائم في مشهد الواجهة
   ------------------------------------------------------------ */
const SLOTS = [
  {
    box: 'right-0 top-0 w-[52%] sm:w-[45%]',
    depth: 26,
    delay: '0ms',
    float: '0s',
  },
  {
    box: 'left-0 top-[20%] w-[45%] sm:w-[39%]',
    depth: -34,
    delay: '140ms',
    float: '1.4s',
  },
  {
    box: 'bottom-0 right-[14%] w-[48%] sm:w-[41%]',
    depth: 18,
    delay: '280ms',
    float: '2.6s',
  },
] as const

function FloatCard({ product, slot }: { product: Product; slot: number }) {
  const s = SLOTS[slot] ?? SLOTS[0]
  const discount = discountPercent(product.price, product.compareAtPrice)

  return (
    <Link
      href={`/product/${product.slug}`}
      data-reveal="zoom"
      style={
        {
          '--rd': s.delay,
          transform: `translate3d(calc(var(--mx) * ${s.depth}px), calc(var(--my) * ${s.depth}px), 0)`,
          transition: 'transform 0.65s cubic-bezier(0.19,1,0.22,1)',
        } as React.CSSProperties
      }
      className={`group absolute ${s.box}`}
    >
      <div className="a-float" style={{ animationDelay: s.float }}>
        {/* الكروت متراكبة على بعضها، فالسعر والخصم بيتحطوا فوق
            الصورة نفسها — سطر بيانات تحتها كان هيتغطّى من الكارت
            اللي بعده على الشاشات الصغيرة */}
        <div className="pcard rim rim-on !p-2 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
          <div className="plate aspect-[3/4] w-full">
            <Shot
              src={product.images[0]}
              alt={product.name}
              sizes="(max-width: 640px) 52vw, 26vw"
              priority
            />

            {discount !== null && (
              <span className="chip chip-sale nums absolute right-2 top-2 !px-2 !text-[9.5px]">
                خصم {discount}%
              </span>
            )}

            {/* فوق مش تحت — الكروت بتتراكب من تحت فالسعر كان بيتغطّى */}
            <span className="chip chip-dark nums absolute left-2 top-2 !text-[11px]">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
