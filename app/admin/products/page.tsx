import type { Metadata } from 'next'
import { ProductsManager } from '@/components/admin/products-manager'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'منتجاتي',
  robots: { index: false, follow: false },
}

const FIELDS =
  'id, category_id, slug, name, short_description, description, price, compare_at_price, images, variants, badge, featured, in_stock, is_active, sort, vendoor_id, vendoor_buy, vendoor_min, vendoor_max, vendoor_seller'

type Client = Awaited<ReturnType<typeof createClient>>

const load = (supabase: Client, fields: string) =>
  supabase
    .from('products')
    .select(fields)
    .order('sort')
    .order('created_at', { ascending: false })

export default async function AdminProductsPage() {
  const supabase = await createClient()

  const [firstTry, { data: cats }] = await Promise.all([
    load(supabase, `${FIELDS}, home_sections`),
    supabase.from('categories').select('id, name, parent_id').order('sort').order('name'),
  ])

  /* عمود home_sections لسه ما اتضافش — بنشتغل من غيره لحد ما
     تشغّل supabase/home-sections.sql */
  const { data, error } =
    firstTry.error && /home_sections/i.test(firstTry.error.message)
      ? await load(supabase, FIELDS)
      : firstTry

  return (
    <>
      <PageHeader
        eyebrow="My Products"
        title="منتجاتي"
        description="عدّل الاسم والوصف والسعر والصور والقسم. الألوان والمقاسات جاية من فيندور تلقائي."
        breadcrumbs={[{ href: '/account', label: 'حسابي' }]}
        aside={
          <div className="card px-5 py-4 text-center">
            <p className="nums display grad-text text-[24px] font-bold">
              {data?.length ?? 0}
            </p>
            <p className="mt-1 text-[11px] text-mist">منتج في متجرك</p>
          </div>
        }
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
          <ProductsManager
            products={(data ?? []) as never}
            categories={(cats ?? []) as never}
          />
        )}
      </div>
    </>
  )
}
