import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { ShopBrowser } from '@/components/shop/shop-browser'
import { site } from '@/data/site'
import { getCategories, getProducts } from '@/lib/catalog'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'كل المنتجات',
  description: `تصفّح مجموعة ${site.nameFull} كاملة — ملابس رجالي بخامات مختارة وأسعار واضحة، والدفع عند الاستلام.`,
  alternates: { canonical: '/shop' },
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sale?: string }>
}) {
  const [params, products, categories] = await Promise.all([
    searchParams,
    getProducts(),
    getCategories(),
  ])

  const saleOnly = params.sale === '1'

  return (
    <>
      <PageHeader
        eyebrow="All Products"
        title={saleOnly ? 'العروض' : 'كل المنتجات'}
        description={
          saleOnly
            ? 'القطع اللي عليها خصم دلوقتي — نفس الخامة ونفس القصّة بسعر أقل.'
            : 'المجموعة كاملة. فلتر حسب القسم أو السعر ورتّب زي ما يريحك عشان توصل بسرعة للي بتدوّر عليه.'
        }
        aside={
          <div className="card px-5 py-4 text-center">
            <p className="nums display grad-text text-[26px] font-bold">
              {products.length}
            </p>
            <p className="mt-1 text-[11px] text-mist">قطعة في المجموعة</p>
          </div>
        }
      />

      <div className="shell py-10 lg:py-14">
        <ShopBrowser
          products={products}
          categories={categories}
          initialCategory={params.category ?? ''}
          initialSaleOnly={saleOnly}
        />
      </div>
    </>
  )
}
