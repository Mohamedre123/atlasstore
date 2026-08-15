import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { ShopBrowser } from '@/components/shop-browser'

export const metadata: Metadata = {
  title: 'كل المنتجات',
  description: 'تصفّح كل منتجات ATLAS Store — ملابس رجالي بخامات مختارة وأسعار واضحة.',
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sale?: string }>
}) {
  const params = await searchParams

  return (
    <>
      <PageHeader
        index="/ shop"
        eyebrow="All Products"
        title="كل المنتجات"
        description="المجموعة كاملة. فلتر حسب القسم أو رتّب بالسعر عشان توصل للي بتدوّر عليه بسرعة."
      />

      <div className="container-x py-10 lg:py-14">
        <ShopBrowser
          initialCategory={params.category ?? ''}
          initialSaleOnly={params.sale === '1'}
        />
      </div>
    </>
  )
}
