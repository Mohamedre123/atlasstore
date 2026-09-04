import type { Metadata } from 'next'
import { CustomersBoard } from '@/components/admin/customers-board'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'العملاء والسلات المتروكة',
  robots: { index: false, follow: false },
}

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customer_activity')
    .select(
      'id, session_id, name, email, phone, governorate, area, address, cart, cart_count, cart_total, stage, filled, last_field, ordered, order_code, reminders, reminded_at, created_at, updated_at'
    )
    .order('updated_at', { ascending: false })
    .limit(200)

  const rows = data ?? []
  const abandoned = rows.filter((r) => !r.ordered && Number(r.cart_count) > 0)
  const reachable = abandoned.filter((r) => r.email)

  return (
    <>
      <PageHeader
        eyebrow="Customers"
        title="العملاء والسلات المتروكة"
        description="مين دخل، وقف فين، وإيه اللي ناقصه — وابعتله تذكير على قد اللي ناقصه بالظبط."
        breadcrumbs={[{ href: '/account', label: 'حسابي' }]}
        aside={
          <div className="card px-5 py-4 text-center">
            <p className="nums display grad-text text-[24px] font-bold">
              {abandoned.length}
            </p>
            <p className="mt-1 text-[11px] text-mist">سلة متروكة</p>
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
                supabase/activity.sql
              </span>{' '}
              في Supabase → SQL Editor الأول.
            </p>
            <p dir="ltr" className="mt-4 text-[11px] text-mist/60">
              {error.message}
            </p>
          </div>
        ) : (
          <CustomersBoard
            rows={rows as never}
            stats={{
              total: rows.length,
              abandoned: abandoned.length,
              reachable: reachable.length,
              ordered: rows.filter((r) => r.ordered).length,
            }}
          />
        )}
      </div>
    </>
  )
}
