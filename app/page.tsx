import Link from 'next/link'
import { CategoryShowcase } from '@/components/home/category-showcase'
import { Closing } from '@/components/home/closing'
import { Editorial } from '@/components/home/editorial'
import { Hero } from '@/components/home/hero'
import { Process } from '@/components/home/process'
import { ProductRail } from '@/components/product/product-card'
import { ArrowLeftIcon } from '@/components/ui/icons'
import { Band, SectionHead } from '@/components/ui/section'
import {
  categories,
  getBestSellers,
  getCategoryCounts,
  getFeaturedProducts,
  getProductsByCategory,
  getSaleProducts,
} from '@/data/products'
import { site } from '@/data/site'

/* أقسام المنتجات اللي بتتعرض كصفوف تحت بعض */
const rails = [
  { slug: 'tshirts', index: '04', eyebrow: 'T-Shirts', title: 'تيشرتات' },
  { slug: 'sets', index: '05', eyebrow: 'Sets', title: 'أطقم كاملة' },
  { slug: 'abayas', index: '06', eyebrow: 'Abayas', title: 'عبايات رجالية' },
]

export default function HomePage() {
  const counts = getCategoryCounts()
  const showcase = getFeaturedProducts(3)
  const best = getBestSellers()
  const onSale = getSaleProducts(4)

  return (
    <>
      <Hero showcase={showcase} />

      {/* ============================================================
          01 — الأقسام
          ============================================================ */}
      <Band>
        <SectionHead
          index="01"
          eyebrow="Categories"
          title="تسوّق حسب القسم"
          description="كل قسم متجمّع فيه القطع اللي بتكمّل بعضها — تختار أسرع وتلبس أظبط."
          href="/shop"
        />
        <CategoryShowcase categories={categories} counts={counts} />
      </Band>

      {/* ============================================================
          02 — الأكثر مبيعًا
          ============================================================ */}
      <Band id="best" className="!pt-0">
        <SectionHead
          index="02"
          eyebrow="Best Sellers"
          title="الأكثر مبيعًا"
          description="القطع اللي بتخلص من المخزن أول بأول."
          href="/shop"
        />
        <ProductRail products={best} priorityCount={2} />
      </Band>

      {/* ============================================================
          03 — الشريط التحريري
          ============================================================ */}
      <Editorial />

      {/* ============================================================
          04 · 05 · 06 — صف لكل قسم
          ============================================================ */}
      {rails.map((rail) => {
        const items = getProductsByCategory(rail.slug)
        if (items.length === 0) return null

        const category = categories.find((c) => c.slug === rail.slug)

        return (
          <Band key={rail.slug} className="!pt-14 lg:!pt-20">
            <SectionHead
              index={rail.index}
              eyebrow={rail.eyebrow}
              title={rail.title}
              description={category?.description}
              href={`/category/${rail.slug}`}
              hrefLabel={`تسوّق ${category?.name ?? ''}`}
            />
            <ProductRail products={items} columns={items.length <= 3 ? 3 : 4} />
          </Band>
        )
      })}

      {/* ============================================================
          07 — العروض
          ============================================================ */}
      {onSale.length > 0 && (
        <Band className="!pt-14 lg:!pt-20">
          <SectionHead
            index="07"
            eyebrow="On Sale"
            title="عليها خصم دلوقتي"
            description="نفس الخامة ونفس القصّة — بسعر أقل."
            href="/shop?sale=1"
          />
          <ProductRail products={onSale} />
        </Band>
      )}

      {/* ============================================================
          08 — إزاي بيشتغل
          ============================================================ */}
      <Band className="!pt-14 lg:!pt-20">
        <SectionHead
          index="08"
          eyebrow="How It Works"
          title="الطلب في ٣ خطوات"
          description="من غير بطاقة ائتمان ولا خطوات معقّدة — بتدفع لما يوصلك."
          align="center"
        />
        <Process />
      </Band>

      {/* ============================================================
          09 — أسئلة + تواصل
          ============================================================ */}
      <Band className="!pt-14 lg:!pt-20">
        <SectionHead index="09" eyebrow="Questions" title="أسئلة بتتسأل كتير" />
        <Closing />
      </Band>

      {/* ============================================================
          دعوة أخيرة
          ============================================================ */}
      <section className="shell pb-20 lg:pb-28">
        <div
          data-reveal=""
          className="relative overflow-hidden rounded-[26px] border border-white/8 bg-gradient-to-l from-brand-950/60 via-deep to-deep px-6 py-12 text-center lg:px-16 lg:py-16"
        >
          <span
            aria-hidden="true"
            className="aurora aurora-b -bottom-24 left-1/4 h-[300px] w-[300px]"
          />

          <div className="relative">
            <p className="tag">{site.hero.eyebrow}</p>
            <h2 className="display mx-auto mt-4 max-w-[20ch] text-[clamp(1.5rem,4.6vw,2.4rem)]">
              جاهز تختار قطعتك الجاية؟
            </h2>
            <p className="mx-auto mt-4 max-w-[46ch] text-[13.5px] leading-[2] text-mist">
              المجموعة كلها قدامك — فلتر حسب القسم أو السعر، وأضف اللي يعجبك للسلة.
            </p>

            <Link href="/shop" className="btn btn-primary btn-lg mt-8">
              <span>ابدأ التسوّق</span>
              <ArrowLeftIcon className="btn-arrow h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
