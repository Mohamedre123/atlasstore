'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { site } from '@/data/site'
import { ArrowLeftIcon } from './icons'

/* ------------------------------------------------------------
   الهيرو = بانر المتجر الأصلي بنسبته الطبيعية (1800×563).
   الصورة بتتعرض كاملة على أي شاشة — لا قص ولا تشويه.
   الديسكتوب: النص فوق المساحة الفاضية على يمين البانر.
   الموبايل: البانر كامل، والنص تحته مباشرة كوحدة واحدة.
   ------------------------------------------------------------ */
export function Hero() {
  const { hero } = site
  const imageRef = useRef<HTMLDivElement>(null)

  /* بارالاكس خفيف جدًا — إحساس عمق من غير ما يزحزح الكادر */
  useEffect(() => {
    const el = imageRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (window.innerWidth < 1024) return

    let frame = 0
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        const shift = Math.min(window.scrollY * 0.06, 34)
        el.style.transform = `translate3d(0, ${shift}px, 0) scale(1.04)`
        frame = 0
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <section aria-label="بانر المتجر" className="relative bg-white">
      {/* ============ البانر ============
          الديسكتوب: نسبة الصورة الأصلية 1800×563 كاملة من غير أي قص.
          الموبايل: بنقص الأطراف الزرقا الفاضية بس (الموديل في النص وبيفضل
          ظاهر بالكامل) عشان البانر ما يبقاش شريط رفيع ١١٧ بكسل.
          ============================================================ */}
      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[2/1] lg:aspect-[1800/563]">
        <div ref={imageRef} className="absolute inset-0 lg:scale-[1.04]">
          <Image
            src={hero.image}
            alt={`${site.name} — ${site.tagline}`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* تعتيم متدرّج من اليمين — يظهر على الشاشات الكبيرة بس */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden bg-gradient-to-l from-brand-950/80 via-brand-950/35 to-transparent lg:block"
        />

        {/* --- النص فوق البانر (ديسكتوب) --- */}
        <div className="absolute inset-0 hidden items-center lg:flex">
          <div className="container-x">
            <div className="max-w-[30rem]">
              <p
                className="eyebrow animate-[riseIn_0.8s_cubic-bezier(0.16,1,0.3,1)_both] text-brand-300"
                style={{ animationDelay: '80ms' }}
              >
                {hero.eyebrow}
              </p>

              <h1 className="mt-3 overflow-hidden">
                <span
                  className="display block animate-[maskUp_0.95s_cubic-bezier(0.16,1,0.3,1)_both] text-[clamp(1.7rem,2.9vw,2.6rem)] !text-white"
                  style={{ animationDelay: '160ms' }}
                >
                  {hero.title}
                </span>
              </h1>

              <p
                className="mt-4 max-w-[34ch] animate-[riseIn_0.9s_cubic-bezier(0.16,1,0.3,1)_both] text-[14px] leading-[1.9] text-white/85"
                style={{ animationDelay: '300ms' }}
              >
                {hero.subtitle}
              </p>

              <div
                className="mt-7 animate-[riseIn_0.9s_cubic-bezier(0.16,1,0.3,1)_both]"
                style={{ animationDelay: '400ms' }}
              >
                <HeroButton href={hero.href} label={hero.cta} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ النص تحت البانر (موبايل وتابلت) ============ */}
      <div className="border-b border-line bg-white lg:hidden">
        <div className="container-x py-8 text-center sm:py-10">
          <p className="eyebrow">{hero.eyebrow}</p>

          <h1 className="mt-2.5 overflow-hidden">
            <span className="display block animate-[maskUp_0.9s_cubic-bezier(0.16,1,0.3,1)_both] text-[clamp(1.45rem,6vw,2.1rem)]">
              {hero.title}
            </span>
          </h1>

          <p className="mx-auto mt-3.5 max-w-[36ch] text-[13.5px] leading-[1.9] text-muted">
            {hero.subtitle}
          </p>

          <div className="mt-6 flex justify-center">
            <HeroButton href={hero.href} label={hero.cta} />
          </div>
        </div>
      </div>

      {/* ============ شريط المزايا ============ */}
      <div className="border-b border-line bg-ivory">
        <div className="container-x grid grid-cols-2 lg:grid-cols-4">
          {site.perks.map((perk, i) => (
            <div
              key={i}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
              className="border-b border-line px-1 py-5 last:border-b-0 sm:border-b-0 lg:border-l lg:border-b-0 lg:px-6 lg:last:border-l-0 [&:nth-child(-n+2)]:border-b lg:[&:nth-child(-n+2)]:border-b-0"
            >
              <p className="font-mono mb-1.5 text-[9.5px] text-brand-600">
                {String(i + 1).padStart(2, '0')}
              </p>
              <p className="text-[12.5px] font-extrabold text-brand-950 lg:text-[13px]">
                {perk.title}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-muted lg:text-[11.5px]">
                {perk.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   زرار الهيرو — تعبئة بتزحف من تحت عند الهوفر + سهم بيتحرك
   ------------------------------------------------------------ */
function HeroButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2.5 overflow-hidden rounded-[3px] bg-brand-950 px-7 py-3.5 text-[13px] font-bold text-white transition-transform duration-300 active:scale-[0.98]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-full bg-gradient-to-l from-brand-400 to-brand-600 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
      />
      <span className="relative transition-colors duration-300 group-hover:text-brand-950">
        {label}
      </span>
      <ArrowLeftIcon className="relative h-4 w-4 transition-all duration-300 group-hover:-translate-x-1 group-hover:text-brand-950" />
    </Link>
  )
}
