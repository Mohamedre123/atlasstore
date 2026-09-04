import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { ShopBrowser } from '@/components/shop/shop-browser'
import { site } from '@/data/site'
import {
  getCategories,
  getCategoryBySlug,
  getProductsByCategory,
} from '@/lib/catalog'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'القسم غير موجود' }

  return {
    title: category.name,
    description:
      category.description ?? `تصفّح قسم ${category.name} في ${site.nameFull}`,
    alternates: { canonical: `/category/${slug}` },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const [category, items, categories] = await Promise.all([
    getCategoryBySlug(slug),
    getProductsByCategory(slug),
    getCategories(),
  ])

  if (!category) notFound()

  /* الأقسام الفرعية — بتبان كأزرار تحت العنوان */
  const children = categories.filter((c) => c.parent === slug)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: site.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'كل المنتجات',
        item: `${site.url}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `${site.url}/category/${slug}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        eyebrow={`${items.length} Products`}
        title={category.name}
        description={category.description}
        breadcrumbs={[{ href: '/shop', label: 'كل المنتجات' }]}
        aside={
          <div className="card px-5 py-4 text-center">
            <p className="nums display grad-text text-[26px] font-bold">
              {items.length}
            </p>
            <p className="mt-1 text-[11px] text-mist">قطعة في القسم</p>
          </div>
        }
      />

      <div className="shell py-10 lg:py-14">
        {/* الأقسام الفرعية */}
        {children.length > 0 && (
          <div className="rail no-bar bleed mb-8 gap-2 pb-2 lg:flex-wrap lg:overflow-visible">
            {children.map((child) => (
              <a
                key={child.slug}
                href={`/category/${child.slug}`}
                className="rounded-full border border-white/12 bg-white/4 px-4 py-2.5 text-[12.5px] font-bold text-foam/85 transition-all duration-400 hover:border-brand-500/50 hover:text-white"
              >
                {child.name}
              </a>
            ))}
          </div>
        )}

        {items.length === 0 ? (
          <div className="card px-6 py-24 text-center">
            <p className="display text-[19px] font-bold">القسم ده لسه فاضي</p>
            <p className="mt-3 text-[13px] text-mist">هننزل فيه قطع قريب — تابعنا.</p>
          </div>
        ) : (
          <ShopBrowser
            products={items}
            categories={categories}
            initialCategory={slug}
            lockCategory
          />
        )}
      </div>
    </>
  )
}
