import type { Metadata } from 'next'
import { PageHeader } from '@/components/layout/page-header'
import { VendoorCatalog } from '@/components/admin/vendoor-catalog'
import { VendoorSync } from '@/components/admin/vendoor-sync'
import { createClient } from '@/lib/supabase/server'
import { repairImage, vendoorImages } from '@/lib/vendoor/images'

export const metadata: Metadata = {
  title: 'كتالوج فيندور',
  robots: { index: false, follow: false },
}

/* السحب من فيندور بياخد وقت — بنسيب للسيرفر مهلة أطول */
export const maxDuration = 60

const PER_PAGE = 24

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string; page?: string }>
}) {
  const params = await searchParams
  const q = (params.q ?? '').trim()
  const cat = (params.cat ?? '').trim()
  const page = Math.max(1, Number(params.page) || 1)

  const supabase = await createClient()

  /* --- منتجات فيندور المحفوظة عندنا --- */
  let query = supabase
    .from('vendoor_products')
    .select(
      'id, name, seller, main_photo, images, buy_price, min_price, max_price, commission, variants, category_id, category_name',
      { count: 'exact' }
    )

  if (q) query = query.ilike('name', `%${q}%`)
  if (cat) query = query.eq('category_id', Number(cat))

  const from = (page - 1) * PER_PAGE
  const { data, count, error } = await query
    .order('id', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  /* --- الأقسام المتاحة للفلترة --- */
  const { data: catRows } = await supabase
    .from('vendoor_products')
    .select('category_id, category_name')
    .order('category_name')

  const vendoorCategories = [
    ...new Map(
      (catRows ?? [])
        .filter((r) => r.category_id)
        .map((r) => [r.category_id as number, r.category_name as string])
    ).entries(),
  ].map(([id, name]) => ({ id, name }))

  /* --- أقسام متجرنا (عشان نحط المنتج في قسم) --- */
  const { data: ourCategories } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .order('sort')
    .order('name')

  /* --- المنتجات المضافة عندنا بالفعل --- */
  const { data: imported } = await supabase
    .from('products')
    .select('vendoor_id')
    .not('vendoor_id', 'is', null)

  const importedIds = new Set(
    (imported ?? []).map((r) => r.vendoor_id as number)
  )

  /* الصفوف اللي اتسحبت قبل تصليح مسار الصور لسه فيها الرابط
     المكسور — بنصلّحه وقت العرض عشان الكتالوج يبان صح من غير
     ما تعيد المزامنة */
  const products = (data ?? []).map((row) => {
    const images = vendoorImages(row.main_photo, row.images as unknown[]).map((src) =>
      repairImage(src, row.id as number)
    )

    return { ...row, main_photo: images[0] ?? null, images }
  })

  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  return (
    <>
      <PageHeader
        eyebrow="Vendoor Catalog"
        title="كتالوج فيندور"
        description="كل منتجات فيندور. اكتب سعرك ودوس + عشان تضيفه لمتجرك."
        breadcrumbs={[{ href: '/account', label: 'حسابي' }]}
        aside={
          <div className="card px-5 py-4 text-center">
            <p className="nums display grad-text text-[24px] font-bold">{total}</p>
            <p className="mt-1 text-[11px] text-mist">منتج في الكتالوج</p>
          </div>
        }
      />

      <div className="shell py-8 lg:py-12">
        <VendoorSync />

        {error ? (
          <div className="card mt-6 px-6 py-12 text-center">
            <p className="display text-[17px] font-bold">قاعدة البيانات مش جاهزة</p>
            <p className="mx-auto mt-3 max-w-[46ch] text-[13px] leading-[1.95] text-mist">
              شغّل ملف <span className="font-[family-name:var(--font-label)]">supabase/catalog.sql</span>{' '}
              في Supabase → SQL Editor الأول.
            </p>
            <p dir="ltr" className="mt-4 text-[11px] text-mist/60">
              {error.message}
            </p>
          </div>
        ) : (
          <VendoorCatalog
            products={products as never}
            vendoorCategories={vendoorCategories}
            ourCategories={(ourCategories ?? []) as never}
            importedIds={[...importedIds]}
            page={page}
            pages={pages}
            total={total}
            q={q}
            cat={cat}
          />
        )}
      </div>
    </>
  )
}
