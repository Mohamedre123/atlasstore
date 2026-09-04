'use client'

import { useState } from 'react'
import { StatusTimeline } from '@/components/orders/status-timeline'
import {
  AlertIcon,
  ArrowLeftIcon,
  SearchIcon,
  SpinnerIcon,
  WhatsAppIcon,
} from '@/components/ui/icons'
import { site } from '@/data/site'
import { getStatus, type OrderStatus } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

type Found = {
  order_code: string
  status: OrderStatus
  created_at: string
  total: number
  shipping: number
  items: { name: string; quantity: number; selectedVariants?: Record<string, string> }[]
  first_name: string
  governorate: string
  area: string
}

/* ============================================================
   تتبّع الطلب للزائر
   ------------------------------------------------------------
   رقم الطلب + آخر ٤ أرقام من الموبايل. الاتنين مع بعض بيمنعوا
   أي حد يخمّن أرقام الطلبات ويتفرّج على طلبات غيره.

   القراءة بتتم عن طريق دالة في قاعدة البيانات بترجّع الحد
   الأدنى من البيانات — من غير عنوان ولا إيميل ولا رقم كامل.
   ============================================================ */
export function TrackForm() {
  const [code, setCode] = useState('')
  const [tail, setTail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [order, setOrder] = useState<Found | null>(null)
  const [events, setEvents] = useState<{ status: string; created_at: string }[]>([])

  const search = async () => {
    setError('')
    setOrder(null)

    if (!code.trim()) {
      setError('اكتب رقم الطلب')
      return
    }
    if (tail.replace(/\D/g, '').length !== 4) {
      setError('اكتب آخر ٤ أرقام من موبايلك')
      return
    }
    if (!isSupabaseConfigured) {
      setError('التتبّع مش متاح دلوقتي — كلّمنا واتساب')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      const args = { code: code.trim(), phone_tail: tail.replace(/\D/g, '') }

      const [res, ev] = await Promise.all([
        supabase.rpc('track_order', args),
        supabase.rpc('track_order_events', args),
      ])

      if (res.error) throw new Error(res.error.message)

      const row = (res.data as Found[] | null)?.[0]
      if (!row) {
        setError('مالقيناش طلب بالبيانات دي — راجع رقم الطلب والموبايل')
        return
      }

      setOrder(row)
      setEvents((ev.data as { status: string; created_at: string }[]) ?? [])
    } catch (err) {
      setError(
        err instanceof Error && /function/i.test(err.message)
          ? 'التتبّع مش مفعّل لسه — شغّل ملف supabase/tracking.sql'
          : 'حصلت مشكلة — جرّب تاني أو كلّمنا واتساب'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void search()
        }}
        className="card p-5"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="code" className="label">
              رقم الطلب
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              dir="ltr"
              placeholder="ATL-4F92K"
              autoComplete="off"
              className="field nums text-center !text-[18px] font-bold tracking-[0.12em]"
            />
          </div>

          <div>
            <label htmlFor="tail" className="label">
              آخر ٤ أرقام من موبايلك
            </label>
            <input
              id="tail"
              value={tail}
              onChange={(e) => setTail(e.target.value.replace(/\D/g, '').slice(0, 4))}
              dir="ltr"
              inputMode="numeric"
              placeholder="1234"
              autoComplete="off"
              className="field nums text-center !text-[18px] font-bold tracking-[0.3em]"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 rounded-xl border border-sale/25 bg-sale/8 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-sale">
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block mt-5">
          {loading ? (
            <>
              <SpinnerIcon className="a-spin h-4 w-4" />
              <span>بندوّر...</span>
            </>
          ) : (
            <>
              <SearchIcon className="h-4 w-4" />
              <span>تتبّع الطلب</span>
            </>
          )}
        </button>
      </form>

      {/* ============ النتيجة ============ */}
      {order && (
        <div className="card a-rise mt-6 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-[13px] font-bold">أهلاً {order.first_name} 👋</p>
              <p className="nums mt-1 text-[11.5px] text-mist">
                {order.order_code} ·{' '}
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
              <p className="mt-1 text-[11px] text-brand-300">
                {getStatus(order.status).label}
              </p>
            </div>
          </div>

          <div className="px-5 py-5">
            <StatusTimeline status={order.status} events={events} />
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
                  <span className="nums shrink-0 text-mist">×{item.quantity}</span>
                </li>
              ))}
            </ul>

            <p className="mt-3 text-[11.5px] text-mist">
              التوصيل لـ {order.area} — {order.governorate}
            </p>

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
              <ArrowLeftIcon className="btn-arrow h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
