import Link from 'next/link'
import { CategoryRail } from '@/components/category-rail'
import { Hero } from '@/components/hero'
import { ArrowLeftIcon, CashIcon, TruckIcon, WhatsAppIcon } from '@/components/icons'
import { WhaleWatermark } from '@/components/logo'
import { ProductCarousel, Section, SectionHeading } from '@/components/section'
import {
  categories,
  getBestSellers,
  getCategoryCounts,
  getProductsByCategory,
} from '@/data/products'
import { site } from '@/data/site'

export default function HomePage() {
  const counts = getCategoryCounts()
  const bestSellers = getBestSellers()

  /* سيكشن لكل قسم بزرار «تسوّق الآن» */
  const categorySections = [
    { slug: 'tshirts', index: '03', eyebrow: 'T-Shirts', title: 'أفضل التيشرتات' },
    { slug: 'sets', index: '04', eyebrow: 'Sets', title: 'أطقم كاملة' },
    { slug: 'abayas', index: '05', eyebrow: 'Abayas', title: 'عبايات رجالية' },
  ]

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
        <CategoryRail categories={categories} counts={counts} />
      </Section>

      {/* ============================================================
          02 — الأكثر مبيعًا
          ============================================================ */}
      <Section className="!pt-0">
        <SectionHeading
          index="02"
          eyebrow="Best Sellers"
          title="الأكثر مبيعًا"
          description="القطع اللي بتخلص من المخزن أول بأول."
          href="/shop"
        />
        <ProductCarousel products={bestSellers} priorityCount={2} />
      </Section>

      {/* ============================================================
          فاصل تحريري
          ============================================================ */}
      <section className="relative overflow-hidden bg-brand-950">
        <WhaleWatermark
          className="absolute -bottom-10 -left-10 h-[280px] w-[280px]"
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
          03 · 04 · 05 — سيكشن لكل قسم
          ============================================================ */}
      {categorySections.map((section, sectionIndex) => {
        const items = getProductsByCategory(section.slug)
        if (items.length === 0) return null

        const category = categories.find((c) => c.slug === section.slug)

        return (
          <Section key={section.slug} className={sectionIndex > 0 ? '!pt-0' : ''}>
            <SectionHeading
              index={section.index}
              eyebrow={section.eyebrow}
              title={section.title}
              description={category?.description}
            />

            <ProductCarousel products={items} columns={items.length <= 3 ? 3 : 4} />

            <div className="mt-8 flex justify-center">
              <Link
                href={`/category/${section.slug}`}
                className="btn btn-outline group px-8"
              >
                <span>تسوّق {category?.name}</span>
                <ArrowLeftIcon className="h-4 w-4" />
              </Link>
            </div>

            {/* ------------------------------------------------------------
                مكان البانر الترويجي.
                حط صورتك في public/img/promo.webp وشيل التعليق عن الكود
                اللي تحت. المقاس المطلوب: 1800×563 بكسل (نفس بانر الهيرو).
                ------------------------------------------------------------ */}
            {/* {section.slug === 'tshirts' && (
              <Link href="/shop" className="mt-12 block overflow-hidden rounded-[4px]">
                <div className="relative aspect-[1800/563] w-full">
                  <Image src="/img/promo.webp" alt="عرض خاص" fill sizes="100vw" className="object-cover" />
                </div>
              </Link>
            )} */}
          </Section>
        )
      })}

      {/* ============================================================
          06 — إزاي بتشتغل
          ============================================================ */}
      <Section className="!pt-0">
        <SectionHeading
          index="06"
          eyebrow="How It Works"
          title="الطلب في ٣ خطوات"
          description="من غير تسجيل معقّد ولا بطاقة ائتمان — بتدفع لما يوصلك."
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
              text: 'المحافظة والمركز والقرية والعنوان بالتفصيل — ومرة واحدة بس.',
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
              <h3 className="text-[14px] font-extrabold text-ink">{item.title}</h3>
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
            className="absolute -left-6 -top-6 h-[170px] w-[170px]"
            opacity={0.05}
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
