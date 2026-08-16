'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { site } from '@/data/site'
import { ArrowLeftIcon } from './icons'

/* ------------------------------------------------------------
   الهيرو = بانر المتجر بنسبته الطبيعية (1800×563).
   نفس الشكل العريض على كل الأجهزة — الفون والكمبيوتر.
   النص في نص البانر فوق طبقة بلور خفيفة عشان يبان في كل الحالات.
   ------------------------------------------------------------ */
export function Hero() {
  const { hero } = site
  const imageRef = useRef<HTMLDivElement>(null)

  /* بارالاكس خفيف — إحساس عمق من غير ما يزحزح الكادر */
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
          نسختين: رأسية للفون وعريضة للكمبيوتر — كل واحدة بنسبتها
          الطبيعية عشان تبان كاملة من غير قص ولا تشويه.
          ============================================================ */}
      <div className="relative aspect-[761/1280] w-full overflow-hidden sm:aspect-[1800/563]">
        <div ref={imageRef} className="absolute inset-0 lg:scale-[1.04]">
          {/* --- الفون --- */}
          <Image
            src={hero.imageMobile}
            alt={`${site.name} — ${site.tagline}`}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center sm:hidden"
          />

          {/* --- التابلت والكمبيوتر --- */}
          <Image
            src={hero.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="hidden object-cover object-center sm:block"
          />
        </div>

        {/* تعتيم متدرّج عشان النص يفضل مقروء.
            على الفون التعتيم من تحت لأن النص بينزل جنب الموديل. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-brand-950/15 to-brand-950/20 sm:from-brand-950/55 sm:via-brand-950/10 sm:to-brand-950/25"
        />

        {/* --- النص فوق البانر ---
            الفون: تحت قريّب من الأسفل عشان ما يغطّيش الموديل
            الكمبيوتر: في نص البانر */}
        <div className="absolute inset-0 flex items-end justify-center px-4 pb-6 sm:items-center sm:px-3 sm:pb-0">
          <div className="hero-glass animate-[riseIn_0.9s_cubic-bezier(0.16,1,0.3,1)_both] w-full max-w-[min(94%,640px)] px-4 py-4 text-center sm:px-8 sm:py-6 lg:px-12 lg:py-8">
            <p className="eyebrow !text-brand-200 text-[9px] sm:text-[10px]">
              {hero.eyebrow}
            </p>

            <h1 className="display mt-1.5 text-[clamp(1.15rem,5.6vw,2.5rem)] !text-white sm:mt-2.5">
              {hero.title}
            </h1>

            <p className="mx-auto mt-2 max-w-[42ch] text-[11.5px] leading-[1.8] text-white/85 sm:mt-3 sm:text-[13px] sm:leading-[1.85]">
              {hero.subtitle}
            </p>

            <div className="mt-4 flex justify-center sm:mt-5">
              <HeroButton href={hero.href} label={hero.cta} />
            </div>
          </div>
        </div>
      </div>

      {/* ============ شريط المزايا — كاروسيل على الفون ============ */}
      <div className="border-y border-line bg-ivory">
        <div className="container-x">
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 py-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-visible lg:px-0">
            {site.perks.map((perk, i) => (
              <div
                key={i}
                data-reveal=""
                style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
                className="w-[62vw] shrink-0 snap-start border border-line bg-white px-4 py-3.5
                           sm:w-[42vw]
                           lg:w-auto lg:border-0 lg:border-l lg:bg-transparent lg:px-6 lg:py-0 lg:last:border-l-0"
              >
                <p className="font-mono mb-1.5 text-[9.5px] text-brand-600">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <p className="text-[12.5px] font-extrabold text-ink lg:text-[13px]">
                  {perk.title}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted lg:text-[11.5px]">
                  {perk.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------
   زرار الهيرو
   ------------------------------------------------------------ */
function HeroButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-white px-6 py-3 text-[12.5px] font-bold text-ink shadow-lg transition-transform duration-300 active:scale-[0.98] sm:gap-2.5 sm:px-7 sm:py-3.5 sm:text-[13px]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 translate-y-full bg-gradient-to-l from-brand-400 to-brand-600 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-y-0"
      />
      <span className="relative">{label}</span>
      <ArrowLeftIcon className="relative h-3 w-3 transition-transform duration-300 group-hover:-translate-x-1 sm:h-4 sm:w-4" />
    </Link>
  )
}
