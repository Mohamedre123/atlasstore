import type { Metadata } from 'next'
import { CategoriesManager } from '@/components/admin/categories-manager'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'الأقسام',
  robots: { index: false, follow: false },
}

export default async function AdminCategoriesPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categories')
    .select('id, parent_id, slug, name, description, image, sort, is_active')
    .order('sort')
    .order('name')

  /* عدد المنتجات في كل قسم */
  const { data: counts } = await supabase.from('products').select('category_id')

  const perCategory = (counts ?? []).reduce<Record<string, number>>((acc, r) => {
    const id = r.category_id as string | null
    if (id) acc[id] = (acc[id] ?? 0) + 1
    return acc
  }, {})

  return (
    <>
      <PageHeader
        eyebrow="Categories"
        title="الأقسام"
        description="اعمل أقسام بصور، وحط أقسام فرعية تحتها — بتظهر كقايمة منسدلة في الهيدر وفي قايمة الفون."
        breadcrumbs={[{ href: '/account', label: 'حسابي' }]}
      />

      <div className="shell py-8 lg:py-12">
        {error ? (
          <div className="card px-6 py-12 text-center">
            <p className="display text-[17px] font-bold">قاعدة البيانات مش جاهزة</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[13px] leading-[1.95] text-mist">
              شغّل ملف{' '}
              <span className="font-[family-name:var(--font-label)]">
                supabase/catalog.sql
              </span>{' '}
              في Supabase → SQL Editor الأول.
            </p>
            <p dir="ltr" className="mt-4 text-[11px] text-mist/60">
              {error.message}
            </p>
          </div>
        ) : (
          <CategoriesManager
            categories={(data ?? []) as never}
            counts={perCategory}
          />
        )}
      </div>
    </>
  )
}
