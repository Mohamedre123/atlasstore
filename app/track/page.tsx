import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/page-header'
import { StatusTimeline } from '@/components/orders/status-timeline'
import { TrackForm } from '@/components/orders/track-form'
import { ArrowLeftIcon, BoxIcon, WhatsAppIcon } from '@/components/ui/icons'
import { site } from '@/data/site'
import { getStatus, type OrderStatus } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'تتبّع الطلب',
  description: 'اعرف حالة طلبك خطوة بخطوة.',
  robots: { index: false, follow: false },
}

type OrderRow = {
  id: string
  order_code: string
  status: OrderStatus
  total: number
  shipping: number
  created_at: string
  items: { name: string; quantity: number; selectedVariants?: Record<string, string> }[]
}

/* ============================================================
   تتبّع الطلب
   ------------------------------------------------------------
   • مسجّل دخول → بيشوف كل طلباته بمسارها على طول
   • مش مسجّل → بيكتب رقم الطلب وآخر ٤ أرقام من موبايله
   ============================================================ */
export default async function TrackPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <>
        <PageHeader
          eyebrow="Track Order"
          title="تتبّع طلبك"
          description="اكتب رقم الطلب وآخر ٤ أرقام من موبايلك عشان تشوف حالته."
        />

        <div className="shell py-10 lg:py-14">
          <div className="mx-auto max-w-[560px]">
            <TrackForm />

            <p className="mt-6 text-center text-[12.5px] leading-relaxed text-mist">
              مسجّل دخول؟{' '}
              <Link
                href="/login?next=/track"
                className="font-bold text-brand-300 hover:underline"
              >
                ادخل على حسابك
              </Link>{' '}
              وهتلاقي كل طلباتك على طول.
            </p>
          </div>
        </div>
      </>
    )
  }

  /* مسجّل دخول — بنجيب طلباته وأحداثها */
  const supabase = await createClient()

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_code, status, total, shipping, created_at, items')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const list = (orders ?? []) as OrderRow[]

  const { data: events } = list.length
    ? await supabase
        .from('order_events')
        .select('order_id, status, created_at')
        .in(
          'order_id',
          list.map((o) => o.id)
        )
        .order('created_at')
    : { data: [] }

  const byOrder = new Map<string, { status: string; created_at: string }[]>()
  for (const e of events ?? []) {
    const key = e.order_id as string
    if (!byOrder.has(key)) byOrder.set(key, [])
    byOrder.get(key)!.push({ status: e.status as string, created_at: e.created_at as string })
  }

  return (
    <>
      <PageHeader
        eyebrow="My Orders"
        title="طلباتي"
        description="كل طلباتك وحالتها لحظة بلحظة."
        breadcrumbs={[{ href: '/account', label: 'حسابي' }]}
      />

      <div className="shell py-10 lg:py-14">
        {list.length === 0 ? (
          <div className="card mx-auto max-w-[520px] px-6 py-16 text-center">
            <BoxIcon className="mx-auto mb-4 h-9 w-9 text-mist/50" />
            <p className="display text-[17px] font-bold">لسه ما طلبتش حاجة</p>
            <p className="mx-auto mt-3 max-w-[34ch] text-[13px] leading-relaxed text-mist">
              أول ما تعمل أوردر هتلاقي حالته هنا خطوة بخطوة.
            </p>
            <Link href="/shop" className="btn btn-primary mt-7">
              <span>تصفّح المنتجات</span>
              <ArrowLeftIcon className="btn-arrow h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mx-auto max-w-[720px] space-y-5">
            {list.map((order) => {
              const status = getStatus(order.status)

              return (
                <div key={order.id} className="card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
                    <div>
                      <span className="font-[family-name:var(--font-label)] text-[14px] font-bold">
                        {order.order_code}
                      </span>
                      <p className="nums mt-1 text-[11.5px] text-mist">
                        {new Intl.DateTimeFormat('ar-EG', {
                          dateStyle: 'medium',
                          timeZone: 'Africa/Cairo',
                        }).format(new Date(order.created_at))}
                      </p>
                    </div>

                    <div className="text-left">
                      <span className="nums display text-[18px] font-bold">
                        {formatPrice(Number(order.total))}
                      </span>
                      <p className="mt-1 text-[11px] text-brand-300">{status.label}</p>
                    </div>
                  </div>

                  <div className="px-5 py-5">
                    <StatusTimeline
                      status={order.status}
                      events={byOrder.get(order.id) ?? []}
                    />
                  </div>

                  <div className="border-t border-white/8 bg-abyss/40 px-5 py-4">
                    <ul className="space-y-2">
                      {(order.items ?? []).map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start justify-between gap-3 text-[12.5px]"
                        >
                          <span className="min-w-0">
                            <span className="font-semibold">{item.name}</span>
                            {item.selectedVariants &&
                              Object.keys(item.selectedVariants).length > 0 && (
                                <span className="mr-2 text-[11px] text-mist">
                                  {Object.entries(item.selectedVariants)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(' · ')}
                                </span>
                              )}
                          </span>
                          <span className="nums shrink-0 text-mist">
                            ×{item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <a
                      href={`https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(
                        `استفسار عن الأوردر ${order.order_code}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-ghost btn-sm mt-4"
                    >
                      <WhatsAppIcon className="h-3.5 w-3.5" />
                      <span>استفسار عن الطلب</span>
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
