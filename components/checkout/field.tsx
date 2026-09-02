import { AlertIcon } from '@/components/ui/icons'

/* ============================================================
   حقول نموذج إتمام الطلب
   ============================================================ */

export function FormBlock({
  index,
  title,
  hint,
  children,
  last = false,
}: {
  index: string
  title: string
  hint?: string
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <section className={last ? '' : 'mb-8 border-b border-white/8 pb-8'}>
      <div className="mb-5 flex items-baseline gap-3.5">
        <span className="font-[family-name:var(--font-label)] text-[10.5px] font-semibold text-brand-500/70">
          {index}
        </span>
        <div>
          <h2 className="display text-[16px] font-bold">{title}</h2>
          {hint && <p className="mt-1 text-[11.5px] text-mist">{hint}</p>}
        </div>
      </div>

      <div className="space-y-4">{children}</div>
    </section>
  )
}

export function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required = false,
  multiline = false,
  type = 'text',
  ...rest
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  hint?: string
  required?: boolean
  multiline?: boolean
  type?: string
  placeholder?: string
  autoComplete?: string
  inputMode?: 'tel' | 'text' | 'email'
  dir?: 'ltr' | 'rtl'
}) {
  const cls = `field ${error ? 'field-error' : ''}`

  return (
    <div id={`field-${id}`} className="scroll-mt-32">
      <label htmlFor={id} className="label">
        {label} {required && <span className="text-sale">*</span>}
      </label>

      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-none`}
          {...rest}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          {...rest}
        />
      )}

      {error ? (
        <ErrorText>{error}</ErrorText>
      ) : hint ? (
        <p className="mt-2 text-[11.5px] text-mist">{hint}</p>
      ) : null}
    </div>
  )
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-sale">
      <AlertIcon className="h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  )
}

/** خيار مختار دايمًا — الشحن والدفع مالهمش بدايل */
export function LockedOption({
  icon,
  title,
  price,
  text,
}: {
  icon: React.ReactNode
  title: string
  price?: string
  text: string
}) {
  return (
    <div className="rim rim-on relative flex items-start gap-3.5 rounded-2xl bg-white/4 p-4">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-brand-500">
        <span className="h-2 w-2 rounded-full bg-brand-500" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-[13.5px] font-extrabold">
            <span className="text-brand-400">{icon}</span>
            {title}
          </span>
          {price && <span className="nums text-[13.5px] font-extrabold">{price}</span>}
        </div>
        <p className="mt-2 text-[12px] leading-[1.9] text-mist">{text}</p>
      </div>
    </div>
  )
}
