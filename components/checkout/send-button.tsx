'use client'

import { useEffect, useRef, useState } from 'react'
import { BoxIcon, CheckIcon } from '@/components/ui/icons'

/* ============================================================
   زرار تأكيد الطلب
   ------------------------------------------------------------
   ثلاث حالات:
   • idle → «تأكيد الطلب» بتدرّج اللوجو
   • busy → الزرار بيغمق، قوس بيلف، وخط توصيل تحت بيتملي
   • done → علامة صح و«اتسجّل الطلب» وبعدها onDone

   onAction بيرجع true لو الأوردر اتبعت بنجاح. لو رجّع false
   (خطأ في البيانات أو في السيرفر) الزرار بيرجع idle عشان
   العميل يجرّب تاني.
   ============================================================ */

type State = 'idle' | 'busy' | 'done'

export function SendButton({
  label = 'تأكيد الطلب',
  labelBusy = 'بنسجّل طلبك',
  labelDone = 'اتسجّل الطلب',
  onAction,
  onDone,
  disabled = false,
}: {
  label?: string
  labelBusy?: string
  labelDone?: string
  onAction: () => Promise<boolean>
  onDone?: () => void
  disabled?: boolean
}) {
  const [state, setState] = useState<State>('idle')
  const timers = useRef<number[]>([])

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    []
  )

  const run = async () => {
    if (state !== 'idle' || disabled) return

    setState('busy')

    const ok = await onAction()

    if (!ok) {
      setState('idle')
      return
    }

    /* بنسيب الحركة تكمّل لحظة قبل ما ننتقل لصفحة التأكيد */
    setState('done')
    timers.current.push(window.setTimeout(() => onDone?.(), 900))
  }

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={disabled || state !== 'idle'}
      data-state={state}
      aria-live="polite"
      className="sendbtn"
    >
      <span className="sendbtn__label" data-on={state === 'idle'}>
        <BoxIcon className="h-[18px] w-[18px]" />
        {label}
      </span>

      <span className="sendbtn__label" data-on={state === 'busy'}>
        <span className="sendbtn__ring" aria-hidden="true" />
        {labelBusy}
        <span className="sendbtn__dots" aria-hidden="true">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </span>
      </span>

      <span className="sendbtn__label" data-on={state === 'done'}>
        <CheckIcon className="h-[19px] w-[19px]" />
        {labelDone}
      </span>

      <span className="sendbtn__track" aria-hidden="true">
        <span />
      </span>
    </button>
  )
}
