'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteCategory, saveCategory } from '@/app/admin/actions'
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  LayersIcon,
  PlusIcon,
  SpinnerIcon,
  TrashIcon,
} from '@/components/ui/icons'

type Row = {
  id: string
  parent_id: string | null
  slug: string
  name: string
  description: string | null
  image: string | null
  sort: number
  is_active: boolean
}

/* ============================================================
   إدارة الأقسام
   ------------------------------------------------------------
   القسم اللي ليه «قسم أب» بيظهر تحته كقايمة فرعية في الهيدر
   وفي قايمة الفون — مثلاً «تيشرتات» وتحتها «تيشرتات كورة».
   ============================================================ */
export function CategoriesManager({
  categories,
  counts,
}: {
  categories: Row[]
  counts: Record<string, number>
}) {
  const [editing, setEditing] = useState<Row | 'new' | null>(null)

  const roots = categories.filter((c) => !c.parent_id)
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id)

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10">
      {/* ============ القايمة ============ */}
      <div>
        <div className="mb-5 flex items-center justify-between gap-4">
          <p className="nums text-[12.5px] text-mist">
            <span className="font-bold text-foam">{categories.length}</span> قسم
          </p>

          <button
            type="button"
            onClick={() => setEditing('new')}
            className="btn btn-primary btn-sm lg:hidden"
          >
            <PlusIcon className="h-4 w-4" />
            <span>قسم جديد</span>
          </button>
        </div>

        {categories.length === 0 ? (
          <div className="card px-6 py-16 text-center">
            <LayersIcon className="mx-auto mb-4 h-9 w-9 text-mist/50" />
            <p className="display text-[17px] font-bold">لسه مفيش أقسام</p>
            <p className="mx-auto mt-3 max-w-[38ch] text-[13px] leading-relaxed text-mist">
              اعمل أول قسم من الفورم، وبعدها تقدر تحط تحته أقسام فرعية.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {roots.map((root) => (
              <div key={root.id} className="card overflow-hidden">
                <CategoryRow
                  row={root}
                  count={counts[root.id] ?? 0}
                  onEdit={() => setEditing(root)}
                />

                {childrenOf(root.id).length > 0 && (
                  <div className="border-t border-white/8 bg-abyss/40 pr-6">
                    {childrenOf(root.id).map((child) => (
                      <CategoryRow
                        key={child.id}
                        row={child}
                        count={counts[child.id] ?? 0}
                        onEdit={() => setEditing(child)}
                        nested
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* أقسام فرعية أبوها اتمسح */}
            {categories
              .filter((c) => c.parent_id && !roots.some((r) => r.id === c.parent_id))
              .map((orphan) => (
                <div key={orphan.id} className="card overflow-hidden">
                  <CategoryRow
                    row={orphan}
                    count={counts[orphan.id] ?? 0}
                    onEdit={() => setEditing(orphan)}
                  />
                </div>
              ))}
          </div>
        )}
      </div>

      {/* ============ الفورم ============ */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <CategoryForm
          key={editing === 'new' ? 'new' : (editing?.id ?? 'empty')}
          row={editing === 'new' || editing === null ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      </aside>
    </div>
  )
}

/* ------------------------------------------------------------ */

function CategoryRow({
  row,
  count,
  onEdit,
  nested = false,
}: {
  row: Row
  count: number
  onEdit: () => void
  nested?: boolean
}) {
  const router = useRouter()
  const [pending, start] = useTransition()

  const remove = () => {
    const sure = window.confirm(
      `هتمسح قسم «${row.name}»${count ? ` وفيه ${count} منتج` : ''}.\n\nالمنتجات مش هتتمسح بس هتفضل من غير قسم. متأكد؟`
    )
    if (!sure) return

    start(async () => {
      const res = await deleteCategory(row.id)
      if (!res.ok) window.alert(res.error)
      router.refresh()
    })
  }

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${
        nested ? 'border-b border-white/6 last:border-b-0' : ''
      }`}
    >
      <div className="plate relative h-12 w-12 shrink-0 rounded-xl">
        {row.image ? (
          <Image
            src={row.image}
            alt=""
            fill
            sizes="48px"
            className="object-contain p-1"
            unoptimized
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-ink/30">
            <LayersIcon className="h-5 w-5" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[13px] font-bold">
          {nested && <span className="text-mist">↳</span>}
          <span className="truncate">{row.name}</span>
          {!row.is_active && (
            <span className="shrink-0 rounded-full bg-white/8 px-2 py-0.5 text-[9.5px] text-mist">
              مخفي
            </span>
          )}
        </p>
        <p dir="ltr" className="mt-0.5 truncate text-right text-[10.5px] text-mist">
          /{row.slug} · {count} منتج
        </p>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[11.5px] font-bold transition-colors hover:border-brand-500/50 hover:text-brand-300"
      >
        تعديل
      </button>

      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label={`حذف ${row.name}`}
        className="shrink-0 rounded-full p-2 text-mist transition-colors hover:bg-sale/10 hover:text-sale disabled:opacity-40"
      >
        {pending ? (
          <SpinnerIcon className="a-spin h-4 w-4" />
        ) : (
          <TrashIcon className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------ */

function CategoryForm({
  row,
  categories,
  onClose,
}: {
  row: Row | null
  categories: Row[]
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  /* الأقسام اللي ينفع تبقى أب — من غير القسم نفسه ومن غير
     الأقسام الفرعية (مستوى واحد كفاية) */
  const parents = categories.filter((c) => !c.parent_id && c.id !== row?.id)

  const submit = (form: FormData) => {
    setError('')
    setSaved(false)

    start(async () => {
      const res = await saveCategory(form)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setSaved(true)
      router.refresh()
      window.setTimeout(() => setSaved(false), 2500)
      if (!row) onClose()
    })
  }

  return (
    <form action={submit} className="card p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="display text-[16px] font-bold">
          {row ? 'تعديل القسم' : 'قسم جديد'}
        </h2>

        {row && (
          <button
            type="button"
            onClick={onClose}
            aria-label="إلغاء التعديل"
            className="icon-btn !h-8 !w-8"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="space-y-4">
        <Field name="name" label="اسم القسم" defaultValue={row?.name} required placeholder="تيشرتات" />

        <Field
          name="slug"
          label="الرابط"
          defaultValue={row?.slug}
          dir="ltr"
          placeholder="tshirts — سيبه فاضي ويتعمل لوحده"
          hint="بيظهر في العنوان: /category/tshirts"
        />

        <div>
          <label htmlFor="parent_id" className="label">
            تحت قسم
          </label>
          <select
            id="parent_id"
            name="parent_id"
            defaultValue={row?.parent_id ?? ''}
            className="field"
          >
            <option value="">قسم رئيسي</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-[11.5px] text-mist">
            لو اخترت قسم، ده هيبقى قسم فرعي بيظهر في قايمة منسدلة تحته.
          </p>
        </div>

        <Field
          name="description"
          label="وصف قصير"
          defaultValue={row?.description ?? ''}
          placeholder="قطن ١٠٠٪ بقصّات وخامات مختارة"
        />

        <Field
          name="image"
          label="رابط الصورة"
          defaultValue={row?.image ?? ''}
          dir="ltr"
          placeholder="/img/cat-tshirts.webp أو https://..."
          hint="الصورة اللي بتظهر في كارت القسم بالصفحة الرئيسية"
        />

        <Field
          name="sort"
          label="الترتيب"
          type="number"
          defaultValue={String(row?.sort ?? 0)}
          hint="الأصغر بيظهر الأول"
        />

        <label className="flex items-center gap-2.5 text-[13px] font-bold">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={row ? row.is_active : true}
            className="h-4 w-4 accent-[#12c9ee]"
          />
          ظاهر في المتجر
        </label>
      </div>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-sale/25 bg-sale/8 px-3.5 py-2.5 text-[12px] leading-relaxed text-sale">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block mt-5">
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
          <>
            <PlusIcon className="h-4 w-4" />
            <span>{row ? 'حفظ التعديلات' : 'إضافة القسم'}</span>
          </>
        )}
      </button>
    </form>
  )
}

function Field({
  name,
  label,
  hint,
  ...rest
}: {
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
      <label htmlFor={name} className="label">
        {label} {rest.required && <span className="text-sale">*</span>}
      </label>
      <input id={name} name={name} className="field" {...rest} />
      {hint && <p className="mt-2 text-[11.5px] text-mist">{hint}</p>}
    </div>
  )
}
