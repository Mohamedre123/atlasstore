import { cache } from 'react'
import {
  categories as seedCategories,
  products as seedProducts,
} from '@/data/products'
import { cleanSections, inSection, isAuto } from './home-sections'
import { createPublicClient } from './supabase/public'
import { repairImage } from './vendoor/images'
import type { Category, Product, VariantGroup } from './types'

/* ============================================================
   كتالوج المتجر
   ------------------------------------------------------------
   بيقرا الأقسام والمنتجات من قاعدة البيانات. ولو قاعدة البيانات
   مش متظبطة أو لسه فاضية، بيرجع للمنتجات المكتوبة في
   data/products.ts — فالمتجر مابيقفش في أي حالة.

   كل الدوال ملفوفة بـ cache() من React، يعني لو الصفحة نادت
   getProducts() خمس مرات في نفس الطلب، الاستعلام بيتنفّذ مرة
   واحدة بس.
   ============================================================ */

type CategoryRow = {
  id: string
  parent_id: string | null
  slug: string
  name: string
  description: string | null
  image: string | null
  sort: number
}

type ProductRow = {
  id: string
  category_id: string | null
  slug: string
  name: string
  short_description: string | null
  description: string | null
  price: number | string
  compare_at_price: number | string | null
  images: unknown
  variants: unknown
  tags: unknown
  badge: string | null
  sku: string | null
  featured: boolean
  in_stock: boolean
  sort: number
  vendoor_id: number | null
  vendoor_variants: unknown
  vendoor_buy: number | string | null
  vendoor_min: number | string | null
  vendoor_max: number | string | null
  vendoor_seller: string | null
  home_sections: unknown
}

/* ------------------------- مساعدات ------------------------- */

const num = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) ? n : undefined
}

const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function toCategory(row: CategoryRow, bySlugId: Map<string, string>): Category {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? undefined,
    image: row.image ?? undefined,
    parent: row.parent_id ? (bySlugId.get(row.parent_id) ?? null) : null,
    sort: row.sort,
  }
}

function toProduct(row: ProductRow, categorySlug: string): Product {
  const vendoorVariants = (row.vendoor_variants ?? null) as Record<
    string,
    string[]
  > | null

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description ?? undefined,
    description: row.description ?? '',
    price: Number(row.price),
    compareAtPrice: num(row.compare_at_price),
    /* المنتجات اللي اتضافت قبل ما نكتشف إن مسار صور فيندور
       القديم ميت، صورها متخزّنة بالرابط المكسور. بنصلّحه هنا
       وقت القراءة بدل ما نستنى مزامنة جديدة */
    images: arr<string>(row.images).map((src) =>
      repairImage(src, row.vendoor_id ?? undefined)
    ),
    category: categorySlug,
    variants: arr<VariantGroup>(row.variants),
    inStock: row.in_stock,
    featured: row.featured,
    homeSections: cleanSections(row.home_sections),
    badge: row.badge ?? undefined,
    tags: arr<string>(row.tags),
    sku: row.sku ?? undefined,
    sort: row.sort,
    vendoor: row.vendoor_id
      ? {
          id: row.vendoor_id,
          variants: vendoorVariants ?? {},
          buy: num(row.vendoor_buy),
          min: num(row.vendoor_min),
          max: num(row.vendoor_max),
          seller: row.vendoor_seller ?? undefined,
        }
      : undefined,
  }
}

/* ============================================================
   القراءة من قاعدة البيانات
   ============================================================ */

type Catalog = { categories: Category[]; products: Product[]; fromDb: boolean }

async function loadCatalog(): Promise<Catalog> {
  const supabase = createPublicClient()

  if (!supabase) {
    return { categories: [...seedCategories], products: [...seedProducts], fromDb: false }
  }

  try {
    const [catRes, prodRes] = await Promise.all([
      supabase
        .from('categories')
        .select('id, parent_id, slug, name, description, image, sort')
        .order('sort', { ascending: true })
        .order('name', { ascending: true }),
      supabase
        .from('products')
        .select(
          'id, category_id, slug, name, short_description, description, price, compare_at_price, images, variants, tags, badge, sku, featured, in_stock, sort, vendoor_id, vendoor_variants, vendoor_buy, vendoor_min, vendoor_max, vendoor_seller, home_sections'
        )
        .order('sort', { ascending: true })
        .order('created_at', { ascending: false }),
    ])

    /* الجداول لسه ما اتعملتش، أو حصل خطأ — نرجع للملف الثابت */
    if (catRes.error || prodRes.error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          'الكتالوج: قراءة قاعدة البيانات فشلت، بنستخدم data/products.ts —',
          catRes.error?.message || prodRes.error?.message
        )
      }
      return {
        categories: [...seedCategories],
        products: [...seedProducts],
        fromDb: false,
      }
    }

    const catRows = (catRes.data ?? []) as CategoryRow[]
    const prodRows = (prodRes.data ?? []) as ProductRow[]

    /* لسه ما ضفناش حاجة من اللوحة — نعرض المنتجات الأصلية */
    if (catRows.length === 0 && prodRows.length === 0) {
      return {
        categories: [...seedCategories],
        products: [...seedProducts],
        fromDb: false,
      }
    }

    const slugById = new Map(catRows.map((c) => [c.id, c.slug]))

    return {
      categories: catRows.map((c) => toCategory(c, slugById)),
      products: prodRows.map((p) =>
        toProduct(p, (p.category_id && slugById.get(p.category_id)) || '')
      ),
      fromDb: true,
    }
  } catch (err) {
    console.error('الكتالوج: خطأ غير متوقع —', err)
    return { categories: [...seedCategories], products: [...seedProducts], fromDb: false }
  }
}

/** الكتالوج كامل — استعلام واحد لكل طلب مهما اتنادى كام مرة */
export const getCatalog = cache(loadCatalog)

/* ============================================================
   دوال جاهزة للصفحات
   ============================================================ */

/** الأقسام كلها مسطّحة (رئيسية وفرعية) */
export async function getCategories(): Promise<Category[]> {
  return (await getCatalog()).categories
}

/**
 * الأقسام على شكل شجرة: كل قسم رئيسي ومعاه أقسامه الفرعية.
 * بتستخدم في الهيدر (قوايم منسدلة) وقايمة الفون.
 */
export async function getCategoryTree(): Promise<Category[]> {
  const all = await getCategories()
  const roots = all.filter((c) => !c.parent)

  return roots.map((root) => ({
    ...root,
    children: all.filter((c) => c.parent === root.slug),
  }))
}

export async function getProducts(): Promise<Product[]> {
  return (await getCatalog()).products
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug)
}

/**
 * منتجات قسم — بتشمل منتجات أقسامه الفرعية كمان.
 * يعني لو فتحت «تيشرتات» هتلاقي فيها «تيشرتات كورة» برضه.
 */
export async function getProductsByCategory(slug: string): Promise<Product[]> {
  const [all, cats] = await Promise.all([getProducts(), getCategories()])
  const childSlugs = cats.filter((c) => c.parent === slug).map((c) => c.slug)
  const wanted = new Set([slug, ...childSlugs])

  return all.filter((p) => wanted.has(p.category))
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getProducts()).find((p) => p.slug === slug)
}

/* ------------------------------------------------------------
   سكاشن الصفحة الرئيسية
   ------------------------------------------------------------
   في كل سيكشن بنبدأ باللي أشّرت عليه بإيدك، وبعدين بنكمّل
   العدد من المنتجات السايبة على التلقائي. المنتج اللي أشّرت
   عليه لسيكشن تاني مابيتحطش هنا لوحده — شوف lib/home-sections
   ------------------------------------------------------------ */

/** بيلزق قايمتين ويشيل المكرر ويقص على العدد */
function take(picked: Product[], filler: Product[], limit: number): Product[] {
  const seen = new Set<string>()
  return [...picked, ...filler]
    .filter((p) => !seen.has(p.id) && seen.add(p.id))
    .slice(0, limit)
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const all = await getProducts()

  const picked = all.filter((p) => inSection(p.homeSections, 'hero'))
  const auto = all.filter((p) => isAuto(p.homeSections))

  /* الواجهة عمرها ما تفضل فاضية — بنكمّلها بالمميّز وبعدين بأي حاجة */
  return take(picked, [...auto.filter((p) => p.featured), ...auto], limit)
}

/** الأكثر مبيعًا — خليط من كل الأقسام الرئيسية */
export async function getBestSellers(limit = 8): Promise<Product[]> {
  const [all, cats] = await Promise.all([getProducts(), getCategories()])

  const picked = all.filter((p) => inSection(p.homeSections, 'best'))
  const auto = all.filter((p) => isAuto(p.homeSections))

  /* التلقائي = خليط من كل قسم رئيسي عشان الصف ما يبقاش من قسم واحد */
  const mix: Product[] = []
  for (const root of cats.filter((c) => !c.parent)) {
    const childSlugs = cats.filter((c) => c.parent === root.slug).map((c) => c.slug)
    const wanted = new Set([root.slug, ...childSlugs])
    mix.push(...auto.filter((p) => wanted.has(p.category)).slice(0, 3))
  }

  return take(picked, mix.length ? mix : auto, limit)
}

/**
 * منتجات صف القسم في الصفحة الرئيسية.
 * غير getProductsByCategory اللي بترجّع القسم كله — دي
 * بتحترم اللي أشّرت عليه.
 */
export async function getCategoryRail(
  slug: string,
  limit = 8
): Promise<Product[]> {
  const items = await getProductsByCategory(slug)

  const picked = items.filter((p) => inSection(p.homeSections, 'category'))
  const auto = items.filter((p) => isAuto(p.homeSections))

  return take(picked, auto, limit)
}

export async function getSaleProducts(limit = 8): Promise<Product[]> {
  const all = await getProducts()
  const discounted = (p: Product) => Boolean(p.compareAtPrice && p.compareAtPrice > p.price)

  const picked = all.filter((p) => inSection(p.homeSections, 'sale'))
  const auto = all.filter((p) => isAuto(p.homeSections) && discounted(p))

  return take(picked, auto, limit)
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<Product[]> {
  const all = await getProducts()
  const same = all.filter((p) => p.category === product.category && p.id !== product.id)
  const others = all.filter((p) => p.category !== product.category && p.id !== product.id)
  return [...same, ...others].slice(0, limit)
}

/** عدد المنتجات في كل قسم — بيشمل الأقسام الفرعية */
export async function getCategoryCounts(): Promise<Record<string, number>> {
  const [all, cats] = await Promise.all([getProducts(), getCategories()])

  return cats.reduce<Record<string, number>>((acc, c) => {
    const childSlugs = cats.filter((x) => x.parent === c.slug).map((x) => x.slug)
    const wanted = new Set([c.slug, ...childSlugs])
    acc[c.slug] = all.filter((p) => wanted.has(p.category)).length
    return acc
  }, {})
}
