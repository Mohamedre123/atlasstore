import Image from 'next/image'
import Link from 'next/link'
import { Watermark } from '@/components/brand/logo'
import { ArrowLeftIcon } from '@/components/ui/icons'
import { revealDelay } from '@/lib/motion'
import { site } from '@/data/site'

/* ============================================================
   الشريط التحريري
   ------------------------------------------------------------
   بانر المتجر بيقعد هنا كخلفية تحت تعتيم متدرّج، والكلام
   والأرقام فوقه. نسختين للصورة: رأسية للفون وعريضة للكمبيوتر.
   ============================================================ */
export function Editorial() {
  const { editorial, stats } = site

  return (
    <section className="shell pb-4">
      <div
        data-reveal="zoom"
        className="relative overflow-hidden rounded-[28px] border border-white/8"
      >
        {/* --- الصورة --- */}
        <div className="absolute inset-0">
          <Image
            src={editorial.imageMobile}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-center sm:hidden"
          />
          <Image
            src={editorial.image}
            alt=""
            fill
            sizes="100vw"
            className="hidden object-cover object-center sm:block"
          />
        </div>

        {/* --- التعتيم --- */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-l from-abyss/95 via-abyss/80 to-abyss/45 sm:from-abyss/94 sm:via-abyss/72 sm:to-abyss/20"
        />

        <Watermark
          className="pointer-events-none absolute -bottom-10 left-4 h-[220px] w-auto"
          opacity={0.08}
        />

        {/* --- المحتوى --- */}
        <div className="relative grid gap-8 px-6 py-12 sm:px-10 lg:grid-cols-2 lg:gap-14 lg:px-16 lg:py-20">
          <div>
            <p data-reveal="" className="tag">
              {editorial.eyebrow}
            </p>

            <h2
              data-reveal=""
              style={revealDelay(80)}
              className="display mt-4 text-[clamp(1.6rem,5vw,2.9rem)]"
            >
              {editorial.title}
              <br />
              <span className="grad-text">اللي بيوصلك عدّى.</span>
            </h2>
          </div>

          <div className="lg:pt-4">
            <p
              data-reveal=""
              style={revealDelay(160)}
              className="max-w-[50ch] text-[13.5px] leading-[2.15] text-foam/75"
            >
              {editorial.text}
            </p>

            {/* الأرقام في لوح زجاجي — فوق صورة، فمن غير خلفية
                بتبقى صعبة القراءة. dir=ltr عشان «١٠٠٪» ما تتقلبش
                وتبان «٪١٠٠». */}
            <div
              data-reveal=""
              style={revealDelay(240)}
              className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/12 bg-white/10"
            >
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className="bg-abyss/70 px-3 py-5 text-center backdrop-blur-md"
                >
                  <p
                    dir="ltr"
                    className="display text-[clamp(1.75rem,5.6vw,2.5rem)] font-bold leading-none text-brand-300 drop-shadow-[0_2px_16px_rgba(18,201,238,0.45)]"
                  >
                    {stat.value}
                  </p>
                  <p className="mt-2.5 text-[11px] leading-snug text-foam/70">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* الزرار في النص تحت الأرقام */}
            <div
              data-reveal=""
              style={revealDelay(320)}
              className="mt-8 flex justify-center"
            >
              <Link href="/shop" className="btn btn-ghost">
                <span>شوف المجموعة</span>
                <ArrowLeftIcon className="btn-arrow h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
