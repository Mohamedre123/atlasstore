'use client'

import { useId, useState } from 'react'
import { ChevronDownIcon } from './icons'

/* ============================================================
   أكورديون
   ------------------------------------------------------------
   الفتح والقفل بـ grid-template-rows من 0fr لـ 1fr — الطريقة
   الوحيدة اللي بتدّي حركة ناعمة على ارتفاع مش معروف من غير
   جافاسكريبت بيقيس العناصر.
   ============================================================ */
export function Accordion({
  title,
  children,
  defaultOpen = false,
  icon,
}: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  icon?: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()

  return (
    <div className="border-b border-white/8 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="flex w-full items-center justify-between gap-4 py-5 text-right transition-colors duration-300 hover:text-brand-300"
      >
        <span className="flex items-center gap-3">
          {icon && <span className="text-brand-400">{icon}</span>}
          <span className="text-[14px] font-bold">{title}</span>
        </span>

        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
            open ? 'rotate-180 border-brand-500/50 bg-brand-500/12' : ''
          }`}
        >
          <ChevronDownIcon className="h-4 w-4" />
        </span>
      </button>

      <div id={id} className="acc-body" data-open={open}>
        <div>
          <div className="pb-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
