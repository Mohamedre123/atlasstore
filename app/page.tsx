import Link from 'next/link'
import { CategoryShowcase } from '@/components/home/category-showcase'
import { Closing } from '@/components/home/closing'
import { Editorial } from '@/components/home/editorial'
import { Hero } from '@/components/home/hero'
import { Process } from '@/components/home/process'
import { ProductRail } from '@/components/product/product-card'
import { ArrowLeftIcon } from '@/components/ui/icons'
import { Band, SectionHead } from '@/components/ui/section'
import { site } from '@/data/site'
import {
  getBestSellers,
  getCategoryCounts,
  getCategoryTree,
  getFeaturedProducts,
  getProductsByCategory,
  getSaleProducts,
} from '@/lib/catalog'

/* الصفحة بتتبني كل ساعة أو أول ما تعدّل حاجة من اللوحة */
export const revalidate = 3600

export default async function HomePage() {
  const [tree, counts, showcase, best, onSale] = await Promise.all([
    getCategoryTree(),
    getCategoryCounts(),
    getFeaturedProducts(3),
    getBestSellers(8),
    getSaleProducts(4),
  ])

  /* صف لكل قسم رئيسي فيه منتجات — بيتولّد من الأقسام نفسها
     فأي قسم جديد بيظهر هنا لوحده */
  const rails = await Promise.all(
    tree.slice(0, 4).map(async (category, i) => ({
      category,
      index: String(i + 4).padStart(2, '0'),
      items: await getProductsByCategory(category.slug),
    }))
  )

  const withItems = rails.filter((r) => r.items.length > 0)

  return (
    <>
      <Hero showcase={showcase} />

      {/* ============================================================
          01 — الأقسام
          ============================================================ */}
      {tree.length > 0 && (
        <Band>
          <SectionHead
            index="01"
            eyebrow="Categories"
            title="تسوّق حسب القسم"
            description="كل قسم متجمّع فيه القطع اللي بتكمّل بعضها — تختار أسرع وتلبس أظبط."
            href="/shop"
          />
          <CategoryShowcase categories={tree} counts={counts} />
        </Band>
      )}

      {/* ============================================================
          02 — الأكثر مبيعًا
          ============================================================ */}
      {best.length > 0 && (
        <Band id="best" className={tree.length ? '!pt-0' : ''}>
          <SectionHead
            index="02"
            eyebrow="Best Sellers"
            title="الأكثر مبيعًا"
            description="القطع اللي بتخلص من المخزن أول بأول."
            href="/shop"
          />
          <ProductRail products={best} priorityCount={2} />
        </Band>
      )}

      {/* ============================================================
          03 — الشريط التحريري
          ============================================================ */}
      <Editorial />

      {/* ============================================================
          صف لكل قسم
          ============================================================ */}
      {withItems.map((rail) => (
        <Band key={rail.category.slug} className="!pt-14 lg:!pt-20">
          <SectionHead
            index={rail.index}
            eyebrow={rail.category.slug}
            title={rail.category.name}
            description={rail.category.description}
            href={`/category/${rail.category.slug}`}
            hrefLabel={`تسوّق ${rail.category.name}`}
          />
          <ProductRail
            products={rail.items.slice(0, 8)}
            columns={rail.items.length <= 3 ? 3 : 4}
          />
        </Band>
      ))}

      {/* ============================================================
          العروض
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
