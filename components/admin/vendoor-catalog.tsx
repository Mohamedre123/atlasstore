'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { importVendoorProduct, removeVendoorProduct } from '@/app/admin/actions'
import {
  AlertIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  PlusIcon,
  SearchIcon,
  SpinnerIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { Shot } from '@/components/product/shot'
import { formatPrice } from '@/lib/format'

type VendoorRow = {
  id: number
  name: string
  seller: string | null
  main_photo: string | null
  images: string[] | null
  buy_price: number | null
  min_price: number | null
  max_price: number | null
  commission: number | null
  variants: Record<string, string[]> | null
  category_id: number | null
  category_name: string | null
}

type OurCategory = { id: string; name: string; parent_id: string | null }

/* ============================================================
   كتالوج فيندور في لوحة الإدارة
   ------------------------------------------------------------
   كل منتج بيبان معاه سعر الشراء والحد الأدنى والأقصى المسموح،
   وخانة تكتب فيها سعرك أنت (بعمولتك) وزرار + بيضيفه للمتجر.

   الألوان والمقاسات بتتضاف تلقائي — بتيجي منظّمة من فيندور
   فمش محتاج تكتبها بإيدك.
   ============================================================ */
export function VendoorCatalog({
  products,
  vendoorCategories,
  ourCategories,
  importedIds,
  page,
  pages,
  total,
  q,
  cat,
}: {
  products: VendoorRow[]
  vendoorCategories: { id: number; name: string }[]
  ourCategories: OurCategory[]
  importedIds: number[]
  page: number
  pages: number
  total: number
  q: string
  cat: string
}) {
  const router = useRouter()
  const search = useSearchParams()

  /* البحث والفلترة بيتعملوا على السيرفر — من غير المؤشّر ده
     الصفحة بتبان واقفة لحد ما الرد يوصل */
  const [navigating, startNav] = useTransition()

  const [term, setTerm] = useState(q)
  const [target, setTarget] = useState('')
  const [added, setAdded] = useState<number[]>([])
  const [removed, setRemoved] = useState<number[]>([])
  const [error, setError] = useState<{ id: number; msg: string } | null>(null)

  /* اللي في متجرنا دلوقتي = اللي جاي من السيرفر + اللي ضفناه
     في الصفحة دي − اللي شيلناه منها */
  const done = new Set(
    [...importedIds, ...added].filter((id) => !removed.includes(id))
  )

  /* البحث بيتحدّث في الرابط عشان الصفحة تفضل قابلة للمشاركة */
  useEffect(() => setTerm(q), [q])

  const goto = (next: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams(search.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v === undefined || v === '') params.delete(k)
      else params.set(k, String(v))
    }
    startNav(() => router.push(`/admin/catalog?${params.toString()}`))
  }

  return (
    <div className="mt-6">
      {/* ============ أدوات ============ */}
      <div className="card sticky top-2 z-30 p-4 backdrop-blur-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            goto({ q: term, page: 1 })
          }}
          className="grid gap-3 sm:grid-cols-[1fr_auto]"
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mist" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="دوّر باسم المنتج..."
              className="field pr-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <select
              value={cat}
              disabled={navigating}
              onChange={(e) => goto({ cat: e.target.value, page: 1 })}
              aria-label="قسم فيندور"
              className="field !py-3 !text-[12.5px] font-bold sm:!w-auto"
            >
              <option value="">كل الأقسام</option>
              {vendoorCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              disabled={navigating}
              className="btn btn-primary btn-sm"
            >
              {navigating ? (
                <SpinnerIcon className="a-spin h-4 w-4" />
              ) : (
                <SearchIcon className="h-4 w-4" />
              )}
              <span>بحث</span>
            </button>
          </div>
        </form>

        {/* القسم اللي المنتجات هتتضاف فيه */}
        <div className="mt-3 flex flex-wrap items-center gap-2.5 border-t border-white/8 pt-3">
          <span className="text-[11.5px] text-mist">يتضاف في قسم:</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="القسم في متجرك"
            className="field !w-auto !py-2 !text-[12px] font-bold"
          >
            <option value="">من غير قسم</option>
            {ourCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent_id ? '— ' : ''}
                {c.name}
              </option>
            ))}
          </select>

          {ourCategories.length === 0 && (
            <Link href="/admin/categories" className="text-[11.5px] font-bold text-brand-300 hover:underline">
              اعمل أقسام الأول
            </Link>
          )}
        </div>
      </div>

      {/* ============ النتائج ============ */}
      {products.length === 0 ? (
        <div className="card mt-5 px-6 py-20 text-center">
          <p className="display text-[17px] font-bold">
            {total === 0 ? 'الكتالوج لسه فاضي' : 'مفيش نتائج'}
          </p>
          <p className="mx-auto mt-3 max-w-[42ch] text-[13px] leading-relaxed text-mist">
            {total === 0
              ? 'دوس «تحديث الكتالوج» فوق عشان نسحب منتجات فيندور.'
              : 'جرّب كلمة تانية أو غيّر القسم.'}
          </p>
        </div>
      ) : (
        <div
          className={`mt-5 grid gap-4 transition-opacity duration-300 sm:grid-cols-2 xl:grid-cols-3 ${
            navigating ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              targetCategory={target}
              done={done.has(p.id)}
              error={error?.id === p.id ? error.msg : ''}
              onAdded={() => {
                setAdded((prev) => [...prev, p.id])
                setRemoved((prev) => prev.filter((id) => id !== p.id))
                setError(null)
              }}
              onRemoved={() => {
                setRemoved((prev) => [...prev, p.id])
                setAdded((prev) => prev.filter((id) => id !== p.id))
                setError(null)
              }}
              onError={(msg) => setError({ id: p.id, msg })}
            />
          ))}
        </div>
      )}

      {/* ============ الصفحات ============ */}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1 || navigating}
            onClick={() => goto({ page: page - 1 })}
            className="btn btn-ghost btn-sm"
          >
            <ArrowRightIcon className="h-4 w-4" />
            <span>السابق</span>
          </button>

          <span className="nums text-[12.5px] text-mist">
            {page} / {pages}
          </span>

          <button
            type="button"
            disabled={page >= pages || navigating}
            onClick={() => goto({ page: page + 1 })}
            className="btn btn-ghost btn-sm"
          >
            <span>التالي</span>
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   كارت منتج في الكتالوج
   ============================================================ */
function ProductCard({
  product,
  targetCategory,
  done,
  error,
  onAdded,
  onRemoved,
  onError,
}: {
  product: VendoorRow
  targetCategory: string
  done: boolean
  error: string
  onAdded: () => void
  onRemoved: () => void
  onError: (msg: string) => void
}) {
  const [price, setPrice] = useState('')
  const [pending, start] = useTransition()

  const buy = product.buy_price ?? 0
  const min = product.min_price ?? 0
  const max = product.max_price ?? 0
  const colors = Object.keys(product.variants ?? {})
  const sizes = [...new Set(Object.values(product.variants ?? {}).flat())]

  /* الربح لو باع بالسعر المكتوب دلوقتي */
  const typed = Number(price)
  const profit = Number.isFinite(typed) && typed > 0 ? typed - buy : null

  const remove = () => {
    if (pending) return

    /* نفس تأكيد صفحة المنتجات — الحذف نهائي */
    const sure = window.confirm(
      `هتشيل «${product.name}» من متجرك. تقدر تضيفه تاني من هنا في أي وقت.`
    )
    if (!sure) return

    start(async () => {
      const res = await removeVendoorProduct(product.id)
      if (res.ok) onRemoved()
      else onError(res.error)
    })
  }

  const add = () => {
    if (done || pending) return

    if (!price || typed <= 0) {
      onError('اكتب سعر البيع الأول')
      return
    }

    start(async () => {
      const form = new FormData()
      form.set('vendoor_id', String(product.id))
      form.set('price', price)
      form.set('category_id', targetCategory)

      const res = await importVendoorProduct(form)
      if (res.ok) onAdded()
      else onError(res.error)
    })
  }

  return (
    <article className="card overflow-hidden">
      <div className="flex gap-3 p-3">
        {/* --- الصورة --- */}
        <div className="plate relative h-[112px] w-[86px] shrink-0 rounded-xl">
          <Shot
            src={product.main_photo ?? product.images?.[0] ?? undefined}
            alt=""
            sizes="86px"
            unoptimized
          />
        </div>

        {/* --- البيانات --- */}
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[12.5px] font-bold leading-snug">
            {product.name}
          </h3>

          <p className="mt-1 truncate text-[10.5px] text-mist">
            {product.seller ?? '—'}
            {product.category_name ? ` · ${product.category_name}` : ''}
          </p>

          {/* الألوان والمقاسات — بتتضاف تلقائي */}
          <div className="mt-2 flex flex-wrap gap-1">
            {colors.slice(0, 4).map((c) => (
              <span
                key={c}
                className="rounded-full bg-white/6 px-2 py-0.5 text-[10px] text-foam/75"
              >
                {c}
              </span>
            ))}
            {colors.length > 4 && (
              <span dir="ltr" className="nums text-[10px] text-mist">
                +{colors.length - 4}
              </span>
            )}
          </div>

          {sizes.length > 0 && (
            <p className="mt-1.5 line-clamp-1 text-[10.5px] text-mist">
              مقاسات: {sizes.join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* --- الأسعار --- */}
      <div className="grid grid-cols-3 gap-px border-y border-white/8 bg-white/6 text-center">
        <Cell label="سعر الشراء" value={formatPrice(buy)} />
        <Cell label="أقل سعر" value={formatPrice(min)} />
        <Cell label="أعلى سعر" value={formatPrice(max)} />
      </div>

      {/* --- الإضافة --- */}
      <div className="p-3">
        {done ? (
          <div className="flex items-center gap-2">
            <p className="flex flex-1 items-center justify-center gap-2 rounded-full border border-ok/25 bg-ok/8 py-2.5 text-[12.5px] font-bold text-ok">
              <CheckIcon className="h-4 w-4" />
              مضاف في متجرك
            </p>

            {/* بيشيله من المتجر ويرجّع خانة السعر تاني هنا */}
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              title="شيله من متجرك"
              aria-label={`شيل ${product.name} من متجرك`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-mist transition-colors hover:border-sale/50 hover:text-sale disabled:opacity-40"
            >
              {pending ? (
                <SpinnerIcon className="a-spin h-4 w-4" />
              ) : (
                <TrashIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min={min || 1}
                  max={max || undefined}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      add()
                    }
                  }}
                  placeholder={`سعرك — من ${min} لـ ${max}`}
                  aria-label={`سعر البيع لـ ${product.name}`}
                  className="field !py-2.5 !text-[13px] font-bold"
                />
              </div>

              <button
                type="button"
                onClick={add}
                disabled={pending}
                title="أضف للمتجر"
                aria-label={`أضف ${product.name} للمتجر`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
              >
                {pending ? (
                  <SpinnerIcon className="a-spin h-5 w-5" />
                ) : (
                  <PlusIcon className="h-5 w-5" />
                )}
              </button>
            </div>

            {profit !== null && (
              <p
                className={`nums mt-2 text-center text-[11.5px] font-bold ${
                  profit > 0 ? 'text-brand-300' : 'text-sale'
                }`}
              >
                {profit > 0 ? `ربحك ${formatPrice(profit)}` : 'السعر أقل من التكلفة'}
              </p>
            )}

            {error && (
              <p className="mt-2 flex items-start gap-1.5 text-[11.5px] leading-relaxed text-sale">
                <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </article>
  )
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-abyss/50 px-2 py-2.5">
      <p className="text-[9.5px] text-mist">{label}</p>
      <p className="nums mt-0.5 text-[12px] font-bold">{value}</p>
    </div>
  )
}
