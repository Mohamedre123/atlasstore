'use client'

import { useEffect, useMemo, useState } from 'react'
import { ProductGrid } from '@/components/product/product-card'
import { CloseIcon, FilterIcon, SortIcon } from '@/components/ui/icons'
import { formatPrice, pluralize } from '@/lib/format'
import type { Category, Product } from '@/lib/types'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'discount' | 'name'

const sorts: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'المميّزة أولًا' },
  { key: 'price-asc', label: 'السعر: من الأقل' },
  { key: 'price-desc', label: 'السعر: من الأعلى' },
  { key: 'discount', label: 'أعلى خصم' },
  { key: 'name', label: 'الاسم أبجديًا' },
]

type Band = { key: string; label: string; min: number; max: number }

/**
 * شرايح السعر بتتحسب من أسعار المجموعة نفسها.
 * كنا حاططينها ثابتة (٥٠٠ · ٦٠٠) وده كان بيبوظ أول ما تضيف
 * منتجات بأسعار مختلفة.
 */
function buildBands(products: Product[]): Band[] {
  if (products.length < 4) return []

  const prices = products.map((p) => p.price).sort((a, b) => a - b)
  const low = prices[0]
  const high = prices[prices.length - 1]
  if (high - low < 50) return []

  const third = (n: number) => Math.round((low + ((high - low) * n) / 3) / 10) * 10
  const a = third(1)
  const b = third(2)

  return [
    { key: 'a', label: `أقل من ${a}`, min: 0, max: a - 1 },
    { key: 'b', label: `${a} — ${b}`, min: a, max: b },
    { key: 'c', label: `أكتر من ${b}`, min: b + 1, max: Infinity },
  ]
}

export function ShopBrowser({
  products: allProducts,
  categories,
  initialCategory = '',
  initialSaleOnly = false,
  lockCategory = false,
}: {
  products: Product[]
  categories: Category[]
  initialCategory?: string
  initialSaleOnly?: boolean
  /** في صفحة القسم مش بنسيب العميل يغيّر القسم من الفلاتر */
  lockCategory?: boolean
}) {
  const [category, setCategory] = useState(initialCategory)
  const [saleOnly, setSaleOnly] = useState(initialSaleOnly)
  const [band, setBand] = useState('')
  const [sort, setSort] = useState<SortKey>('featured')
  const [sheet, setSheet] = useState(false)

  useEffect(() => {
    document.body.classList.toggle('locked', sheet)
    return () => document.body.classList.remove('locked')
  }, [sheet])

  const bands = useMemo(() => buildBands(allProducts), [allProducts])

  /* القسم بيشمل أقسامه الفرعية */
  const inCategory = useMemo(() => {
    const children = new Map<string, Set<string>>()
    for (const c of categories) {
      const set = new Set([c.slug])
      categories.filter((x) => x.parent === c.slug).forEach((x) => set.add(x.slug))
      children.set(c.slug, set)
    }
    return children
  }, [categories])

  const visible = useMemo(() => {
    let list = [...allProducts]

    if (category) {
      const wanted = inCategory.get(category) ?? new Set([category])
      list = list.filter((p) => wanted.has(p.category))
    }
    if (saleOnly) list = list.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)

    if (band) {
      const range = bands.find((b) => b.key === band)
      if (range) list = list.filter((p) => p.price >= range.min && p.price <= range.max)
    }

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'discount':
        list.sort(
          (a, b) =>
            (b.compareAtPrice ? b.compareAtPrice - b.price : 0) -
            (a.compareAtPrice ? a.compareAtPrice - a.price : 0)
        )
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
        break
      default:
        list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    }

    return list
  }, [allProducts, bands, inCategory, category, saleOnly, band, sort])

  const active =
    (lockCategory ? 0 : category ? 1 : 0) + (saleOnly ? 1 : 0) + (band ? 1 : 0)

  const clearAll = () => {
    if (!lockCategory) setCategory('')
    setSaleOnly(false)
    setBand('')
  }

  const cheapest = Math.min(...visible.map((p) => p.price))
  const dearest = Math.max(...visible.map((p) => p.price))

  /* ---------- مجموعة الفلاتر (بتتعاد في العمود وفي اللوحة) ---------- */
  const filters = (
    <div className="space-y-7">
      {!lockCategory && (
        <FilterGroup title="القسم">
          <Chip active={!category} onClick={() => setCategory('')}>
            كل الأقسام
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.slug}
              active={category === c.slug}
              onClick={() => setCategory(category === c.slug ? '' : c.slug)}
            >
              {c.parent ? `— ${c.name}` : c.name}
            </Chip>
          ))}
        </FilterGroup>
      )}

      {bands.length > 0 && (
        <FilterGroup title="السعر">
          <Chip active={!band} onClick={() => setBand('')}>
            كل الأسعار
          </Chip>
          {bands.map((b) => (
            <Chip
              key={b.key}
              active={band === b.key}
              onClick={() => setBand(band === b.key ? '' : b.key)}
            >
              {b.label}
            </Chip>
          ))}
        </FilterGroup>
      )}

      <FilterGroup title="عروض">
        <Chip active={saleOnly} onClick={() => setSaleOnly((v) => !v)}>
          عليها خصم
        </Chip>
      </FilterGroup>

      {active > 0 && (
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-1.5 text-[12.5px] font-bold text-sale transition-opacity hover:opacity-75"
        >
          <CloseIcon className="h-3.5 w-3.5" />
          مسح الفلاتر ({active})
        </button>
      )}
    </div>
  )

  return (
    <div className="grid gap-8 lg:grid-cols-[232px_1fr] lg:gap-12">
      {/* ============ عمود الفلاتر — كمبيوتر ============ */}
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <p className="tag mb-5">Filters</p>
          {filters}
        </div>
      </aside>

      {/* ============ النتائج ============ */}
      <div>
        {/* --- شريط الأدوات --- */}
        <div className="mb-7 flex items-center justify-between gap-3 border-b border-white/8 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSheet(true)}
              className="btn btn-ghost btn-sm lg:hidden"
            >
              <FilterIcon className="h-4 w-4" />
              <span>فلترة</span>
              {active > 0 && (
                <span className="nums flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-ink">
                  {active}
                </span>
              )}
            </button>

            <p className="nums text-[12.5px] text-mist">
              <span className="font-bold text-foam">{visible.length}</span>{' '}
              {pluralize(visible.length, 'منتج', 'منتجان', 'منتج')}
              {visible.length > 0 && (
                <span className="hidden sm:inline">
                  {' '}
                  · من {formatPrice(cheapest)} لـ {formatPrice(dearest)}
                </span>
              )}
            </p>
          </div>

          <label className="flex items-center gap-2">
            <SortIcon className="hidden h-4 w-4 text-mist sm:block" />
            <span className="sr-only">ترتيب المنتجات</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="ترتيب المنتجات"
              className="field !w-auto !py-2.5 !text-[12.5px] font-bold"
            >
              {sorts.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {visible.length === 0 ? (
          <div className="card px-6 py-24 text-center">
            <p className="display text-[19px] font-bold">مفيش منتجات بالفلاتر دي</p>
            <p className="mx-auto mt-3 max-w-[34ch] text-[13px] leading-relaxed text-mist">
              جرّب تشيل فلتر أو اتنين، أو اتفرّج على المجموعة كلها.
            </p>
            <button type="button" onClick={clearAll} className="btn btn-ghost mt-7">
              <span>مسح الفلاتر</span>
            </button>
          </div>
        ) : (
          <ProductGrid products={visible} priorityCount={4} />
        )}
      </div>

      {/* ============ لوحة الفلاتر — فون ============ */}
      {sheet && (
        <div
          className="fixed inset-0 z-[80] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="فلترة المنتجات"
        >
          <button
            type="button"
            onClick={() => setSheet(false)}
            aria-label="إغلاق الفلاتر"
            className="scrim a-fade"
          />

          <div className="a-drawer absolute inset-y-0 left-0 flex w-full max-w-[330px] flex-col border-l border-white/8 bg-deep">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <p className="display text-[16px] font-bold">فلترة</p>
              <button
                type="button"
                onClick={() => setSheet(false)}
                aria-label="إغلاق"
                className="icon-btn -ml-2"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">{filters}</div>

            <div className="border-t border-white/8 px-5 py-4">
              <button
                type="button"
                onClick={() => setSheet(false)}
                className="btn btn-primary btn-block"
              >
                <span>
                  عرض {visible.length}{' '}
                  {pluralize(visible.length, 'منتج', 'منتجان', 'منتج')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================ */

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-3 text-[12px] font-extrabold text-foam">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-2 text-[12.5px] font-bold transition-all duration-400 ${
        active
          ? 'border-transparent bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)]'
          : 'border-white/12 bg-white/4 text-foam/80 hover:border-brand-500/50 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}
