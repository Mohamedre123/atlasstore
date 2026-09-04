import type { Metadata } from 'next'
import { CustomersBoard } from '@/components/admin/customers-board'
import { PageHeader } from '@/components/layout/page-header'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'العملاء والسلات المتروكة',
  robots: { index: false, follow: false },
}

/* ------------------------------------------------------------
   ربط الأوردرات بالعميل
   ------------------------------------------------------------
   صف النشاط واحد لكل زائر، فلو العميل طلب تلات مرات بيفضل صف
   واحد وفيه كود آخر أوردر بس. عشان كده بنجيب الأوردرات كلها
   ونوزّعها على أصحابها — الحساب الأول، وبعدين الإيميل أو
   الموبايل للزوّار اللي طلبوا من غير تسجيل دخول.
   ------------------------------------------------------------ */

const digits = (v: unknown) => String(v ?? '').replace(/\D/g, '').slice(-10)
const lower = (v: unknown) => String(v ?? '').trim().toLowerCase()

type OrderRow = {
  id: string
  user_id: string | null
  order_code: string
  customer: { email?: string; phone?: string; phoneAlt?: string } | null
  total: number
  status: string
  created_at: string
  vendoor_status: string | null
  vendoor_order_code: string | null
  vendoor_error: string | null
}

type ActivityRow = {
  id: string
  user_id: string | null
  email: string | null
  phone: string | null
  order_code: string | null
}

/** أوردرات كل صف نشاط، مرتبة من الأحدث للأقدم */
function groupOrders(
  rows: ActivityRow[],
  orders: OrderRow[]
): Record<string, OrderRow[]> {
  const out: Record<string, OrderRow[]> = {}

  for (const row of rows) {
    const email = lower(row.email)
    const phone = digits(row.phone)

    out[row.id] = orders.filter((o) => {
      /* الحساب أدق حاجة — لو الاتنين مسجّلين دخول ده وحده يكفي */
      if (row.user_id && o.user_id) return o.user_id === row.user_id

      if (row.order_code && o.order_code === row.order_code) return true
      if (email && lower(o.customer?.email) === email) return true

      return Boolean(
        phone &&
          (digits(o.customer?.phone) === phone ||
            digits(o.customer?.phoneAlt) === phone)
      )
    })
  }

  return out
}

export default async function AdminCustomersPage() {
  const supabase = await createClient()

  const [activityRes, ordersRes] = await Promise.all([
    supabase
      .from('customer_activity')
      .select(
        'id, session_id, user_id, name, email, phone, governorate, area, address, cart, cart_count, cart_total, stage, filled, last_field, ordered, order_code, reminders, reminded_at, created_at, updated_at'
      )
      .order('updated_at', { ascending: false })
      .limit(200),
    supabase
      .from('orders')
      .select(
        'id, user_id, order_code, customer, total, status, created_at, vendoor_status, vendoor_order_code, vendoor_error'
      )
      .order('created_at', { ascending: false })
      .limit(400),
  ])

  const { data, error } = activityRes

  const rows = data ?? []
  const orders = (ordersRes.data ?? []) as OrderRow[]
  const ordersByRow = groupOrders(rows as ActivityRow[], orders)

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
            ordersByRow={ordersByRow as never}
            stats={{
              total: rows.length,
              abandoned: abandoned.length,
              reachable: reachable.length,
              ordered: rows.filter((r) => r.ordered).length,
              orders: orders.length,
            }}
          />
        )}
      </div>
    </>
  )
}
