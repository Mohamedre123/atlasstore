import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/page-header'
import { ProductDetail } from '@/components/product-detail'
import { ProductGrid } from '@/components/product-card'
import { SectionHeading } from '@/components/section'
import {
  getCategoryBySlug,
  getProductBySlug,
  getRelatedProducts,
  products,
} from '@/data/products'
import { site } from '@/data/site'

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) return { title: 'المنتج غير موجود' }

  return {
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 155),
    openGraph: {
      title: `${product.name} — ${site.name}`,
      description: product.shortDescription ?? product.description.slice(0, 155),
      images: product.images.length ? [product.images[0]] : undefined,
      type: 'website',
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const product = getProductBySlug(slug)
  if (!product) notFound()

  const category = getCategoryBySlug(product.category)
  const related = getRelatedProducts(product, 4)

  /* بيانات منظّمة لجوجل */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.shortDescription ?? product.description,
    sku: product.sku,
    image: product.images,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'EGP',
      availability:
        product.inStock === false
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
      url: `${site.url}/product/${product.slug}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHeader
        index="/ product"
        eyebrow={category?.name ?? 'منتج'}
        title={product.name}
        breadcrumbs={[
          { href: '/shop', label: 'كل المنتجات' },
          ...(category
            ? [{ href: `/category/${category.slug}`, label: category.name }]
            : []),
        ]}
      />

      <ProductDetail product={product} />

      {related.length > 0 && (
        <section className="container-x pb-20">
          <SectionHeading
            index="+"
            eyebrow="You May Also Like"
            title="يمكن يعجبك كمان"
            href={category ? `/category/${category.slug}` : '/shop'}
          />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  )
}
