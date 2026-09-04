'use client'

import { useMemo, useState, useTransition } from 'react'
import { getCustomerEvents, sendReminder } from '@/app/admin/actions'
import {
  AlertIcon,
  BagIcon,
  BoxIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  SpinnerIcon,
  UserIcon,
  WhatsAppIcon,
} from '@/components/ui/icons'
import { getStatus } from '@/lib/admin'
import { formatPrice } from '@/lib/format'
import {
  REMINDER_KINDS,
  reminderLabel,
  suggestReminder,
  type ReminderKind,
} from '@/lib/reminder-email'

type Row = {
  id: string
  session_id: string
  name: string | null
  email: string | null
  phone: string | null
  governorate: string | null
  area: string | null
  address: string | null
  cart: { name: string; quantity: number; price: number; variants?: Record<string, string> }[]
  cart_count: number
  cart_total: number
  stage: string
  filled: Record<string, boolean>
  last_field: string | null
  ordered: boolean
  order_code: string | null
  reminders: { kind: string; at: string }[]
  reminded_at: string | null
  created_at: string
  updated_at: string
}

/** أوردر متسجّل عندنا — بيتربط بصاحبه في صفحة العملاء */
type OrderRow = {
  id: string
  order_code: string
  total: number
  status: string
  created_at: string
  vendoor_status: string | null
  vendoor_order_code: string | null
  vendoor_error: string | null
}

const STATUS_TONE: Record<string, string> = {
  gray: 'bg-white/8 text-mist',
  cyan: 'bg-brand-500/15 text-brand-300',
  amber: 'bg-warn/15 text-warn',
  green: 'bg-ok/15 text-ok',
  red: 'bg-sale/15 text-sale',
}

const STAGE_LABEL: Record<string, string> = {
  browsing: 'بيتفرّج',
  cart: 'ضاف للسلة',
  checkout: 'فتح إتمام الطلب',
  filling: 'بيكتب بياناته',
  ordered: 'أتمّ الطلب',
}

const EVENT_LABEL: Record<string, string> = {
  checkout_open: 'فتح صفحة إتمام الطلب',
  field_focus: 'وقف عند',
  reminder_sent: 'اتبعتله تذكير',
  ordered: 'أتمّ الطلب',
}

const dateFmt = new Intl.DateTimeFormat('ar-EG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Cairo',
})

/* ============================================================
   العملاء والسلات المتروكة
   ------------------------------------------------------------
   كل صف بيوريك العميل وقف فين وإيه اللي ناقصه، والزرار
   الرئيسي بيتغيّر لوحده حسب الناقص ده — لو ساب العنوان بيبقى
   «اطلب منه العنوان»، ولو مكتبش موبايل بيبقى «اطلب منه الموبايل».
   ============================================================ */
export function CustomersBoard({
  rows,
  ordersByRow,
  stats,
}: {
  rows: Row[]
  /** أوردرات كل عميل بمفتاح صف النشاط بتاعه */
  ordersByRow: Record<string, OrderRow[]>
  stats: {
    total: number
    abandoned: number
    reachable: number
    ordered: number
    orders: number
  }
}) {
  const [filter, setFilter] = useState<'abandoned' | 'all' | 'ordered'>('abandoned')
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null)

  /* العميل يتحسب «أتمّ الطلب» لو عنده أوردر متسجّل حتى لو صف
     النشاط ما اتعلّمش (حصل مثلًا إنه قفل الصفحة بعد التأكيد) */
  const didOrder = (r: Row) => r.ordered || (ordersByRow[r.id]?.length ?? 0) > 0

  const visible = useMemo(() => {
    if (filter === 'all') return rows
    if (filter === 'ordered') return rows.filter(didOrder)
    return rows.filter((r) => !didOrder(r) && Number(r.cart_count) > 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, filter, ordersByRow])

  const flash = (text: string, ok: boolean) => {
    setToast({ text, ok })
    window.setTimeout(() => setToast(null), 5000)
  }

  return (
    <div>
      {/* ============ ملخص ============ */}
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="كل الزوّار" value={String(stats.total)} />
        <Stat label="سلات متروكة" value={String(stats.abandoned)} alert />
        <Stat label="ينفع نبعتلهم إيميل" value={String(stats.reachable)} />
        <Stat
          label="أتمّوا الطلب"
          value={String(stats.ordered)}
          note={`${stats.orders} أوردر`}
        />
      </div>

      {/* ============ الفلاتر ============ */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Chip active={filter === 'abandoned'} onClick={() => setFilter('abandoned')}>
          سلات متروكة ({stats.abandoned})
        </Chip>
        <Chip active={filter === 'ordered'} onClick={() => setFilter('ordered')}>
          أتمّوا الطلب ({stats.ordered})
        </Chip>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          الكل ({stats.total})
        </Chip>
      </div>

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

      {/* ============ القايمة ============ */}
      {visible.length === 0 ? (
        <div className="card px-6 py-20 text-center">
          <UserIcon className="mx-auto mb-4 h-9 w-9 text-mist/50" />
          <p className="display text-[17px] font-bold">مفيش حاجة هنا</p>
          <p className="mx-auto mt-3 max-w-[42ch] text-[13px] leading-relaxed text-mist">
            {stats.total === 0
              ? 'أول ما زائر يضيف حاجة للسلة هيظهر هنا بمساره كامل.'
              : 'جرّب فلتر تاني.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((row) => (
            <CustomerCard
              key={row.id}
              row={row}
              orders={ordersByRow[row.id] ?? []}
              onResult={flash}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/* ============================================================ */

function CustomerCard({
  row,
  orders,
  onResult,
}: {
  row: Row
  orders: OrderRow[]
  onResult: (text: string, ok: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [events, setEvents] = useState<
    { kind: string; label: string | null; created_at: string }[] | null
  >(null)
  const [pending, start] = useTransition()

  /* عنده أوردر متسجّل؟ الأوردرات هي المصدر الأصح — صف النشاط
     بيتحدّث لكن بيفضل واحد مهما طلب العميل كام مرة */
  const ordered = row.ordered || orders.length > 0
  const spent = orders.reduce((sum, o) => sum + Number(o.total), 0)

  /* الزرار الرئيسي بيتحدد من اللي ناقص العميل */
  const suggested = suggestReminder({
    stage: row.stage,
    name: row.name,
    phone: row.phone,
    address: row.address,
    governorate: row.governorate,
  })

  const missing = [
    !row.name?.trim() && 'الاسم',
    !row.phone?.trim() && 'الموبايل',
    !row.governorate?.trim() && 'المحافظة',
    !row.address?.trim() && 'العنوان',
  ].filter(Boolean) as string[]

  const toggle = () => {
    setOpen((v) => !v)
    if (!events) {
      start(async () => {
        const res = await getCustomerEvents(row.id)
        if (res.ok) setEvents(res.data)
      })
    }
  }

  const send = (kind: ReminderKind) =>
    start(async () => {
      const res = await sendReminder(row.id, kind)
      if (res.ok) {
        onResult(`التذكير اتبعت لـ ${res.data.email} ✓`, true)
        setEvents(null)
      } else {
        onResult(res.error, false)
      }
    })

  const waLink = row.phone
    ? `https://wa.me/${row.phone.replace(/^0/, '20')}?text=${encodeURIComponent(
        `السلام عليكم${row.name ? ` يا ${row.name.split(' ')[0]}` : ''} 👋\nسلتك في ${'ATLAS'} لسه مستنياك — تحب نكمّل الطلب مع بعض؟`
      )}`
    : null

  return (
    <div className="card overflow-hidden">
      {/* --- الرأس --- */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/8 px-4 py-4 lg:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13.5px] font-bold">
              {row.name?.trim() || 'زائر من غير اسم'}
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                ordered
                  ? 'bg-ok/15 text-ok'
                  : row.stage === 'filling'
                    ? 'bg-warn/15 text-warn'
                    : 'bg-brand-500/15 text-brand-300'
              }`}
            >
              {ordered ? STAGE_LABEL.ordered : (STAGE_LABEL[row.stage] ?? row.stage)}
            </span>

            {orders.length > 0 ? (
              <span className="nums rounded-full bg-white/8 px-2.5 py-1 text-[10.5px] font-bold text-foam/85">
                {orders.length === 1 ? 'أوردر واحد' : `${orders.length} أوردرات`} ·{' '}
                {formatPrice(spent)}
              </span>
            ) : (
              row.ordered &&
              row.order_code && (
                <span className="font-[family-name:var(--font-label)] text-[11px] text-mist">
                  {row.order_code}
                </span>
              )
            )}
          </div>

          {/* بيانات التواصل */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-mist">
            {row.email && (
              <span dir="ltr" className="flex items-center gap-1.5">
                <MailIcon className="h-3.5 w-3.5" />
                {row.email}
              </span>
            )}
            {row.phone && (
              <a
                href={`tel:${row.phone}`}
                dir="ltr"
                className="nums flex items-center gap-1.5 text-brand-300 hover:underline"
              >
                <PhoneIcon className="h-3.5 w-3.5" />
                {row.phone}
              </a>
            )}
            {(row.governorate || row.area) && (
              <span className="flex items-center gap-1.5">
                <PinIcon className="h-3.5 w-3.5" />
                {[row.area, row.governorate].filter(Boolean).join(' — ')}
              </span>
            )}
            <span className="nums flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              {dateFmt.format(new Date(row.updated_at))}
            </span>
          </div>

          {/* اللي ناقص */}
          {!row.ordered && missing.length > 0 && (
            <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11.5px]">
              <span className="text-mist">ناقص:</span>
              {missing.map((m) => (
                <span
                  key={m}
                  className="rounded-full bg-sale/12 px-2 py-0.5 font-bold text-sale"
                >
                  {m}
                </span>
              ))}
            </p>
          )}

          {row.last_field && !row.ordered && (
            <p className="mt-1.5 text-[11.5px] text-mist">
              آخر خانة وقف عندها: <b className="text-foam">{row.last_field}</b>
            </p>
          )}
        </div>

        <div className="text-left">
          <p className="nums display text-[18px] font-bold">
            {formatPrice(Number(row.cart_total))}
          </p>
          <p className="nums flex items-center justify-end gap-1.5 text-[11px] text-mist">
            <BagIcon className="h-3.5 w-3.5" />
            {row.cart_count} قطعة
          </p>
        </div>
      </div>

      {/* --- السلة --- */}
      {row.cart?.length > 0 && (
        <div className="px-4 py-3 lg:px-5">
          <ul className="space-y-1.5">
            {row.cart.map((item, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-3 text-[12px]"
              >
                <span className="min-w-0">
                  <span className="font-semibold">{item.name}</span>
                  {item.variants && Object.keys(item.variants).length > 0 && (
                    <span className="mr-2 text-[11px] text-mist">
                      {Object.entries(item.variants)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' · ')}
                    </span>
                  )}
                </span>
                <span className="nums shrink-0 text-mist">×{item.quantity}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            className="mt-3 flex items-center gap-1.5 text-[12px] font-bold text-brand-300 hover:underline"
          >
            <ChevronDownIcon
              className={`h-3.5 w-3.5 transition-transform duration-400 ${
                open ? 'rotate-180' : ''
              }`}
            />
            {open ? 'إخفاء المسار' : 'عرض مسار العميل'}
          </button>

          <div className="acc-body mt-3" data-open={open}>
            <div>
              {events === null ? (
                <p className="py-3 text-[12px] text-mist">بنحمّل المسار...</p>
              ) : events.length === 0 ? (
                <p className="py-3 text-[12px] text-mist">مفيش أحداث مسجّلة.</p>
              ) : (
                <ol className="space-y-2 rounded-xl border border-white/8 p-3.5">
                  {events.map((e, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[12px]">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-brand-500" />
                      <span className="min-w-0 flex-1">
                        <span className="font-semibold">
                          {EVENT_LABEL[e.kind] ?? e.kind}
                        </span>
                        {e.label && <span className="text-mist"> — {e.label}</span>}
                      </span>
                      <span className="nums shrink-0 text-[10.5px] text-mist">
                        {dateFmt.format(new Date(e.created_at))}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- التذكير — بيظهر طول ما فيه سلة لسه متسابة --- */}
      {!row.ordered && (
        <div className="border-t border-white/8 bg-abyss/40 px-4 py-4 lg:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] font-bold text-mist">
              التذكير المقترح حسب اللي ناقصه
            </p>

            {row.reminded_at && (
              <p className="nums text-[10.5px] text-mist">
                آخر تذكير: {dateFmt.format(new Date(row.reminded_at))}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {/* الزرار المقترح — بارز */}
            <button
              type="button"
              disabled={pending || !row.email}
              onClick={() => send(suggested)}
              title={row.email ? undefined : 'العميل مكتبش إيميل'}
              className="btn btn-primary btn-sm"
            >
              {pending ? (
                <SpinnerIcon className="a-spin h-3.5 w-3.5" />
              ) : (
                <MailIcon className="h-3.5 w-3.5" />
              )}
              <span>{reminderLabel(suggested)}</span>
            </button>

            {/* باقي الرسائل لو حبيت تختار غيرها */}
            {REMINDER_KINDS.filter((k) => k !== suggested).map((kind) => (
              <button
                key={kind}
                type="button"
                disabled={pending || !row.email}
                onClick={() => send(kind)}
                className="rounded-full border border-white/10 px-3 py-2 text-[11.5px] font-bold text-foam/80 transition-colors hover:border-brand-500/50 hover:text-brand-300 disabled:opacity-40"
              >
                {reminderLabel(kind)}
              </button>
            ))}

            {waLink && (
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 text-[11.5px] font-bold text-[#25d366] transition-colors hover:bg-[#25d366]/10"
              >
                <WhatsAppIcon className="h-3.5 w-3.5" />
                واتساب
              </a>
            )}
          </div>

          {!row.email && (
            <p className="mt-3 flex items-center gap-1.5 text-[11.5px] text-warn">
              <AlertIcon className="h-3.5 w-3.5 shrink-0" />
              العميل مكتبش إيميل — كلّمه واتساب
            </p>
          )}
        </div>
      )}

      {/* --- طلباته --- */}
      {orders.length > 0 ? (
        <div className="border-t border-white/8 bg-ok/[0.04] px-4 py-4 lg:px-5">
          <p className="mb-3 flex items-center gap-2 text-[11.5px] font-bold text-ok">
            <BoxIcon className="h-4 w-4" />
            طلباته ({orders.length})
          </p>

          <ul className="space-y-2">
            {orders.map((order) => {
              const status = getStatus(order.status)

              return (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl border border-white/8 bg-abyss/40 px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-[family-name:var(--font-label)] text-[11.5px] font-bold">
                        {order.order_code}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
                          STATUS_TONE[status.tone] ?? STATUS_TONE.gray
                        }`}
                      >
                        {status.label}
                      </span>

                      <VendoorTag order={order} />
                    </div>

                    <p className="nums mt-1.5 text-[11px] text-mist">
                      {dateFmt.format(new Date(order.created_at))}
                    </p>
                  </div>

                  <span className="nums text-[13px] font-extrabold">
                    {formatPrice(Number(order.total))}
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        row.ordered && (
          <div className="flex items-center gap-2 border-t border-white/8 bg-ok/6 px-4 py-3 text-[12px] font-bold text-ok lg:px-5">
            <BoxIcon className="h-4 w-4" />
            أتمّ الطلب {row.order_code ? `— ${row.order_code}` : ''}
          </div>
        )
      )}
    </div>
  )
}

/* ------------------------------------------------------------
   حالة الأوردر عند فيندور — أهم حاجة تبان بسرعة: وصلهم ولا
   محتاج تبعته بإيدك.
   ------------------------------------------------------------ */
function VendoorTag({ order }: { order: OrderRow }) {
  if (order.vendoor_status === 'sent') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-ok/12 px-2.5 py-1 text-[10.5px] font-bold text-ok">
        <CheckIcon className="h-3 w-3" />
        فيندور{order.vendoor_order_code ? ` ${order.vendoor_order_code}` : ''}
      </span>
    )
  }

  if (!order.vendoor_status || order.vendoor_status === 'skipped') return null

  return (
    <span
      title={order.vendoor_error ?? undefined}
      className="flex items-center gap-1 rounded-full bg-sale/12 px-2.5 py-1 text-[10.5px] font-bold text-sale"
    >
      <AlertIcon className="h-3 w-3" />
      ما اتبعتش لفيندور
    </span>
  )
}

/* ============================================================ */

function Stat({
  label,
  value,
  note,
  alert = false,
}: {
  label: string
  value: string
  /** سطر صغير تحت الرقم */
  note?: string
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
      <p className={`nums display mt-1.5 text-[21px] font-bold ${hot ? 'grad-text' : ''}`}>
        {value}
      </p>
      {note && <p className="nums mt-0.5 text-[10.5px] text-mist">{note}</p>}
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
