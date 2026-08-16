import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ShopBrowser } from '@/components/shop-browser'
import { categories, getCategoryBySlug, getProductsByCategory } from '@/data/products'

export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) return { title: 'القسم غير موجود' }

  return {
    title: category.name,
    description: category.description ?? `تصفّح قسم ${category.name} في ATLAS Store`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const category = getCategoryBySlug(slug)
  if (!category) notFound()

  const items = getProductsByCategory(slug)
  const index = categories.findIndex((c) => c.slug === slug) + 1

  return (
    <>
      <PageHeader
        index={String(index).padStart(2, '0')}
        eyebrow={`${items.length} Products`}
        title={category.name}
        description={category.description}
        breadcrumbs={[{ href: '/shop', label: 'كل المنتجات' }]}
      />

      <div className="container-x py-10 lg:py-14">
        {items.length === 0 ? (
          <div className="border border-line bg-white py-24 text-center">
            <p className="font-display text-xl font-extrabold text-ink">
              القسم ده لسه فاضي
            </p>
            <p className="mt-2.5 text-[13.5px] text-muted">
              هننزل فيه قطع قريب — تابعنا.
            </p>
          </div>
        ) : (
          <ShopBrowser initialCategory={slug} />
        )}
      </div>
    </>
  )
}
