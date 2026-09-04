'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  deleteProduct,
  importSeedProducts,
  linkProductToVendoor,
  moveProduct,
  saveProduct,
  searchVendoorProducts,
} from '@/app/admin/actions'
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ChevronDownIcon,
  GridIcon,
  SearchIcon,
  SpinnerIcon,
  TrashIcon,
} from '@/components/ui/icons'
import { formatPrice } from '@/lib/format'

type Row = {
  id: string
  category_id: string | null
  slug: string
  name: string
  short_description: string | null
  description: string | null
  price: number | string
  compare_at_price: number | string | null
  images: string[] | null
  variants: { name: string; options: string[] }[] | null
  badge: string | null
  featured: boolean
  in_stock: boolean
  is_active: boolean
  sort: number
  vendoor_id: number | null
  vendoor_buy: number | string | null
  vendoor_min: number | string | null
  vendoor_max: number | string | null
  vendoor_seller: string | null
}

type Cat = { id: string; name: string; parent_id: string | null }

/* ============================================================
   إدارة منتجات المتجر
   ------------------------------------------------------------
   كل منتج بيتفتح في مكانه (accordion) بدل نافذة منبثقة —
   أريح بكتير على الفون.
   ============================================================ */
export function ProductsManager({
  products,
  categories,
}: {
  products: Row[]
  categories: Cat[]
}) {
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState<string | null>(null)

  const catName = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories]
  )

  const visible = useMemo(() => {
    const q = term.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, term])

  if (products.length === 0) {
    return <EmptyState />
  }

  return (
    <div>
      <div className="relative mb-6">
        <SearchIcon className="pointer-events-none absolute right-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mist" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="دوّر في منتجاتك..."
          className="field pr-11"
        />
      </div>

      <div className="space-y-3">
        {visible.map((p) => (
          <ProductRow
            key={p.id}
            row={p}
            categories={categories}
            categoryName={p.category_id ? catName.get(p.category_id) : undefined}
            open={open === p.id}
            onToggle={() => setOpen(open === p.id ? null : p.id)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-12 text-center text-[13px] text-mist">مفيش نتائج لـ «{term}»</p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------
   لسه مفيش منتجات
   ------------------------------------------------------------
   بنعرض كمان زرار ينقل المنتجات الستة القديمة لقاعدة البيانات،
   عشان ما تختفيش من المتجر أول ما تضيف أول منتج من الكتالوج.
   ------------------------------------------------------------ */
function EmptyState() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState('')

  const move = () =>
    start(async () => {
      const res = await importSeedProducts()
      setMsg(res.ok ? `اتنقل ${res.data.count} منتج ✓` : res.error)
      if (res.ok) router.refresh()
    })

  return (
    <div className="card px-6 py-16 text-center">
      <GridIcon className="mx-auto mb-4 h-9 w-9 text-mist/50" />
      <p className="display text-[17px] font-bold">لسه مضفتش منتجات</p>
      <p className="mx-auto mt-3 max-w-[44ch] text-[13px] leading-[1.95] text-mist">
        روح لكتالوج فيندور، اكتب سعرك جنب المنتج ودوس +. المنتجات اللي هتضيفها من
        هناك أوردراتها بتروح لفيندور تلقائي.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link href="/admin/catalog" className="btn btn-primary">
          <span>افتح الكتالوج</span>
        </Link>

        <button
          type="button"
          onClick={move}
          disabled={pending}
          className="btn btn-ghost"
        >
          {pending ? (
            <>
              <SpinnerIcon className="a-spin h-4 w-4" />
              <span>بننقل...</span>
            </>
          ) : (
            <span>انقل المنتجات القديمة</span>
          )}
        </button>
      </div>

      {msg && <p className="mt-4 text-[12.5px] font-bold text-brand-300">{msg}</p>}

      <p className="mx-auto mt-5 max-w-[46ch] text-[11.5px] leading-relaxed text-mist/70">
        المنتجات القديمة مش مربوطة بفيندور، فأوردراتها هتحتاج تبعتها بإيدك. لو
        عايزها مربوطة ضيفها من الكتالوج بدل ما تنقلها.
      </p>
    </div>
  )
}

/* ------------------------------------------------------------ */

function ProductRow({
  row,
  categories,
  categoryName,
  open,
  onToggle,
}: {
  row: Row
  categories: Cat[]
  categoryName?: string
  open: boolean
  onToggle: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  const images = row.images ?? []
  const buy = row.vendoor_buy ? Number(row.vendoor_buy) : null
  const profit = buy !== null ? Number(row.price) - buy : null

  const submit = (form: FormData) => {
    setError('')
    setSaved(false)
    start(async () => {
      const res = await saveProduct(form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSaved(true)
      router.refresh()
      window.setTimeout(() => setSaved(false), 2500)
    })
  }

  const move = (direction: 'up' | 'down') =>
    start(async () => {
      const res = await moveProduct(row.id, direction)
      if (!res.ok) window.alert(res.error)
      router.refresh()
    })

  const remove = () => {
    const sure = window.confirm(`هتمسح «${row.name}» من متجرك نهائيًا. متأكد؟`)
    if (!sure) return

    start(async () => {
      const res = await deleteProduct(row.id)
      if (!res.ok) window.alert(res.error)
      router.refresh()
    })
  }

  return (
    <div className="card overflow-hidden">
      {/* --- الصف --- */}
      <div className="flex items-center gap-3 p-3">
        <div className="plate relative h-16 w-12 shrink-0 rounded-lg">
          {images[0] && (
            <Image
              src={images[0]}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-[13px] font-bold">{row.name}</p>

          <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-mist">
            <span className="nums font-bold text-brand-300">
              {formatPrice(Number(row.price))}
            </span>
            {profit !== null && (
              <span className={`nums ${profit > 0 ? '' : 'text-sale'}`}>
                ربح {formatPrice(profit)}
              </span>
            )}
            {categoryName && <span>· {categoryName}</span>}
            {!row.is_active && (
              <span className="rounded-full bg-white/8 px-2 py-0.5 text-[9.5px]">
                مخفي
              </span>
            )}
            {!row.in_stock && (
              <span className="rounded-full bg-sale/15 px-2 py-0.5 text-[9.5px] text-sale">
                خلص
              </span>
            )}
          </div>
        </div>

        <Link
          href={`/product/${row.slug}`}
          target="_blank"
          aria-label="افتح صفحة المنتج"
          className="icon-btn !h-9 !w-9 shrink-0"
        >
          <ArrowUpRightIcon className="h-4 w-4" />
        </Link>

        {/* الترتيب بالأزرار — أضمن من كتابة أرقام */}
        <div className="flex shrink-0 flex-col overflow-hidden rounded-lg border border-white/10">
          <button
            type="button"
            onClick={() => move('up')}
            disabled={pending}
            aria-label={`حرّك ${row.name} لفوق`}
            className="px-2 py-1 text-mist transition-colors hover:bg-brand-500/12 hover:text-brand-300 disabled:opacity-40"
          >
            <ChevronDownIcon className="h-3.5 w-3.5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => move('down')}
            disabled={pending}
            aria-label={`حرّك ${row.name} لتحت`}
            className="border-t border-white/10 px-2 py-1 text-mist transition-colors hover:bg-brand-500/12 hover:text-brand-300 disabled:opacity-40"
          >
            <ChevronDownIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11.5px] font-bold transition-colors hover:border-brand-500/50 hover:text-brand-300"
        >
          تعديل
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform duration-400 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      {/* --- الفورم --- */}
      <div className="acc-body" data-open={open}>
        <div>
          <form action={submit} className="border-t border-white/8 p-4">
            <input type="hidden" name="id" value={row.id} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id={`${row.id}-name`}
                name="name" label="اسم المنتج" defaultValue={row.name} required />
              <Field
                id={`${row.id}-slug`}
                name="slug" label="الرابط" defaultValue={row.slug} dir="ltr" required />

              <Field
                id={`${row.id}-price`}
                name="price"
                label="سعرك (بالعمولة)"
                type="number"
                defaultValue={String(row.price)}
                required
                hint={
                  row.vendoor_min
                    ? `فيندور بتسمح من ${row.vendoor_min} لـ ${row.vendoor_max} ج.م${
                        buy ? ` · سعر الشراء ${buy}` : ''
                      }`
                    : undefined
                }
              />

              <Field
                id={`${row.id}-compare_at_price`}
                name="compare_at_price"
                label="السعر قبل الخصم"
                type="number"
                defaultValue={
                  row.compare_at_price ? String(row.compare_at_price) : ''
                }
                hint="سيبه فاضي لو مفيش خصم"
              />

              <div>
                <label htmlFor={`cat-${row.id}`} className="label">
                  القسم
                </label>
                <select
                  id={`cat-${row.id}`}
                  name="category_id"
                  defaultValue={row.category_id ?? ''}
                  className="field"
                >
                  <option value="">من غير قسم</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parent_id ? '— ' : ''}
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                id={`${row.id}-badge`}
                name="badge"
                label="شارة على الصورة"
                defaultValue={row.badge ?? ''}
                placeholder="جديد · الأكثر مبيعًا"
              />

              <div className="sm:col-span-2">
                <Field
                id={`${row.id}-short_description`}
                name="short_description"
                  label="وصف قصير"
                  defaultValue={row.short_description ?? ''}
                  placeholder="قطن ١٠٠٪ — قصّة مضبوطة"
                  hint="بيظهر تحت الاسم في كارت المنتج"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={`desc-${row.id}`} className="label">
                  الوصف الكامل
                </label>
                <textarea
                  id={`desc-${row.id}`}
                  name="description"
                  rows={8}
                  defaultValue={row.description ?? ''}
                  className="field resize-y"
                />
                <p className="mt-2 text-[11.5px] text-mist">
                  كل سطر بيظهر فقرة لوحده في صفحة المنتج.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor={`imgs-${row.id}`} className="label">
                  الصور — رابط في كل سطر
                </label>
                <textarea
                  id={`imgs-${row.id}`}
                  name="images"
                  rows={4}
                  dir="ltr"
                  defaultValue={images.join('\n')}
                  className="field resize-y text-[12px]"
                />
                <p className="mt-2 text-[11.5px] text-mist">
                  أول صورة هي الرئيسية. جاية من فيندور، وتقدر تضيف أو ترتّب.
                </p>
              </div>

              <Field
                id={`${row.id}-sort`}
                name="sort"
                label="الترتيب"
                type="number"
                defaultValue={String(row.sort)}
                hint="الأصغر بيظهر الأول"
              />

              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 pt-6 text-[13px] font-bold">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    defaultChecked={row.is_active}
                    className="h-4 w-4 accent-[#12c9ee]"
                  />
                  ظاهر
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="in_stock"
                    defaultChecked={row.in_stock}
                    className="h-4 w-4 accent-[#12c9ee]"
                  />
                  متوفر
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="featured"
                    defaultChecked={row.featured}
                    className="h-4 w-4 accent-[#12c9ee]"
                  />
                  مميّز
                </label>
              </div>
            </div>

            {/* المنتج مش مربوط بفيندور → أوردره مش هيتبعت لهم */}
            {!row.vendoor_id && <LinkToVendoor productId={row.id} name={row.name} />}

            {/* الألوان والمقاسات — للعرض بس */}
            {row.variants && row.variants.length > 0 && (
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/4 p-4">
                <p className="mb-3 text-[12px] font-extrabold">
                  الألوان والمقاسات — جاية من فيندور
                </p>
                <div className="space-y-2.5">
                  {row.variants.map((v) => (
                    <div key={v.name} className="flex flex-wrap items-center gap-2">
                      <span className="text-[11.5px] text-mist">{v.name}:</span>
                      {v.options.map((o) => (
                        <span
                          key={o}
                          className="rounded-full bg-white/8 px-2.5 py-1 text-[11px]"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-mist">
                  بتتحدّث لوحدها مع تحديث الكتالوج — مش محتاج تكتبها.
                </p>
              </div>
            )}

            {error && (
              <p className="mt-4 flex items-start gap-2 rounded-xl border border-sale/25 bg-sale/8 px-3.5 py-2.5 text-[12px] leading-relaxed text-sale">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button type="submit" disabled={pending} className="btn btn-primary">
                {pending ? (
                  <>
                    <SpinnerIcon className="a-spin h-4 w-4" />
                    <span>بنحفظ...</span>
                  </>
                ) : saved ? (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    <span>اتحفظ</span>
                  </>
                ) : (
                  <span>حفظ التعديلات</span>
                )}
              </button>

              <button
                type="button"
                onClick={remove}
                disabled={pending}
                className="btn btn-ghost !border-sale/30 !text-sale hover:!bg-sale/10"
              >
                <TrashIcon className="h-4 w-4" />
                <span>حذف المنتج</span>
              </button>

              {row.vendoor_id && (
                <span dir="ltr" className="nums text-[11px] text-mist">
                  Vendoor #{row.vendoor_id}
                  {row.vendoor_seller ? ` · ${row.vendoor_seller}` : ''}
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------
   ربط منتج بمنتج عند فيندور
   ------------------------------------------------------------
   المنتجات اللي اتنقلت من الملف القديم مالهاش رقم عند فيندور،
   فأوردراتها بتفضل عندنا ومابتتبعتش لهم. من هنا بتدوّر على
   المنتج المقابل عندهم وتربطه — وساعتها الألوان والمقاسات
   بتتاخد منهم كمان.
   ------------------------------------------------------------ */
function LinkToVendoor({ productId, name }: { productId: string; name: string }) {
  const router = useRouter()
  const [term, setTerm] = useState(name.slice(0, 20))
  const [hits, setHits] = useState<{ id: number; name: string; photo: string | null }[]>(
    []
  )
  const [searched, setSearched] = useState(false)
  const [pending, start] = useTransition()
  const [error, setError] = useState('')

  const search = () =>
    start(async () => {
      setError('')
      const res = await searchVendoorProducts(term)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setHits(res.data)
      setSearched(true)
    })

  const link = (vendoorId: number) =>
    start(async () => {
      const res = await linkProductToVendoor(productId, vendoorId)
      if (!res.ok) {
        setError(res.error)
        return
      }
      router.refresh()
    })

  return (
    <div className="mt-5 rounded-2xl border border-warn/25 bg-warn/6 p-4">
      <p className="flex items-start gap-2 text-[12.5px] font-bold text-warn">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
        المنتج ده مش مربوط بفيندور — أوردراته مش هتتبعت لهم تلقائي
      </p>

      <p className="mt-2 text-[11.5px] leading-relaxed text-mist">
        دوّر على المنتج المقابل عندهم واربطه. لازم تعمل «تحديث الكتالوج» الأول.
      </p>

      <div className="mt-3.5 flex items-center gap-2">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              search()
            }
          }}
          placeholder="اسم المنتج عند فيندور"
          aria-label="ابحث في كتالوج فيندور"
          className="field !py-2.5 !text-[12.5px]"
        />
        <button
          type="button"
          onClick={search}
          disabled={pending}
          className="btn btn-ghost btn-sm shrink-0"
        >
          {pending ? <SpinnerIcon className="a-spin h-4 w-4" /> : <span>بحث</span>}
        </button>
      </div>

      {error && <p className="mt-2.5 text-[11.5px] text-sale">{error}</p>}

      {searched && hits.length === 0 && !error && (
        <p className="mt-3 text-[11.5px] text-mist">
          مفيش نتائج — جرّب كلمة أقصر، أو اعمل تحديث للكتالوج.
        </p>
      )}

      {hits.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {hits.map((hit) => (
            <li key={hit.id}>
              <button
                type="button"
                onClick={() => link(hit.id)}
                disabled={pending}
                className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/4 p-2 text-right transition-colors hover:border-brand-500/50 hover:bg-brand-500/8 disabled:opacity-50"
              >
                <span className="plate relative h-10 w-8 shrink-0 rounded-md">
                  {hit.photo && (
                    <Image
                      src={hit.photo}
                      alt=""
                      fill
                      sizes="32px"
                      className="object-cover"
                      unoptimized
                    />
                  )}
                </span>
                <span className="line-clamp-1 flex-1 text-[12px] font-semibold">
                  {hit.name}
                </span>
                <span dir="ltr" className="nums shrink-0 text-[10.5px] text-mist">
                  #{hit.id}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* الصفحة فيها فورم لكل منتج، فالمعرّف لازم يبقى فريد —
   من غير كده الضغط على أي label بيودّي لأول حقل في الصفحة */
function Field({
  id,
  name,
  label,
  hint,
  ...rest
}: {
  id: string
  name: string
  label: string
  hint?: string
  defaultValue?: string
  placeholder?: string
  required?: boolean
  type?: string
  dir?: 'ltr' | 'rtl'
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label} {rest.required && <span className="text-sale">*</span>}
      </label>
      <input id={id} name={name} className="field" {...rest} />
      {hint && <p className="mt-2 text-[11.5px] leading-relaxed text-mist">{hint}</p>}
    </div>
  )
}
