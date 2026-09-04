'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Watermark } from '@/components/brand/logo'
import {
  ArrowLeftIcon,
  BoxIcon,
  CashIcon,
  CheckIcon,
  TruckIcon,
  WhatsAppIcon,
} from '@/components/ui/icons'
import { DELIVERY_WINDOW, SHIPPING_METHOD_NAME } from '@/data/locations'
import { site } from '@/data/site'
import { formatPrice } from '@/lib/format'
import type { CartItem, CustomerInfo } from '@/lib/types'

type StoredOrder = {
  orderId: string
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
}

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<StoredOrder | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('atlas_last_order')
      if (raw) setOrder(JSON.parse(raw))
    } catch {
      /* لو البيانات باظت بنعرض الرسالة العامة */
    }
    setLoaded(true)
  }, [])

  if (!loaded) return <div className="min-h-[60vh]" />

  return (
    <div className="relative overflow-hidden">
      <span
        aria-hidden="true"
        className="aurora aurora-a -right-24 -top-32 h-[420px] w-[420px]"
      />
      <span
        aria-hidden="true"
        className="aurora aurora-c -bottom-32 -left-24 h-[380px] w-[380px]"
      />

      <div className="shell relative py-14 lg:py-20">
        <div className="mx-auto max-w-[760px]">
          {/* ============ التأكيد ============ */}
          <div className="rim rim-on relative overflow-hidden rounded-[28px] bg-deep px-6 py-14 text-center lg:px-14">
            <Watermark
              className="pointer-events-none absolute -left-10 -top-10 h-[240px] w-auto"
              opacity={0.06}
            />

            <div className="relative">
              <div className="a-pop mx-auto mb-7 flex h-[84px] w-[84px] items-center justify-center rounded-full bg-[image:var(--grad-soft)] shadow-[var(--glow-lg)]">
                <CheckIcon className="h-10 w-10 text-ink" strokeWidth={2.2} />
              </div>

              <p className="tag">Order Received</p>

              <h1 className="display mt-4 text-[clamp(1.7rem,5.4vw,2.7rem)]">
                تم استلام طلبك
              </h1>

              <p className="mx-auto mt-4 max-w-[44ch] text-[14px] leading-[2] text-mist">
                {order
                  ? `شكرًا يا ${order.customer.fullName.split(' ')[0]} — استلمنا طلبك وسجّلناه، وهنبعتلك تحديث بحالته أول بأول.`
                  : 'استلمنا طلبك وسجّلناه، وهنبعتلك تحديث بحالته أول بأول.'}
              </p>

              {order && (
                <div className="mt-8 inline-flex flex-col items-center rounded-2xl border border-white/10 bg-white/4 px-9 py-5">
                  <span className="tag mb-2">Order Number</span>
                  <span className="font-[family-name:var(--font-label)] grad-text text-[27px] font-bold tracking-[0.12em]">
                    {order.orderId}
                  </span>
                  <span className="mt-2 text-[11px] text-mist">
                    احتفظ بالرقم ده للمتابعة
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ============ الخطوات الجاية ============ */}
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                Icon: BoxIcon,
                step: '01',
                title: 'استلمنا طلبك',
                text: 'أوردرك اتسجّل عندنا وبنراجعه، وهيوصلك تحديث بحالته.',
              },
              {
                Icon: TruckIcon,
                step: '02',
                title: SHIPPING_METHOD_NAME,
                text: `مندوبنا بيوصّلك بنفسه خلال ${DELIVERY_WINDOW}.`,
              },
              {
                Icon: CashIcon,
                step: '03',
                title: 'الاستلام والدفع',
                text: order
                  ? `افحص الأوردر وادفع ${formatPrice(order.total)} للمندوب.`
                  : 'افحص الأوردر الأول وبعدين ادفع للمندوب.',
              },
            ].map((item, i) => (
              <div
                key={i}
                data-reveal=""
                style={{ '--rd': `${i * 110}ms` } as React.CSSProperties}
                className="card p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <item.Icon className="h-6 w-6 text-brand-400" />
                  <span className="font-[family-name:var(--font-label)] text-[26px] font-bold leading-none text-white/8">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-[13.5px] font-extrabold">{item.title}</h3>
                <p className="mt-2 text-[12px] leading-[1.9] text-mist">{item.text}</p>
              </div>
            ))}
          </div>

          {/* ============ ملخص الطلب ============ */}
          {order && (
            <div className="card mt-6 overflow-hidden">
              <div className="border-b border-white/8 px-6 py-5">
                <p className="tag">Summary</p>
                <h2 className="display mt-1.5 text-[17px] font-bold">ملخص الطلب</h2>
              </div>

              <ul className="divide-y divide-white/8 px-6">
                {order.items.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold">{item.name}</p>
                      {Object.keys(item.selectedVariants).length > 0 && (
                        <p className="mt-1 text-[11.5px] text-mist">
                          {Object.entries(item.selectedVariants)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(' · ')}
                        </p>
                      )}
                      <p className="nums mt-1 text-[11.5px] text-mist">
                        الكمية: {item.quantity}
                      </p>
                    </div>
                    <span className="nums shrink-0 text-[13.5px] font-extrabold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 border-t border-white/8 px-6 py-5">
                <div className="flex justify-between text-[13px]">
                  <span className="text-mist">الإجمالي الفرعي</span>
                  <span className="nums font-bold">{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-mist">
                    {SHIPPING_METHOD_NAME} — {order.customer.governorate}
                  </span>
                  <span className="nums font-bold">{formatPrice(order.shipping)}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/8 pt-4">
                  <span className="text-[14px] font-extrabold">
                    المطلوب عند الاستلام
                  </span>
                  <span className="nums display grad-text text-[23px] font-bold">
                    {formatPrice(order.total)}
                  </span>
                </div>
              </div>

              <div className="border-t border-white/8 bg-abyss/40 px-6 py-5">
                <p className="tag mb-3">Delivery Address</p>
                <p className="text-[13px] leading-[1.95]">
                  {order.customer.fullName}
                  <br />
                  {order.customer.address}
                  <br />
                  {order.customer.village ? `${order.customer.village} — ` : ''}
                  {order.customer.area} — {order.customer.governorate}
                  <br />
                  <span dir="ltr" className="nums inline-block text-mist">
                    {order.customer.phone}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* ============ أزرار ============ */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/track" className="btn btn-primary">
              <BoxIcon className="h-4 w-4" />
              <span>تتبّع الطلب</span>
              <ArrowLeftIcon className="btn-arrow h-4 w-4" />
            </Link>
            <Link href="/shop" className="btn btn-ghost">
              <span>أكمل التسوّق</span>
            </Link>
            <a
              href={`https://wa.me/${site.contact.whatsapp}${
                order
                  ? `?text=${encodeURIComponent(`استفسار عن الأوردر ${order.orderId}`)}`
                  : ''
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              <WhatsAppIcon className="h-4 w-4" />
              <span>استفسار عن الطلب</span>
            </a>

          </div>
        </div>
      </div>
    </div>
  )
}
