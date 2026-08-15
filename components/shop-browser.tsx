'use client'

import { useMemo, useState } from 'react'
import { categories, products as allProducts } from '@/data/products'
import { pluralize } from '@/lib/format'
import { ProductGrid } from './product-card'
import { CloseIcon, FilterIcon } from './icons'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'المميّزة أولًا' },
  { key: 'price-asc', label: 'السعر: من الأقل' },
  { key: 'price-desc', label: 'السعر: من الأعلى' },
  { key: 'name', label: 'الاسم أبجديًا' },
]

export function ShopBrowser({
  initialCategory = '',
  initialSaleOnly = false,
}: {
  initialCategory?: string
  initialSaleOnly?: boolean
}) {
  const [category, setCategory] = useState(initialCategory)
  const [saleOnly, setSaleOnly] = useState(initialSaleOnly)
  const [sort, setSort] = useState<SortKey>('featured')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const visible = useMemo(() => {
    let list = [...allProducts]

    if (category) list = list.filter((p) => p.category === category)
    if (saleOnly) list = list.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price)

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list.sort((a, b) => b.price - a.price)
        break
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'ar'))
        break
      default:
        list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
    }

    return list
  }, [category, saleOnly, sort])

  const hasFilters = Boolean(category) || saleOnly

  const clearAll = () => {
    setCategory('')
    setSaleOnly(false)
  }

  return (
    <>
      {/* ============ شريط الأدوات ============ */}
      <div className="sticky top-[58px] z-30 -mx-5 mb-9 border-y border-line bg-ivory/90 px-5 backdrop-blur-xl sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
        <div className="flex items-center justify-between gap-4 py-3.5">
          <div className="flex items-center gap-3">
            {/* زر الفلاتر على الموبايل */}
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className="flex items-center gap-2 border border-line bg-white px-3.5 py-2 text-[12.5px] font-bold text-brand-950 lg:hidden"
            >
              <FilterIcon className="h-4 w-4" />
              فلترة
              {hasFilters && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
            </button>

            <p className="nums text-[12.5px] font-bold text-brand-950">
              {pluralize(visible.length, 'منتج واحد', 'منتجان', 'منتجات')}
            </p>
          </div>

          {/* الترتيب */}
          <label className="flex items-center gap-2">
            <span className="hidden text-[12.5px] text-muted sm:inline">ترتيب</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              aria-label="ترتيب المنتجات"
              className="border border-line bg-white px-3 py-2 text-[12.5px] font-bold text-brand-950 outline-none transition-colors focus:border-brand-900"
            >
              {sortOptions.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* ============ الفلاتر ============ */}
        <div className={`${filtersOpen ? 'block' : 'hidden'} pb-4 lg:block`}>
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
            <FilterChip active={!category && !saleOnly} onClick={clearAll}>
              الكل
            </FilterChip>

            {categories.map((c) => (
              <FilterChip
                key={c.slug}
                active={category === c.slug}
                onClick={() => setCategory(category === c.slug ? '' : c.slug)}
              >
                {c.name}
              </FilterChip>
            ))}

            <span className="mx-1 h-5 w-px shrink-0 bg-line" />

            <FilterChip active={saleOnly} onClick={() => setSaleOnly((v) => !v)}>
              عليها خصم
            </FilterChip>

            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className="flex shrink-0 items-center gap-1 px-2 py-2 text-[12px] font-bold text-muted transition-colors hover:text-sale"
              >
                <CloseIcon className="h-3.5 w-3.5" />
                مسح
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============ النتائج ============ */}
      {visible.length === 0 ? (
        <div className="border border-line bg-white py-24 text-center">
          <p className="font-display text-xl font-extrabold text-brand-950">
            مفيش منتجات بالفلاتر دي
          </p>
          <p className="mt-2.5 text-[13.5px] text-muted">
            جرّب تشيل بعض الفلاتر أو تتصفّح كل المنتجات.
          </p>
          <button type="button" onClick={clearAll} className="btn btn-outline mt-7">
            <span>مسح الفلاتر</span>
          </button>
        </div>
      ) : (
        <ProductGrid products={visible} priorityCount={4} />
      )}
    </>
  )
}

function FilterChip({
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
      className={`shrink-0 whitespace-nowrap border px-4 py-2 text-[12.5px] font-bold transition-all duration-300 ${
        active
          ? 'border-brand-950 bg-brand-950 text-white'
          : 'border-line bg-white text-ink hover:border-brand-900'
      }`}
    >
      {children}
    </button>
  )
}
