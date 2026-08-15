import Link from 'next/link'
import { Hero } from '@/components/hero'
import { ArrowLeftIcon, CashIcon, TruckIcon, WhatsAppIcon } from '@/components/icons'
import { WhaleWatermark } from '@/components/logo'
import { ProductImage } from '@/components/product-image'
import { ProductCarousel, Section, SectionHeading } from '@/components/section'
import { categories, getCategoryCounts, products } from '@/data/products'
import { site } from '@/data/site'
import { pluralize } from '@/lib/format'

export default function HomePage() {
  const counts = getCategoryCounts()

  return (
    <>
      <Hero />

      {/* ============================================================
          01 — الأقسام
          ============================================================ */}
      <Section>
        <SectionHeading
          index="01"
          eyebrow="Categories"
          title="تسوّق حسب القسم"
          description="كل قسم متجمّع فيه القطع اللي بتكمّل بعضها."
          href="/shop"
        />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
          {categories.map((category, i) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
              className={`group relative overflow-hidden bg-brand-950 ${
                i === 2 ? 'col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div
                className={`relative ${
                  i === 2 ? 'aspect-[2/1] lg:aspect-[4/5]' : 'aspect-[4/5]'
                }`}
              >
                <div className="absolute inset-0 transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]">
                  <ProductImage
                    src={category.image}
                    alt={category.name}
                    seed={category.slug}
                    sizes="(max-width: 1024px) 50vw, 33vw"
                  />
                </div>

                <div className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/25 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4 lg:p-5">
                  <div>
                    <p className="font-mono mb-1 text-[9px] uppercase tracking-[0.18em] text-brand-300">
                      {String(i + 1).padStart(2, '0')} —{' '}
                      {pluralize(counts[category.slug], 'منتج واحد', 'منتجان', 'منتجات')}
                    </p>
                    <h3 className="font-display text-[16px] font-extrabold text-white lg:text-[19px]">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-1 hidden max-w-[30ch] text-[11.5px] leading-relaxed text-white/65 lg:block">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-white/30 text-white transition-all duration-300 group-hover:border-brand-400 group-hover:bg-brand-400 group-hover:text-brand-950">
                    <ArrowLeftIcon className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* ============================================================
          02 — المجموعة
          ============================================================ */}
      <Section className="!pt-0">
        <SectionHeading
          index="02"
          eyebrow="The Collection"
          title="المجموعة"
          description="كل القطع المتاحة دلوقتي — بخامات وأسعار واضحة."
          href="/shop"
        />
        <ProductCarousel products={products} priorityCount={2} />
      </Section>

      {/* ============================================================
          فاصل تحريري
          ============================================================ */}
      <section className="relative overflow-hidden bg-brand-950">
        <WhaleWatermark
          className="pointer-events-none absolute -bottom-12 -left-8 h-[300px] w-auto text-brand-400"
          opacity={0.07}
        />

        <div className="container-x relative grid gap-8 py-14 lg:grid-cols-2 lg:gap-12 lg:py-20">
          <div data-reveal="">
            <p className="eyebrow mb-4 text-brand-400">Our Standard</p>
            <h2 className="display text-[clamp(1.35rem,3.4vw,2.1rem)] text-white">
              مش كل حاجة بتتعرض.
              <br />
              <span className="text-brand-400">اللي بيوصلك بس اللي عدّى.</span>
            </h2>
          </div>

          <div data-reveal="" style={{ '--reveal-delay': '160ms' } as React.CSSProperties}>
            <p className="max-w-[48ch] text-[13.5px] leading-[2] text-brand-100/80">
              بنشوف الخامة قبل القصّة، والقصّة قبل السعر. القطعة اللي مش هنلبسها إحنا
              مش بنعرضها. عشان كده المجموعة صغيرة — بس كل قطعة فيها ليها سبب.
            </p>

            <div className="mt-7 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[
                { value: '١٤', label: 'يوم استبدال' },
                { value: '٢٧', label: 'محافظة نغطيها' },
                { value: '١٠٠٪', label: 'قطن أصلي' },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="font-display text-[21px] font-extrabold text-brand-400 lg:text-[27px]">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-[11px] leading-snug text-brand-200/65">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          03 — إزاي بتشتغل
          ============================================================ */}
      <Section>
        <SectionHeading
          index="03"
          eyebrow="How It Works"
          title="الطلب في ٣ خطوات"
          description="من غير تسجيل ولا بطاقة ائتمان — بتدفع لما يوصلك."
        />

        <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
          {[
            {
              Icon: TruckIcon,
              step: '01',
              title: 'اختار وضيف للسلة',
              text: 'حدّد المقاس واللون والكمية اللي محتاجها، وضيفها لسلتك.',
            },
            {
              Icon: CashIcon,
              step: '02',
              title: 'اكتب بياناتك',
              text: 'المحافظة والمركز والقرية والعنوان بالتفصيل. مفيش حساب ولا باسورد.',
            },
            {
              Icon: WhatsAppIcon,
              step: '03',
              title: 'استلم وادفع',
              text: 'بنكلّمك للتأكيد، وتدفع لمندوبنا عند الاستلام بعد ما تتفحّص الأوردر.',
            },
          ].map((item, i) => (
            <div
              key={i}
              data-reveal=""
              style={{ '--reveal-delay': `${i * 110}ms` } as React.CSSProperties}
              className="group bg-ivory p-6 transition-colors duration-500 hover:bg-white lg:p-8"
            >
              <div className="mb-5 flex items-center justify-between">
                <item.Icon className="h-6 w-6 text-brand-700 transition-transform duration-500 group-hover:-translate-y-1" />
                <span className="font-display text-[30px] font-extrabold leading-none text-line-strong transition-colors duration-500 group-hover:text-brand-200">
                  {item.step}
                </span>
              </div>
              <h3 className="text-[14px] font-extrabold text-brand-950">{item.title}</h3>
              <p className="mt-2 text-[12.5px] leading-[1.9] text-muted">{item.text}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================
          دعوة أخيرة
          ============================================================ */}
      <section className="container-x pb-16 lg:pb-20">
        <div
          data-reveal=""
          className="relative overflow-hidden border border-line bg-white px-5 py-11 text-center lg:px-14 lg:py-14"
        >
          <WhaleWatermark
            className="pointer-events-none absolute -left-6 -top-6 h-[180px] w-auto text-brand-900"
            opacity={0.04}
          />
          <p className="eyebrow mb-4">Need Help?</p>
          <h2 className="display mx-auto max-w-[22ch] text-[clamp(1.2rem,3.2vw,1.75rem)]">
            محتار في المقاس أو عايز تسأل عن قطعة؟
          </h2>
          <p className="mx-auto mt-3 max-w-[46ch] text-[13px] leading-[1.9] text-muted">
            كلّمنا على واتساب وهنساعدك تختار المقاس المناسب قبل ما تطلب.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <a
              href={`https://wa.me/${site.contact.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>كلّمنا واتساب</span>
            </a>
            <Link href="/shop" className="btn btn-outline">
              <span>تصفّح المجموعة</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
