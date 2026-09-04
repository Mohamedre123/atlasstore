import type { MetadataRoute } from 'next'
import { site } from '@/data/site'
import { getCategories, getProducts } from '@/lib/catalog'

/* ============================================================
   خريطة الموقع — جوجل بيقراها من /sitemap.xml
   ------------------------------------------------------------
   بتتولّد من الأقسام والمنتجات اللي في قاعدة البيانات، فأي
   منتج تضيفه من اللوحة بيدخلها لوحده.
   ============================================================ */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const [categories, products] = await Promise.all([getCategories(), getProducts()])

  const staticPages = [
    { path: '', priority: 1 },
    { path: '/shop', priority: 0.9 },
    { path: '/shipping', priority: 0.5 },
    { path: '/returns', priority: 0.5 },
    { path: '/size-guide', priority: 0.6 },
    { path: '/faq', priority: 0.6 },
  ]

  return [
    ...staticPages.map((page) => ({
      url: `${site.url}${page.path}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: page.priority,
    })),

    ...categories.map((c) => ({
      url: `${site.url}/category/${c.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),

    ...products.map((p) => ({
      url: `${site.url}/product/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    })),
  ]
}
