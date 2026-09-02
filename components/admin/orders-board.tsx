'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  RefreshIcon,
  SpinnerIcon,
  TrashIcon,
  WhatsAppIcon,
} from '@/components/ui/icons'
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
const ACTIONS = ORDER_STATUSES.filter((s) => s.key !== 'new')

const TONES: Record<string, string> = {
  gray: 'bg-white/8 text-mist',
  cyan: 'bg-brand-500/15 text-brand-300',
  amber: 'bg-warn/15 text-warn',
  green: 'bg-ok/15 text-ok',
  red: 'bg-sale/15 text-sale',
}

export function OrdersBoard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all')
  const [busy, setBusy] = useState<string | null>(null)
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

  const flash = (text: string, ok: boolean) => {
    setToast({ text, ok })
    window.setTimeout(() => setToast(null), 5000)
  }

  /* ---------------- تغيير الحالة ---------------- */
  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (busy) return
    setBusy(order.id)
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

      flash(
        data.emailSent
          ? `اتحدّثت لـ «${getStatus(status).label}» والإيميل وصل العميل ✓`
          : `اتحدّثت لـ «${getStatus(status).label}» — ${data.emailError ?? 'من غير إيميل'}`,
        true
      )
    } catch (err) {
      flash(err instanceof Error ? err.message : 'حصلت مشكلة', false)
    } finally {
      setBusy(null)
    }
  }

  /* ---------------- حذف أوردر ---------------- */
  const removeOrder = async (order: Order) => {
    if (busy) return

    const sure = window.confirm(
      `هتمسح الأوردر ${order.order_code} نهائيًا.\n\nمفيش رجوع بعد كده — متأكد؟`
    )
    if (!sure) return

    setBusy(order.id)
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
      flash(`الأوردر ${order.order_code} اتمسح ✓`, true)

      /* إعادة تحميل للتأكد إن الحذف اتسجّل فعلًا مش شكل بس */
      void load()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'حصلت مشكلة', false)
    } finally {
      setBusy(null)
    }
  }

  /* ---------------- العدّ والفلترة ---------------- */
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
        <SpinnerIcon className="a-spin h-8 w-8 text-brand-400" />
      </div>
    )
  }

  return (
    <div>
      {/* ============ ملخص سريع ============ */}
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="كل الأوردرات" value={String(counts.all)} />
        <Stat label="محتاجة تأكيد" value={String(counts.new ?? 0)} alert />
        <Stat label="في الطريق" value={String(counts.shipping ?? 0)} />
        <Stat label="إجمالي المسلّم" value={formatPrice(revenue)} />
      </div>

      {/* ============ شريط الأدوات ============ */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          الكل ({counts.all})
        </Chip>
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s.key}
            active={filter === s.key}
            onClick={() => setFilter(s.key)}
          >
            {s.label} ({counts[s.key] ?? 0})
          </Chip>
        ))}

        <button
          type="button"
          onClick={() => void load()}
          className="btn btn-ghost btn-sm mr-auto"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          <span>تحديث</span>
        </button>
      </div>

      {/* ============ الرسائل ============ */}
      {toast && (
        <p
          className={`mb-5 flex items-start gap-2 rounded-2xl px-4 py-3.5 text-[12.5px] leading-relaxed ${
            toast.ok
              ? 'border border-ok/25 bg-ok/8 text-ok'
              : 'border border-sale/25 bg-sale/8 text-sale'
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
        <p className="mb-5 flex items-start gap-2 rounded-2xl border border-sale/25 bg-sale/8 px-4 py-3.5 text-[12.5px] text-sale">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </p>
      )}

      {/* ============ الأوردرات ============ */}
      {visible.length === 0 ? (
        <div className="card px-6 py-20 text-center">
          <p className="display text-[18px] font-bold">مفيش أوردرات هنا</p>
          <p className="mt-2.5 text-[13px] text-mist">
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
              busy={busy === order.id}
              onChange={changeStatus}
              onDelete={removeOrder}
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
    <div className="card overflow-hidden">
      {/* --- الرأس --- */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-4 py-4 lg:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-[family-name:var(--font-label)] text-[13px] font-bold">
              {order.order_code}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                TONES[status.tone] ?? TONES.gray
              }`}
            >
              {status.label}
            </span>
          </div>
          <p className="nums mt-1.5 text-[11.5px] text-mist">{date}</p>
        </div>

        <div className="text-left">
          <p className="nums display text-[19px] font-bold">
            {formatPrice(Number(order.total))}
          </p>
          <p className="nums text-[11px] text-mist">
            {items.reduce((s, i) => s + i.quantity, 0)} قطعة
          </p>
        </div>
      </div>

      {/* --- بيانات العميل --- */}
      <div className="px-4 py-4 lg:px-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="text-[13.5px] font-bold">{customer.fullName}</span>

          <a
            href={`tel:${customer.phone}`}
            dir="ltr"
            className="nums flex items-center gap-1.5 text-[12.5px] text-brand-300 hover:underline"
          >
            <PhoneIcon className="h-3.5 w-3.5" />
            {customer.phone}
          </a>

          {customer.phoneAlt && (
            <a
              href={`tel:${customer.phoneAlt}`}
              dir="ltr"
              className="nums flex items-center gap-1.5 text-[12px] text-mist hover:underline"
            >
              <PhoneIcon className="h-3.5 w-3.5" />
              {customer.phoneAlt}
            </a>
          )}

          {customer.email && (
            <span dir="ltr" className="flex items-center gap-1.5 text-[12px] text-mist">
              <MailIcon className="h-3.5 w-3.5" />
              {customer.email}
            </span>
          )}
        </div>

        <p className="mt-2.5 flex items-start gap-2 text-[12.5px] leading-[1.9] text-mist">
          <PinIcon className="mt-1 h-3.5 w-3.5 shrink-0" />
          <span>
            {customer.address}
            {customer.village ? ` — ${customer.village}` : ''} — {customer.area} —{' '}
            {customer.governorate}
            {customer.landmark ? ` (${customer.landmark})` : ''}
          </span>
        </p>

        {customer.notes && (
          <p className="mt-3 rounded-xl border border-warn/25 bg-warn/8 px-3.5 py-2.5 text-[12px] text-warn">
            ملاحظة العميل: {customer.notes}
          </p>
        )}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-3.5 flex items-center gap-1.5 text-[12px] font-bold text-brand-300 hover:underline"
        >
          <ChevronDownIcon
            className={`h-3.5 w-3.5 transition-transform duration-400 ${
              open ? 'rotate-180' : ''
            }`}
          />
          {open ? 'إخفاء المنتجات' : `عرض المنتجات (${items.length})`}
        </button>

        <div className="acc-body mt-3" data-open={open}>
          <div>
            <ul className="divide-y divide-white/8 rounded-xl border border-white/8">
              {items.map((item, i) => (
                <li key={i} className="flex items-start justify-between gap-3 px-3.5 py-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-bold">{item.name}</p>
                    <p className="mt-1 text-[11.5px] text-mist">
                      {Object.entries(item.selectedVariants ?? {})
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                      {item.sku ? ` · ${item.sku}` : ''}
                    </p>
                  </div>
                  <span className="nums shrink-0 text-[12.5px] font-bold">
                    ×{item.quantity}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* --- أزرار الحالة --- */}
      <div className="border-t border-white/8 bg-abyss/40 px-4 py-4 lg:px-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11.5px] font-bold text-mist">
            غيّر الحالة — العميل هيوصله إيميل تلقائي
          </p>

          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(order)}
            title="مسح الأوردر نهائيًا"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[11.5px] font-bold text-mist transition-colors hover:border-sale/50 hover:bg-sale/8 hover:text-sale disabled:opacity-40"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            مسح
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((s) => {
            const active = order.status === s.key
            const wa = buildStatusWhatsApp({
              orderCode: order.order_code,
              status: s.key as Exclude<OrderStatus, 'new'>,
              customer,
              items,
              total: Number(order.total),
            })

            return (
              <span
                key={s.key}
                className="inline-flex overflow-hidden rounded-full border border-white/10"
              >
                <button
                  type="button"
                  disabled={busy || active}
                  onClick={() => onChange(order, s.key)}
                  title={s.hint}
                  className={`px-3.5 py-2 text-[12px] font-bold transition-colors disabled:cursor-not-allowed ${
                    active
                      ? 'bg-[image:var(--grad-soft)] text-ink'
                      : 'text-foam hover:bg-brand-500/12 disabled:opacity-50'
                  }`}
                >
                  {busy ? '...' : s.label}
                </button>

                {/* واتساب بضغطة — رسالة جاهزة بنفس الحالة */}
                <a
                  href={`https://wa.me/${phoneIntl}?text=${wa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`ابعت «${s.label}» واتساب`}
                  className="flex items-center border-r border-white/10 px-2.5 text-[#25d366] transition-colors hover:bg-[#25d366]/12"
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

function Stat({
  label,
  value,
  alert = false,
}: {
  label: string
  value: string
  alert?: boolean
}) {
  const hot = alert && value !== '0'

  return (
    <div
      className={`rounded-2xl border p-4 ${
        hot ? 'border-brand-500/50 bg-brand-500/8' : 'border-white/8 bg-white/[0.03]'
      }`}
    >
      <p className="text-[11.5px] text-mist">{label}</p>
      <p
        className={`nums display mt-1.5 text-[21px] font-bold ${
          hot ? 'grad-text' : ''
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function Chip({
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
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-2 text-[12px] font-bold transition-all duration-400 ${
        active
          ? 'border-transparent bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)]'
          : 'border-white/10 bg-white/4 text-foam/80 hover:border-brand-500/50'
      }`}
    >
      {children}
    </button>
  )
}
