'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { CashIcon, CheckIcon, PhoneIcon, TruckIcon, WhatsAppIcon } from '@/components/icons'
import { WhaleWatermark } from '@/components/logo'
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
      /* لو البيانات باظت نعرض الرسالة العامة */
    }
    setLoaded(true)
  }, [])

  if (!loaded) return <div className="min-h-[60vh]" />

  return (
    <div className="container-x py-14 lg:py-20">
      <div className="mx-auto max-w-[720px]">
        {/* ============ التأكيد ============ */}
        <div className="relative overflow-hidden border border-line bg-white px-6 py-12 text-center lg:px-14 lg:py-16">
          <WhaleWatermark
            className="pointer-events-none absolute -left-10 -top-10 h-[260px] w-auto text-brand-900"
            opacity={0.04}
          />

          <div className="animate-pop relative mx-auto mb-7 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-brand-950">
            <CheckIcon className="h-9 w-9 text-brand-400" strokeWidth={2} />
          </div>

          <p className="eyebrow relative">Order Confirmed</p>
          <h1 className="display relative mt-3 text-[clamp(1.8rem,5vw,2.8rem)]">
            تم استلام طلبك
          </h1>

          <p className="relative mx-auto mt-4 max-w-[42ch] text-[14.5px] leading-[1.95] text-muted">
            {order
              ? `شكرًا يا ${order.customer.fullName.split(' ')[0]} — طلبك وصلنا وهنكلّمك للتأكيد قبل الشحن.`
              : 'طلبك وصلنا بنجاح وهنكلّمك على الموبايل للتأكيد قبل الشحن.'}
          </p>

          {order && (
            <div className="relative mt-8 inline-flex flex-col items-center border border-line bg-ivory px-8 py-5">
              <span className="eyebrow mb-2">Order Number</span>
              <span className="font-mono text-[26px] font-bold tracking-[0.1em] text-ink">
                {order.orderId}
              </span>
              <span className="mt-2 text-[11.5px] text-muted">
                احتفظ بالرقم ده للمتابعة
              </span>
            </div>
          )}
        </div>

        {/* ============ الخطوات الجاية ============ */}
        <div className="mt-8 grid gap-px border border-line bg-line sm:grid-cols-3">
          {[
            {
              Icon: PhoneIcon,
              step: '01',
              title: 'مكالمة تأكيد',
              text: 'خلال ٢٤ ساعة بنكلّمك نتأكد من الأوردر والعنوان.',
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
              style={{ '--reveal-delay': `${i * 110}ms` } as React.CSSProperties}
              className="bg-white p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <item.Icon className="h-6 w-6 text-brand-700" />
                <span className="font-display text-[30px] font-extrabold leading-none text-line-strong">
                  {item.step}
                </span>
              </div>
              <h3 className="text-[14px] font-extrabold text-ink">{item.title}</h3>
              <p className="mt-2 text-[12.5px] leading-[1.9] text-muted">{item.text}</p>
            </div>
          ))}
        </div>

        {/* ============ ملخص الطلب ============ */}
        {order && (
          <div className="mt-8 border border-line bg-white">
            <div className="border-b border-line px-6 py-5">
              <p className="eyebrow">Summary</p>
              <h2 className="font-display mt-1.5 text-lg font-extrabold text-ink">
                ملخص الطلب
              </h2>
            </div>

            <ul className="divide-y divide-line px-6">
              {order.items.map((item) => (
                <li key={item.key} className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink">{item.name}</p>
                    {Object.keys(item.selectedVariants).length > 0 && (
                      <p className="mt-1 text-[12px] text-muted">
                        {Object.entries(item.selectedVariants)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' · ')}
                      </p>
                    )}
                    <p className="nums mt-1 text-[12px] text-muted">
                      الكمية: {item.quantity}
                    </p>
                  </div>
                  <span className="nums shrink-0 text-[14px] font-extrabold text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-3 border-t border-line px-6 py-5">
              <div className="flex justify-between text-[13.5px]">
                <span className="text-muted">الإجمالي الفرعي</span>
                <span className="nums font-bold">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[13.5px]">
                <span className="text-muted">
                  {SHIPPING_METHOD_NAME} — {order.customer.governorate}
                </span>
                <span className="nums font-bold">{formatPrice(order.shipping)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-4">
                <span className="text-[15px] font-extrabold text-ink">
                  المطلوب عند الاستلام
                </span>
                <span className="nums font-display text-2xl font-extrabold text-ink">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>

            {/* عنوان التوصيل */}
            <div className="border-t border-line bg-ivory px-6 py-5">
              <p className="eyebrow mb-2.5">Delivery Address</p>
              <p className="text-[13.5px] leading-[1.9] text-ink">
                {order.customer.fullName}
                <br />
                {order.customer.address}
                <br />
                {order.customer.village ? `${order.customer.village} — ` : ''}
                {order.customer.area} — {order.customer.governorate}
                <br />
                <span dir="ltr" className="nums inline-block">
                  {order.customer.phone}
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ============ أزرار ============ */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/shop" className="btn btn-primary">
            <span>أكمل التسوّق</span>
          </Link>
          <a
            href={`https://wa.me/${site.contact.whatsapp}${
              order ? `?text=${encodeURIComponent(`استفسار عن الأوردر ${order.orderId}`)}` : ''
            }`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <WhatsAppIcon className="h-4 w-4" />
            <span>استفسار عن الطلب</span>
          </a>
        </div>
      </div>
    </div>
  )
}
