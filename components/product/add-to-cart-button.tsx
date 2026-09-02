'use client'

import { useEffect, useRef, useState } from 'react'
import { BagIcon, CheckIcon } from '@/components/ui/icons'

/* ============================================================
   زرار «أضف للسلة»
   ------------------------------------------------------------
   الحركة: موجة كحلي بتملى الزرار من تحت لفوق، وقطعة بتطير
   جوه الشنطة، وبعدها الزرار بيقول «في السلة» — وبعد الحركة
   بننادي onDone عشان درج السلة يفتح، مش في نصّها.

   onAction بيرجع true لو الإضافة نجحت. لو رجّع false (مثلاً
   العميل ما اختارش المقاس) الزرار بيرجع لحالته على طول.
   ============================================================ */

type State = 'idle' | 'busy' | 'done'

export function AddToCartButton({
  label = 'أضف إلى السلة',
  labelDone = 'اتضاف للسلة',
  onAction,
  onDone,
  disabled = false,
  resetAfter = 2400,
  className = '',
}: {
  label?: string
  labelDone?: string
  onAction: () => boolean
  onDone?: () => void
  disabled?: boolean
  resetAfter?: number
  className?: string
}) {
  const [state, setState] = useState<State>('idle')
  const timers = useRef<number[]>([])

  /* بننضّف أي مؤقتات شغالة لو العنصر اتشال من الصفحة */
  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t))
    },
    []
  )

  const run = () => {
    if (state !== 'idle' || disabled) return
    if (!onAction()) return

    setState('busy')

    timers.current.push(
      window.setTimeout(() => {
        setState('done')
        onDone?.()
      }, 820)
    )

    timers.current.push(window.setTimeout(() => setState('idle'), resetAfter))
  }

  return (
    <button
      type="button"
      onClick={run}
      disabled={disabled}
      data-state={state}
      aria-live="polite"
      className={`addbtn ${className}`}
    >
      <span className="addbtn__wave" aria-hidden="true" />

      <span className="addbtn__face addbtn__face--idle">
        <BagIcon className="h-[18px] w-[18px]" />
        <span>{label}</span>
      </span>

      <span className="addbtn__fly" aria-hidden="true">
        <BagIcon className="h-5 w-5" />
      </span>

      <span className="addbtn__face addbtn__face--done">
        <CheckIcon className="h-[18px] w-[18px]" />
        <span>{labelDone}</span>
      </span>
    </button>
  )
}
