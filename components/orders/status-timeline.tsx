import { CheckIcon } from '@/components/ui/icons'
import { ORDER_STATUSES, type OrderStatus } from '@/lib/admin'

/* ============================================================
   مسار الطلب
   ------------------------------------------------------------
   بيوري الخطوات من «جديد» لـ«تم التسليم» — المخلّصة بعلامة
   صح، والحالية بنبضة، واللي لسه بلون باهت.

   الأوردر الملغي بياخد مسار مختصر بلون أحمر بدل ما نوريه
   خطوات مش هتحصل.
   ============================================================ */

const FLOW: OrderStatus[] = ['new', 'confirmed', 'preparing', 'shipping', 'delivered']

const dateFmt = new Intl.DateTimeFormat('ar-EG', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Africa/Cairo',
})

export function StatusTimeline({
  status,
  events = [],
}: {
  status: OrderStatus
  events?: { status: string; created_at: string }[]
}) {
  const when = new Map(events.map((e) => [e.status, e.created_at]))

  if (status === 'cancelled') {
    return (
      <div className="rounded-2xl border border-sale/25 bg-sale/8 px-5 py-5 text-center">
        <p className="text-[14px] font-extrabold text-sale">الطلب اتلغى</p>
        {when.get('cancelled') && (
          <p className="nums mt-2 text-[11.5px] text-mist">
            {dateFmt.format(new Date(when.get('cancelled')!))}
          </p>
        )}
        <p className="mt-3 text-[12.5px] leading-relaxed text-mist">
          لو ده حصل بالغلط أو عايز تطلب تاني، كلّمنا واتساب.
        </p>
      </div>
    )
  }

  const current = Math.max(0, FLOW.indexOf(status))

  return (
    <ol className="relative">
      {FLOW.map((key, i) => {
        const def = ORDER_STATUSES.find((s) => s.key === key)
        const done = i < current
        const active = i === current
        const time = when.get(key)

        return (
          <li key={key} className="relative flex gap-4 pb-7 last:pb-0">
            {/* الخط الواصل */}
            {i < FLOW.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute right-[15px] top-8 h-[calc(100%-14px)] w-px ${
                  done ? 'bg-brand-500/60' : 'bg-white/10'
                }`}
              />
            )}

            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[10px] font-extrabold ${
                done
                  ? 'border-transparent bg-brand-600 text-ink'
                  : active
                    ? 'border-transparent bg-[image:var(--grad-soft)] text-ink shadow-[var(--glow-sm)]'
                    : 'border-white/12 bg-abyss text-mist'
              }`}
            >
              {done ? (
                <CheckIcon className="h-4 w-4" />
              ) : (
                String(i + 1).padStart(2, '0')
              )}
            </span>

            <div className="min-w-0 flex-1 pt-1">
              <p
                className={`text-[13.5px] font-bold ${
                  done || active ? 'text-foam' : 'text-mist'
                }`}
              >
                {def?.label ?? key}
              </p>

              {def?.hint && (
                <p className="mt-1 text-[11.5px] leading-relaxed text-mist">
                  {def.hint}
                </p>
              )}

              {time && (
                <p className="nums mt-1.5 text-[11px] text-brand-300/80">
                  {dateFmt.format(new Date(time))}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
