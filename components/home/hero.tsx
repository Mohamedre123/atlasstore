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
   ترتيبها بيتغيّر حسب الجهاز:

   • الكمبيوتر → عمودين: الكلام يمين، وتلات قطع معلّقة شمال
     بتتحرك مع الماوس.
   • الفون → الكلام فوق، وتحته صف قطع بالسحب (كاروسيل) بدل
     الكروت المتراكبة — أوضح وأرتب على شاشة ضيقة.

   والمزايا شريط كامل تحت الاتنين، مش جوه عمود الكلام.
   ============================================================ */

const perkIcons = [CashIcon, TruckIcon, RefreshIcon, SparkIcon]

/* مكان كل كارت على الكمبيوتر — على الفون بيتجاهلها ويبقى صف عادي */
const SLOTS = [
  { at: 'lg:right-0 lg:top-0 lg:w-[46%]', depth: 26, delay: '0ms', float: '0s' },
  { at: 'lg:left-0 lg:top-[19%] lg:w-[40%]', depth: -34, delay: '140ms', float: '1.4s' },
  {
    at: 'lg:bottom-0 lg:right-[13%] lg:w-[42%]',
    depth: 18,
    delay: '280ms',
    float: '2.6s',
  },
] as const

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
      {/* ---------- شفق خاص بالواجهة فوق خلفية الموقع ---------- */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="aurora aurora-a -right-24 -top-32 h-[420px] w-[420px] !opacity-40" />
        <span className="aurora aurora-b -left-32 top-24 h-[480px] w-[480px] !opacity-35" />
      </div>

      <div className="shell relative pt-10 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* ============ الكلام ============ */}
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

            {/* عنوان واحد بيتوزّع على السطور لوحده (text-balance) بدل
                ما نقسّمه بإيدينا لكلمة فوق وكلمتين تحت */}
            <h1 className="display mt-6 text-balance text-[clamp(2rem,6.8vw,3.5rem)] leading-[1.45] lg:leading-[1.3]">
              <span data-reveal="mask" className="block">
                <span>
                  {hero.titleTop} <span className="grad-text">{hero.titleAccent}</span>
                </span>
              </span>
            </h1>

            <p
              data-reveal=""
              style={{ '--rd': '260ms' } as React.CSSProperties}
              className="mx-auto mt-5 max-w-[46ch] text-[14px] leading-[2.05] text-mist lg:mx-0"
            >
              {hero.subtitle}
            </p>

            <div
              data-reveal=""
              style={{ '--rd': '360ms' } as React.CSSProperties}
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
          </div>

          {/* ============ القطع ============
              فون: صف بالسحب · كمبيوتر: كروت معلّقة متراكبة */}
          <div className="relative z-10">
            <div className="rail no-bar bleed pb-2 lg:mx-auto lg:block lg:aspect-[4/4.2] lg:w-full lg:max-w-[520px] lg:overflow-visible lg:pb-0">
              {cards.map((product, i) => (
                <FloatCard key={product.id} product={product} slot={i} />
              ))}

              {/* هالة تحت الكروت — كمبيوتر بس */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-8 bottom-2 hidden h-16 rounded-[50%] bg-brand-500/20 blur-3xl lg:block"
              />
            </div>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-[10.5px] text-mist lg:hidden">
              <ArrowLeftIcon className="h-3 w-3" />
              اسحب لتشوف باقي القطع
            </p>
          </div>
        </div>

        {/* ============ شريط المزايا ============ */}
        <div
          data-reveal=""
          style={{ '--rd': '160ms' } as React.CSSProperties}
          className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/8 bg-white/6 sm:grid-cols-4 lg:mt-16"
        >
          {site.perks.map((perk, i) => {
            const Icon = perkIcons[i] ?? SparkIcon
            return (
              <div
                key={i}
                className="flex items-start gap-3 bg-abyss/40 px-4 py-5 backdrop-blur-sm"
              >
                <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-400" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold leading-snug">{perk.title}</p>
                  <p className="mt-1 text-[10.5px] leading-relaxed text-mist">
                    {perk.text}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   كارت قطعة في الواجهة
   ------------------------------------------------------------ */
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
      /* العرض على الكمبيوتر جاي من s.at — مانحطّش هنا أي عرض
         لـ lg عشان ما يتعاركش معاه (النتيجة كانت كارت بيتلم
         على نفسه لأن اللوح جوّاه عرضه نسبة من الأب) */
      className={`group relative w-[58vw] shrink-0 sm:w-[38vw] lg:absolute lg:shrink ${s.at}`}
    >
      <div className="a-float" style={{ animationDelay: s.float }}>
        <div className="pcard rim rim-on !p-2 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)]">
          <div className="plate aspect-[3/4] w-full">
            <Shot
              src={product.images[0]}
              alt={product.name}
              sizes="(max-width: 640px) 58vw, (max-width: 1024px) 38vw, 26vw"
              priority
            />

            {discount !== null && (
              <span className="chip chip-sale nums absolute right-2 top-2 !px-2 !text-[9.5px]">
                خصم {discount}%
              </span>
            )}

            {/* على الكمبيوتر الكروت متراكبة فمفيش مكان لسطر بيانات
                تحتها — السعر بيقعد فوق الصورة */}
            <span className="chip chip-dark nums absolute left-2 top-2 hidden !text-[11px] lg:inline-flex">
              {formatPrice(product.price)}
            </span>
          </div>

          {/* سطر البيانات — فون وتابلت بس */}
          <div className="px-1.5 pb-0.5 pt-2.5 lg:hidden">
            <p className="line-clamp-1 text-[11.5px] font-bold text-foam/90">
              {product.name}
            </p>
            <p className="nums mt-1 text-[12.5px] font-extrabold text-brand-300">
              {formatPrice(product.price)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
