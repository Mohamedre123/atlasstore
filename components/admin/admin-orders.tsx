'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  RefreshIcon,
  SpinnerIcon,
  TrashIcon,
  WhatsAppIcon,
} from '@/components/icons'
import { ORDER_STATUSES, getStatus, type OrderStatus } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import { buildStatusWhatsApp } from '@/lib/status-email'
import { createClient } from '@/lib/supabase/client'
import type { CartItem, CustomerInfo } from '@/lib/types'

type Order = {
  id: string
  order_code: string
  customer: CustomerInfo
  items: CartItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  created_at: string
  status_updated_at: string | null
}

/* الحالات اللي بتظهر كأزرار قدام كل أوردر */
const ACTION_STATUSES = ORDER_STATUSES.filter((s) => s.key !== 'new')

const TONE_CLASSES: Record<string, string> = {
  gray: 'bg-sand text-muted',
  cyan: 'bg-brand-100 text-brand-800',
  amber: 'bg-amber-100 text-amber-800',
  green: 'bg-emerald-100 text-emerald-800',
  red: 'bg-sale/10 text-sale',
}

export function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)

  /* ---------------- تحميل الأوردرات ---------------- */
  const load = useCallback(async () => {
    setError('')
    try {
      const supabase = createClient()
      const { data, error: err } = await supabase
        .from('orders')
        .select(
          'id, order_code, customer, items, subtotal, shipping, total, status, created_at, status_updated_at'
        )
        .order('created_at', { ascending: false })
        .limit(200)

      if (err) throw err
      setOrders((data as Order[]) ?? [])
    } catch (err) {
      setError(
        err instanceof Error
          ? `ما قدرناش نحمّل الأوردرات: ${err.message}`
          : 'ما قدرناش نحمّل الأوردرات'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  /* ---------------- تغيير الحالة ---------------- */
  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (busyId) return
    setBusyId(order.id)
    setToast(null)

    try {
      const res = await fetch('/api/admin/order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status }),
      })
      const data = await res.json()

      if (!res.ok || !data.ok) throw new Error(data.error ?? 'فشل التحديث')

      /* تحديث محلي فوري من غير ما نعيد تحميل الصفحة */
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, status, status_updated_at: new Date().toISOString() }
            : o
        )
      )

      setToast({
        ok: true,
        text: data.emailSent
          ? `اتحدّثت لـ «${getStatus(status).label}» والإيميل وصل العميل ✓`
          : `اتحدّثت لـ «${getStatus(status).label}» — ${data.emailError ?? 'من غير إيميل'}`,
      })
    } catch (err) {
      setToast({
        ok: false,
        text: err instanceof Error ? err.message : 'حصلت مشكلة',
      })
    } finally {
      setBusyId(null)
      window.setTimeout(() => setToast(null), 5000)
    }
  }

  /* ---------------- حذف أوردر ---------------- */
  const deleteOrder = async (order: Order) => {
    if (busyId) return

    const sure = window.confirm(
      `هتمسح الأوردر ${order.order_code} نهائيًا.\n\nمفيش رجوع بعد كده — متأكد؟`
    )
    if (!sure) return

    setBusyId(order.id)
    setToast(null)

    try {
      const res = await fetch('/api/admin/delete-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error ?? 'فشل الحذف')

      setOrders((prev) => prev.filter((o) => o.id !== order.id))
      setToast({ ok: true, text: `الأوردر ${order.order_code} اتمسح ✓` })

      /* إعادة تحميل من قاعدة البيانات للتأكد إن الحذف اتسجّل فعلًا
         ومش شكل بس في الشاشة */
      void load()
    } catch (err) {
      setToast({ ok: false, text: err instanceof Error ? err.message : 'حصلت مشكلة' })
    } finally {
      setBusyId(null)
      window.setTimeout(() => setToast(null), 5000)
    }
  }

  /* ---------------- الفلترة والعدّ ---------------- */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    ORDER_STATUSES.forEach((s) => {
      c[s.key] = orders.filter((o) => o.status === s.key).length
    })
    return c
  }, [orders])

  const visible = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  )

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'delivered')
        .reduce((sum, o) => sum + Number(o.total), 0),
    [orders]
  )

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <SpinnerIcon className="h-7 w-7 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div>
      {/* ============ ملخص سريع ============ */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="كل الأوردرات" value={String(counts.all)} />
        <StatCard label="محتاجة تأكيد" value={String(counts.new ?? 0)} highlight />
        <StatCard label="في الطريق" value={String(counts.shipping ?? 0)} />
        <StatCard label="إجمالي المسلّم" value={formatPrice(revenue)} />
      </div>

      {/* ============ شريط الأدوات ============ */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
          الكل ({counts.all})
        </FilterChip>
        {ORDER_STATUSES.map((s) => (
          <FilterChip
            key={s.key}
            active={filter === s.key}
            onClick={() => setFilter(s.key)}
          >
            {s.label} ({counts[s.key] ?? 0})
          </FilterChip>
        ))}

        <button
          type="button"
          onClick={() => void load()}
          className="mr-auto flex items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-[12px] font-bold text-ink transition-colors hover:border-brand-400"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          تحديث
        </button>
      </div>

      {/* ============ رسالة النتيجة ============ */}
      {toast && (
        <p
          className={`mb-5 flex items-start gap-2 rounded-[12px] px-4 py-3 text-[12.5px] leading-relaxed ${
            toast.ok
              ? 'bg-brand-50 text-brand-800'
              : 'bg-sale/10 text-sale'
          }`}
        >
          {toast.ok ? (
            <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </p>
      )}

      {error && (
        <p className="mb-5 flex items-start gap-2 rounded-[12px] bg-sale/10 px-4 py-3 text-[12.5px] text-sale">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* ============ الأوردرات ============ */}
      {visible.length === 0 ? (
        <div className="rounded-[16px] border border-line bg-white py-20 text-center">
          <p className="font-display text-lg font-extrabold text-ink">
            مفيش أوردرات هنا
          </p>
          <p className="mt-2 text-[13px] text-muted">
            {filter === 'all'
              ? 'أول ما يجيلك أوردر هيظهر في الصفحة دي.'
              : 'جرّب فلتر تاني.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              busy={busyId === order.id}
              onChange={changeStatus}
              onDelete={deleteOrder}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================
   كارت الأوردر
   ============================================================ */
function OrderCard({
  order,
  busy,
  onChange,
  onDelete,
}: {
  order: Order
  busy: boolean
  onChange: (order: Order, status: OrderStatus) => void
  onDelete: (order: Order) => void
}) {
  const [open, setOpen] = useState(false)
  const status = getStatus(order.status)
  const customer = order.customer ?? ({} as CustomerInfo)
  const items = order.items ?? []

  const phoneIntl = (customer.phone ?? '').replace(/^0/, '20')

  const date = new Intl.DateTimeFormat('ar-EG', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Cairo',
  }).format(new Date(order.created_at))

  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-white">
      {/* --- الرأس --- */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3.5 lg:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[13px] font-bold text-ink">
              {order.order_code}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                TONE_CLASSES[status.tone]
              }`}
            >
              {status.label}
            </span>
          </div>
          <p className="mt-1 text-[12px] text-muted">{date}</p>
        </div>

        <div className="text-left">
          <p className="nums font-display text-[18px] font-extrabold text-ink">
            {formatPrice(Number(order.total))}
          </p>
          <p className="nums text-[11px] text-muted">
            {items.reduce((s, i) => s + i.quantity, 0)} قطعة
          </p>
        </div>
      </div>

      {/* --- بيانات العميل --- */}
      <div className="px-4 py-3.5 lg:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[13.5px] font-bold text-ink">{customer.fullName}</span>

          <a
            href={`tel:${customer.phone}`}
            className="nums flex items-center gap-1.5 text-[12.5px] text-brand-700 hover:underline"
            dir="ltr"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            {customer.phone}
          </a>

          {customer.email && (
            <span className="flex items-center gap-1.5 text-[12px] text-muted" dir="ltr">
              <MailIcon className="h-3.5 w-3.5" />
              {customer.email}
            </span>
          )}
        </div>

        <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
          {customer.address}
          {customer.village ? ` — ${customer.village}` : ''} — {customer.area} —{' '}
          {customer.governorate}
          {customer.landmark ? ` (${customer.landmark})` : ''}
        </p>

        {customer.notes && (
          <p className="mt-2 rounded-[8px] bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            ملاحظة العميل: {customer.notes}
          </p>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-3 text-[12px] font-bold text-brand-700 hover:underline"
        >
          {open ? 'إخفاء المنتجات' : `عرض المنتجات (${items.length})`}
        </button>

        {open && (
          <ul className="mt-3 divide-y divide-line rounded-[12px] border border-line">
            {items.map((item, i) => (
              <li key={i} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[12.5px] font-bold text-ink">{item.name}</p>
                  <p className="mt-0.5 text-[11.5px] text-muted">
                    {Object.entries(item.selectedVariants ?? {})
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' · ')}
                    {item.sku ? ` · ${item.sku}` : ''}
                  </p>
                </div>
                <span className="nums shrink-0 text-[12.5px] font-bold text-ink">
                  ×{item.quantity}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- أزرار الحالة --- */}
      <div className="border-t border-line bg-sand/50 px-4 py-3.5 lg:px-5">
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <p className="text-[11.5px] font-bold text-muted">
            غيّر الحالة — العميل هيوصله إيميل تلقائي
          </p>

          {/* حذف نهائي — للأوردرات التجريبية */}
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(order)}
            title="مسح الأوردر نهائيًا"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-[11.5px] font-bold text-muted transition-colors hover:border-sale hover:bg-sale/5 hover:text-sale disabled:opacity-40"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            مسح
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTION_STATUSES.map((s) => {
            const active = order.status === s.key
            const wa = buildStatusWhatsApp({
              orderCode: order.order_code,
              status: s.key as Exclude<OrderStatus, 'new'>,
              customer,
              items,
              total: Number(order.total),
            })

            return (
              <span key={s.key} className="inline-flex overflow-hidden rounded-full">
                <button
                  type="button"
                  disabled={busy || active}
                  onClick={() => onChange(order, s.key)}
                  title={s.hint}
                  className={`px-3.5 py-2 text-[12px] font-bold transition-colors disabled:cursor-not-allowed ${
                    active
                      ? 'bg-brand-400 text-ink'
                      : 'bg-white text-ink hover:bg-brand-50 disabled:opacity-50'
                  }`}
                >
                  {busy ? '...' : s.label}
                </button>

                {/* واتساب بضغطة — رسالة جاهزة */}
                <a
                  href={`https://wa.me/${phoneIntl}?text=${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`ابعت «${s.label}» واتساب`}
                  className="flex items-center border-r border-line bg-white px-2.5 text-emerald-600 transition-colors hover:bg-emerald-50"
                >
                  <WhatsAppIcon className="h-3.5 w-3.5" />
                </a>
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ============================================================ */

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-[14px] border p-4 ${
        highlight && value !== '0'
          ? 'border-brand-400 bg-brand-50'
          : 'border-line bg-white'
      }`}
    >
      <p className="text-[11.5px] text-muted">{label}</p>
      <p className="nums font-display mt-1 text-[20px] font-extrabold text-ink">
        {value}
      </p>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition-all ${
        active
          ? 'border-brand-400 bg-brand-400 text-ink'
          : 'border-line bg-white text-ink hover:border-brand-400'
      }`}
    >
      {children}
    </button>
  )
}
